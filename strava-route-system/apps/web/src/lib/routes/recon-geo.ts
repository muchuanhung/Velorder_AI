/**
 * 路線偵察畫面的純函式：里程對應、CCTV 錨點、示警計算
 * 不依賴 React，可單獨測試
 */

import type { CCTVFeed, Route, RouteSegment } from "./route-data";
import { haversineKm } from "./parse-gpx";
import { decodePolyline, isPolylineEncoded } from "./polyline";

/** 離路線超過此距離（km）的鏡頭不參與主畫面切換 */
export const ROUTE_CCTV_MAX_DIST_KM = 2.0;

export type RouteStage = {
  id: string;
  km: number;
  name: string;
  rainProbability: number;
  temperature: number;
  windSpeed: number;
  condition?: RouteSegment["condition"];
  /** 是否已取得 CWB 天氣；false 時數值為預設 0，顯示端須呈現「無資料」 */
  hasWeather?: boolean;
};

/** 單一路線上的 CCTV 錨點（供縮圖列與主畫面同步） */
export type CctvMarker = {
  id: string;
  km: number;
  name: string;
  location?: string;
  videoUrl?: string;
  lat?: number;
  lon?: number;
  /** CCTV 座標投影到 route polyline 的最短距離（km），用來排除離路很遠的鏡頭 */
  distToRouteKm?: number;
  status: "online" | "offline" | "degraded";
  lastUpdated?: string;
};

export interface ChartDataPoint {
  km: number;
  elevation: number;
}

export interface RoutePolylineKm {
  points: [number, number][];
  cumulativeKm: number[];
}

/** 取陣列中 km 最接近 target 的元素 */
export function nearestByKm<T extends { km: number }>(items: T[], target: number): T | null {
  if (items.length === 0) return null;
  return items.reduce((prev, curr) =>
    Math.abs(curr.km - target) < Math.abs(prev.km - target) ? curr : prev
  );
}

/** 解碼 gpxPreviewPath，並對齊每個點的累計里程 */
export function buildRoutePolylineKm(route: Route): RoutePolylineKm | null {
  const encoded = route.gpxPreviewPath;
  if (!encoded || !isPolylineEncoded(encoded)) return null;
  try {
    const points = decodePolyline(encoded);
    if (points.length < 2) return null;

    // 優先使用 route.elevationProfile 的 km 序列做對齊（避免 polyline 座標四捨五入造成 km 漂移）
    const profileKm = route.elevationProfile.map(([km]) => km);
    if (profileKm.length === points.length) {
      return { points, cumulativeKm: profileKm };
    }

    // 如果 elevationProfile 長度跟 polyline 不一致（例如 GPX 無 ele 時的降採樣），才回退用 haversine 累加
    const cumulativeKm: number[] = [0];
    let sum = 0;
    for (let i = 1; i < points.length; i++) {
      const [lat1, lon1] = points[i - 1]!;
      const [lat2, lon2] = points[i]!;
      sum += haversineKm(lat1, lon1, lat2, lon2);
      cumulativeKm.push(sum);
    }
    return { points, cumulativeKm };
  } catch {
    return null;
  }
}

/** 部分 CCTV 資料經緯度對調，依台灣範圍判斷並修正 */
export function normalizeLatLon(lat?: number, lon?: number): { lat: number; lon: number } | null {
  if (lat == null || lon == null) return null;
  const latLooksLon = lat >= 110 && lat <= 140;
  const lonLooksLat = lon >= 15 && lon <= 40;
  if (latLooksLon && lonLooksLat) {
    return { lat: lon, lon: lat };
  }
  return { lat, lon };
}

/** 將座標投影到路線 polyline，回傳對應里程與離路距離 */
export function mapLatLonToKm(
  lat: number,
  lon: number,
  points: [number, number][],
  cumulativeKm: number[]
): { km: number; distKm: number } | null {
  if (points.length < 2) return null;
  if (points.length !== cumulativeKm.length) return null;

  // 對整條 polyline 的每個線段做投影，取距離最小的那段，
  // 避免「後段彎曲時只看附近窗口會投錯里程」的問題。
  // 經緯度差是「度」，必須先轉弧度再乘地球半徑；漏轉會讓離路距離放大 57.3 倍
  const Rm = 6371000 * (Math.PI / 180); // 每度的公尺數
  let bestKm: number | null = null;
  let bestDistKm = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const [aLat, aLon] = points[i]!;
    const [bLat, bLon] = points[i + 1]!;

    const refLat = (aLat + bLat) / 2;
    const refLon = (aLon + bLon) / 2;
    const refLatRad = (refLat * Math.PI) / 180;

    const ax = (aLon - refLon) * Math.cos(refLatRad) * Rm;
    const ay = (aLat - refLat) * Rm;
    const bx = (bLon - refLon) * Math.cos(refLatRad) * Rm;
    const by = (bLat - refLat) * Rm;
    const px = (lon - refLon) * Math.cos(refLatRad) * Rm;
    const py = (lat - refLat) * Rm;

    const vx = bx - ax;
    const vy = by - ay;
    const vLen2 = vx * vx + vy * vy;
    if (vLen2 === 0) continue;

    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / vLen2));
    const distKm = Math.hypot(px - (ax + t * vx), py - (ay + t * vy)) / 1000;

    if (distKm < bestDistKm) {
      const segKm = (cumulativeKm[i + 1] ?? 0) - (cumulativeKm[i] ?? 0);
      bestKm = (cumulativeKm[i] ?? 0) + t * segKm;
      bestDistKm = distKm;
    }
  }

  if (bestKm == null) return null;
  return { km: bestKm, distKm: bestDistKm };
}

/** 路線總里程 */
export function routeTotalKm(route: Route): number {
  const ep = route.elevationProfile ?? [];
  return route.distance ?? (ep[ep.length - 1]?.[0] ?? 0);
}

/** 依 0、1/4、1/2、3/4、終點取樣，對應行政區天氣 */
export function deriveStages(route: Route): RouteStage[] {
  const ep = route.elevationProfile ?? [];
  const segs = route.segments ?? [];
  if (ep.length === 0) return [];
  const totalKm = routeTotalKm(route);
  const sampleKm = [0, totalKm * 0.25, totalKm * 0.5, totalKm * 0.75, totalKm].filter(
    (k, i, arr) => arr.indexOf(k) === i
  );

  // 有 sampleKms 時依里程找最近的行政區；舊資料（無 sampleKms）退回索引對應
  const hasSampleKms = segs.some((s) => s.sampleKms && s.sampleKms.length > 0);
  const segAtKm = (km: number, fallbackIdx: number) => {
    if (!hasSampleKms) return segs[Math.min(fallbackIdx, segs.length - 1)] ?? segs[0];
    let best = segs[0];
    let bestDist = Infinity;
    for (const seg of segs) {
      for (const sk of seg.sampleKms ?? []) {
        const d = Math.abs(sk - km);
        if (d < bestDist) {
          bestDist = d;
          best = seg;
        }
      }
    }
    return best;
  };

  return sampleKm.map((km, i) => {
    const seg = segAtKm(km, i);
    return {
      id: `stage-${i}`,
      km,
      name: seg?.districtZh ?? `路段 ${i + 1}`,
      rainProbability: seg?.rainProbability ?? 0,
      temperature: seg?.temperature ?? 0,
      windSpeed: seg?.windSpeed ?? 0,
      condition: seg?.condition,
      hasWeather: seg?.hasWeather ?? false,
    };
  });
}

/** 將 CCTV 清單投影到路線上，依里程排序。沒有鏡頭時回傳空陣列（不產生假錨點） */
export function buildCctvMarkers(
  route: Route,
  feeds: CCTVFeed[],
  routePolyline?: RoutePolylineKm | null
): CctvMarker[] {
  if (feeds.length === 0) return [];
  const totalKm = routeTotalKm(route);
  const n = feeds.length;
  const getDefaultKm = (i: number) => (n === 1 ? totalKm / 2 : (totalKm * (i + 1)) / (n + 1));

  return feeds
    .map((feed, i) => {
      const normalized = normalizeLatLon(feed.lat, feed.lon);
      const mapped =
        routePolyline && normalized
          ? mapLatLonToKm(normalized.lat, normalized.lon, routePolyline.points, routePolyline.cumulativeKm)
          : null;

      return {
        id: feed.id,
        km: mapped?.km ?? getDefaultKm(i),
        distToRouteKm: mapped?.distKm,
        name: feed.label || feed.location,
        location: feed.location || feed.label || undefined,
        videoUrl: feed.videoUrl,
        lat: normalized?.lat,
        lon: normalized?.lon,
        status: feed.status,
        lastUpdated: feed.lastUpdated,
      } satisfies CctvMarker;
    })
    .sort((a, b) => a.km - b.km);
}

/** 初始主畫面鏡頭：偏好陽明山至善路口，否則取離 GPX 起點最近的一台 */
export function pickInitialMarker(
  markers: CctvMarker[],
  routePolyline?: RoutePolylineKm | null
): CctvMarker | null {
  if (markers.length === 0) return null;

  // 若靜態補充的期望鏡頭存在，優先用它（避免剛好被同區其他近鏡頭搶走）
  const preferred =
    markers.find((m) => m.id.includes("bot236")) ??
    markers.find((m) => m.name.includes("至善路口"));
  if (preferred) return preferred;

  const startPoint = routePolyline?.points[0];
  if (!startPoint) return markers[0] ?? null;
  const [startLat, startLon] = startPoint;

  return markers.reduce((best, curr) => {
    if (best.lat == null || best.lon == null) return curr;
    if (curr.lat == null || curr.lon == null) return best;
    const dBest = haversineKm(startLat, startLon, best.lat, best.lon);
    const dCurr = haversineKm(startLat, startLon, curr.lat, curr.lon);
    return dCurr < dBest ? curr : best;
  }, markers[0]!);
}

/** 主畫面鏡頭：只在離路線 ≤ ROUTE_CCTV_MAX_DIST_KM 的鏡頭中挑，沒有就退回全部 */
export function pickActiveMarker(markers: CctvMarker[], km: number): CctvMarker | null {
  const onRoute = markers.filter(
    (m) => m.distToRouteKm != null && m.distToRouteKm <= ROUTE_CCTV_MAX_DIST_KM
  );
  return nearestByKm(onRoute.length > 0 ? onRoute : markers, km);
}

// ---------------------------------------------------------------------------
// 示警
// ---------------------------------------------------------------------------

/** event：TDX 即時路況事件（災害、事故、管制、天氣、異常告警），由 lib/routes/road-events 產生 */
export type HazardKind = "rain" | "wind" | "storm" | "climb" | "descent" | "event";
export type HazardLevel = "caution" | "risky";

export interface Hazard {
  id: string;
  kind: HazardKind;
  level: HazardLevel;
  startKm: number;
  endKm: number;
  /** 例：「降雨 70%」「陡降 14%」 */
  label: string;
}

/** 天氣類示警（降雨、風、雷雨）；陡坡屬路線特性，不列入出發判定 */
export const isWeatherHazard = (h: Hazard) => h.kind === "rain" || h.kind === "wind" || h.kind === "storm";

/** 天氣門檻，與 computeRouteStatus 一致 */
export const RAIN_CAUTION = 40;
export const RAIN_RISKY = 60;
export const WIND_CAUTION = 25;
export const WIND_RISKY = 35;

/** 坡度門檻（比例）與計算窗口 */
export const GRADE_CAUTION = 0.1;
export const GRADE_RISKY = 0.15;
const GRADE_WINDOW_KM = 0.3;

const LEVEL_RANK: Record<HazardLevel, number> = { caution: 1, risky: 2 };

export function rainLevel(pct: number): HazardLevel | null {
  if (pct >= RAIN_RISKY) return "risky";
  if (pct >= RAIN_CAUTION) return "caution";
  return null;
}

export function windLevel(kmh: number): HazardLevel | null {
  if (kmh >= WIND_RISKY) return "risky";
  if (kmh >= WIND_CAUTION) return "caution";
  return null;
}

/** 每個 stage 涵蓋的里程範圍：前後 stage 的中點 */
function stageRanges(stages: RouteStage[], totalKm: number): [number, number][] {
  return stages.map((s, i) => {
    const prev = stages[i - 1];
    const next = stages[i + 1];
    const start = prev ? (prev.km + s.km) / 2 : 0;
    const end = next ? (s.km + next.km) / 2 : totalKm;
    return [start, end];
  });
}

type RawHazard = Omit<Hazard, "id" | "label"> & { value: number };

/** 相鄰且同類型同等級的區段合併，保留最大值 */
function mergeAdjacent(items: RawHazard[]): RawHazard[] {
  const out: RawHazard[] = [];
  for (const h of items) {
    const last = out[out.length - 1];
    if (last && last.kind === h.kind && last.level === h.level && h.startKm - last.endKm < 1e-6) {
      last.endKm = h.endKm;
      last.value = Math.max(last.value, h.value);
    } else {
      out.push({ ...h });
    }
  }
  return out;
}

function weatherHazards(stages: RouteStage[], totalKm: number): RawHazard[] {
  const ranges = stageRanges(stages, totalKm);
  const byKind: Record<"rain" | "wind" | "storm", RawHazard[]> = { rain: [], wind: [], storm: [] };

  stages.forEach((s, i) => {
    if (!s.hasWeather) return;
    const [startKm, endKm] = ranges[i]!;
    const rain = rainLevel(s.rainProbability);
    if (rain) byKind.rain.push({ kind: "rain", level: rain, startKm, endKm, value: s.rainProbability });
    const wind = windLevel(s.windSpeed);
    if (wind) byKind.wind.push({ kind: "wind", level: wind, startKm, endKm, value: s.windSpeed });
    if (s.condition === "stormy") {
      byKind.storm.push({ kind: "storm", level: "risky", startKm, endKm, value: 0 });
    } else if (s.condition === "rainy" && !rain) {
      // 預報有雨但降雨機率未達門檻，與 computeRouteStatus 一致列為注意
      byKind.rain.push({ kind: "rain", level: "caution", startKm, endKm, value: s.rainProbability });
    }
  });

  return [...mergeAdjacent(byKind.rain), ...mergeAdjacent(byKind.wind), ...mergeAdjacent(byKind.storm)];
}

/** 以 ≥ 0.3 km 的水平窗口計算坡度，避免取樣密度造成的雜訊 */
function gradeHazards(profile: [number, number][]): RawHazard[] {
  const raw: RawHazard[] = [];
  let i = 0;
  while (i < profile.length - 1) {
    const [startKm, startEle] = profile[i]!;
    let j = i + 1;
    while (j < profile.length - 1 && profile[j]![0] - startKm < GRADE_WINDOW_KM) j++;
    const [endKm, endEle] = profile[j]!;
    const distKm = endKm - startKm;
    if (distKm > 0) {
      const grade = (endEle - startEle) / (distKm * 1000);
      const abs = Math.abs(grade);
      if (abs >= GRADE_CAUTION) {
        raw.push({
          kind: grade > 0 ? "climb" : "descent",
          level: abs >= GRADE_RISKY ? "risky" : "caution",
          startKm,
          endKm,
          value: Math.round(abs * 100),
        });
      }
    }
    i = j;
  }
  return mergeAdjacent(raw);
}

const KIND_LABEL: Record<HazardKind, (v: number) => string> = {
  rain: (v) => `降雨 ${v}%`,
  wind: (v) => `風速 ${v} km/h`,
  storm: () => "雷雨",
  climb: (v) => `陡升 ${v}%`,
  descent: (v) => `陡降 ${v}%`,
  // computeHazards 不產生 event；路況事件的標籤由 road-events 直接帶入
  event: () => "路況事件",
};

/** 全線示警，依起點里程排序 */
export function computeHazards(route: Route, stages: RouteStage[]): Hazard[] {
  const totalKm = routeTotalKm(route);
  const raw = [...weatherHazards(stages, totalKm), ...gradeHazards(route.elevationProfile ?? [])];
  return raw
    .sort((a, b) => a.startKm - b.startKm || LEVEL_RANK[b.level] - LEVEL_RANK[a.level])
    .map((h, i) => ({
      id: `${h.kind}-${i}`,
      kind: h.kind,
      level: h.level,
      startKm: h.startKm,
      endKm: h.endKm,
      label: KIND_LABEL[h.kind](h.value),
    }));
}

export type VerdictLevel = HazardLevel | "clear" | "unknown";

export interface ReconVerdict {
  level: VerdictLevel;
  /** 最嚴重示警的描述，例：「12.4 km 起降雨 70%」 */
  headline: string;
  /** 其他補充，例：「另有 2 項示警」「部分路段無天氣資料」 */
  note: string;
}

/** 全線判定：取最嚴重的示警；沒有任何天氣資料時為 unknown */
export function summarizeVerdict(hazards: Hazard[], stages: RouteStage[]): ReconVerdict {
  const withWeather = stages.filter((s) => s.hasWeather).length;
  const partial = withWeather > 0 && withWeather < stages.length;

  const worst = hazards.reduce<Hazard | null>(
    (best, h) => (!best || LEVEL_RANK[h.level] > LEVEL_RANK[best.level] ? h : best),
    null
  );

  const notes: string[] = [];
  if (worst && hazards.length > 1) notes.push(`另有 ${hazards.length - 1} 項示警`);
  if (partial) notes.push("部分路段無天氣資料");

  if (worst) {
    return {
      level: worst.level,
      headline: `${worst.startKm.toFixed(1)} km 起${worst.label}`,
      note: [withWeather === 0 ? "尚無天氣資料" : "", ...notes].filter(Boolean).join("・"),
    };
  }
  if (withWeather === 0) {
    return { level: "unknown", headline: "尚無天氣資料", note: "無法判定天氣風險" };
  }
  return { level: "clear", headline: "沿途無示警", note: notes.join("・") };
}
