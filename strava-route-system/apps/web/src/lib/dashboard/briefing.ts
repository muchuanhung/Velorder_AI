/**
 * Dashboard「今日判讀」的純函式：天氣合併、判定、替代路線
 * 不依賴 React 與伺服器，可單元測試。
 *
 * 判定原則：今日判讀只看「今天的條件」（降雨、風、雷雨，以及路況事件中的災害、事故、管制、天氣、異常告警）；
 * 施工與壅塞只列出不影響判讀；陡坡是路線固定的特性，不列入示警也不影響判讀，
 * 否則陡的路線天天都是危險，示警會失去可信度。
 */

import type { Route, RouteSegment } from "@/lib/routes/route-data";
import { eventHazards, matchEventsToRoute, type RoadEvent, type RouteEvent } from "@/lib/routes/road-events";
import {
  buildRoutePolylineKm,
  computeHazards,
  deriveStages,
  isWeatherHazard,
  routeTotalKm,
  summarizeVerdict,
  type Hazard,
  type ReconVerdict,
  type VerdictLevel,
} from "@/lib/routes/recon-geo";
import { normalizeCountyForCWB } from "@/lib/cwb/county-map";
import { summarizeRainfall, type LatLon, type StationRain } from "@/lib/cwb/rainfall-stations";
import {
  DEFAULT_CYCLING_SPEED_KMH,
  pickRainfallBucketForSegment,
  type RainfallBucket,
} from "@/lib/cwb/forecast-eta";

export interface DistrictWeather {
  /** 第一個預報時段的降雨機率；沒有 rainfallBuckets 或未指定出發時間時使用 */
  rainProbability: number;
  windSpeedKmh: number;
  temperature: number;
  condition: RouteSegment["condition"];
  /** 第一個預報時段（台灣時間標籤） */
  periodLabel: string | null;
  /** 完整降雨機率時段，依各路段 ETA 挑選 */
  rainfallBuckets?: RainfallBucket[];
  /** 路線 3 km 內雨量站的即時時雨量（mm/hr）；null 為附近沒有測站，未提供時不列入判定 */
  observedRainMmPerHr?: number | null;
}

export type WeatherLookup = ReadonlyMap<string, DistrictWeather>;

export const districtKey = (county: string, district: string) => `${county}|${district}`;

const weatherOf = (seg: RouteSegment, lookup: WeatherLookup) =>
  seg.county && seg.districtZh ? lookup.get(districtKey(seg.county, seg.districtZh)) : undefined;

/** 路段騎經時間所落在的降雨時段；沒有出發時間或時段資料時回傳 null */
function bucketForSegment(
  seg: RouteSegment,
  w: DistrictWeather,
  { departureTime, speedKmh = DEFAULT_CYCLING_SPEED_KMH }: ApplyWeatherOptions
): RainfallBucket | null {
  if (!departureTime || !w.rainfallBuckets?.length) return null;
  return pickRainfallBucketForSegment(seg.sampleKms, departureTime, w.rainfallBuckets, speedKmh);
}

/** CWB condition → 路段 condition */
export function mapCwbCondition(c: string): RouteSegment["condition"] {
  if (c === "sunny") return "clear";
  if (c === "rainy" || c === "stormy" || c === "cloudy") return c;
  return "cloudy";
}

/** 路線涵蓋的所有行政區鍵（去重） */
export function routeDistrictKeys(routes: Route[]): string[] {
  const keys = new Set<string>();
  for (const r of routes) {
    for (const s of r.segments) if (s.county && s.districtZh) keys.add(districtKey(s.county, s.districtZh));
  }
  return [...keys];
}

/**
 * 各行政區在路線上的取樣座標（依 sampleKms 對到 polyline 上最近里程的點），
 * 供即時雨量只採路線 3 km 內測站。多條路線經過同一區時合併。
 */
export function routeDistrictPoints(routes: Route[]): Map<string, LatLon[]> {
  const out = new Map<string, LatLon[]>();
  for (const route of routes) {
    const poly = buildRoutePolylineKm(route);
    if (!poly) continue;
    for (const seg of route.segments) {
      if (!seg.county || !seg.districtZh || !seg.sampleKms?.length) continue;
      const key = districtKey(seg.county, seg.districtZh);
      const points = out.get(key) ?? [];
      for (const km of seg.sampleKms) {
        const i = nearestIndex(poly.cumulativeKm, km);
        const [lat, lon] = poly.points[i]!;
        points.push({ lat, lon });
      }
      out.set(key, points);
    }
  }
  return out;
}

/**
 * 此路線專用的天氣查詢表：即時雨量只採「這條路線」經過各行政區的座標 3 km 內測站，
 * 避免同區其他路線旁的雨影響本路線。縣市測站取不到或附近沒有測站時為 null。
 */
export function withRouteObservedRain(
  route: Route,
  lookup: WeatherLookup,
  stationsByCounty: ReadonlyMap<string, StationRain[] | null>
): WeatherLookup {
  const points = routeDistrictPoints([route]);
  const out = new Map(lookup);
  for (const [key, near] of points) {
    const w = lookup.get(key);
    if (!w) continue;
    const stations = stationsByCounty.get(key.split("|")[0]!);
    const rain = stations ? summarizeRainfall(stations, near) : null;
    out.set(key, { ...w, observedRainMmPerHr: rain?.scope === "nearby" ? rain.mmPerHr : null });
  }
  return out;
}

/** 遞增陣列中最接近 target 的索引 */
function nearestIndex(sorted: number[], target: number): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid]! < target) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && Math.abs(sorted[lo - 1]! - target) <= Math.abs(sorted[lo]! - target) ? lo - 1 : lo;
}

export interface ApplyWeatherOptions {
  /** 出發時間；提供時各路段的降雨機率改用其 ETA 所在的時段 */
  departureTime?: Date;
  speedKmh?: number;
}

/**
 * 把天氣合併進路段；查不到的路段標 hasWeather=false（數值不可當真）。
 * 風速、氣溫、天氣現象仍是第一個預報時段（CWB 這些欄位目前只取第一筆）。
 */
export function applyWeather(route: Route, lookup: WeatherLookup, options: ApplyWeatherOptions = {}): Route {
  return {
    ...route,
    segments: route.segments.map((seg) => {
      const w = weatherOf(seg, lookup);
      if (!w) return { ...seg, hasWeather: false };
      return {
        ...seg,
        rainProbability: bucketForSegment(seg, w, options)?.pop ?? w.rainProbability,
        windSpeed: w.windSpeedKmh,
        temperature: w.temperature,
        condition: w.condition,
        hasWeather: true,
        observedRainMmPerHr: w.observedRainMmPerHr,
      };
    }),
  };
}

/** 判讀實際用到的預報時段：各路段 ETA 時段的最早開始到最晚結束；沒有時段資料時退回第一個路段的時段 */
function usedPeriodLabel(route: Route, lookup: WeatherLookup, options: ApplyWeatherOptions): string | null {
  const used: RainfallBucket[] = [];
  let fallback: string | null = null;
  for (const seg of route.segments) {
    const w = weatherOf(seg, lookup);
    if (!w) continue;
    fallback ??= w.periodLabel;
    const bucket = bucketForSegment(seg, w, options);
    if (bucket) used.push(bucket);
  }
  if (used.length === 0) return fallback;
  const first = used.reduce((a, b) => (Date.parse(b.startTime) < Date.parse(a.startTime) ? b : a));
  const last = used.reduce((a, b) => (Date.parse(b.endTime) > Date.parse(a.endTime) ? b : a));
  return `${first.label}–${last.endLabel}`;
}

/** 只保留此路線經過的縣市（事件失敗清單是所有路線共用的） */
function failedOnRoute(route: Route, eventsFailed: string[] | null | undefined): string[] | null | undefined {
  if (!eventsFailed) return eventsFailed;
  const onRoute = new Set(route.segments.map((s) => (s.county ? normalizeCountyForCWB(s.county) : "")));
  return eventsFailed.filter((c) => onRoute.has(normalizeCountyForCWB(c)));
}

export interface RouteBriefing {
  id: string;
  name: string;
  distanceKm: number;
  elevationGainM: number;
  /** 今日判讀：天氣＋影響判定的路況事件 */
  verdict: ReconVerdict;
  /** 影響判定的示警，依里程排序 */
  hazards: Hazard[];
  /** 沿途路況事件（含不影響判定的施工、壅塞、例行維護） */
  roadEvents: RouteEvent[];
  maxRain: number | null;
  maxWindKmh: number | null;
  temperature: { min: number; max: number } | null;
  periodLabel: string | null;
  elevationProfile: [number, number][];
}

export interface BriefRouteOptions {
  events?: RoadEvent[];
  /** 判讀時間，也是估算 ETA 的出發時間 */
  now?: Date;
  /** 路況事件取不到的縣市；null 代表整個事件服務失敗 */
  eventsFailed?: string[] | null;
}

export function briefRoute(
  route: Route,
  lookup: WeatherLookup,
  { events = [], now = new Date(), eventsFailed }: BriefRouteOptions = {}
): RouteBriefing {
  const weatherOptions: ApplyWeatherOptions = { departureTime: now };
  const enriched = applyWeather(route, lookup, weatherOptions);
  const stages = deriveStages(enriched);
  const roadEvents = matchEventsToRoute(events, buildRoutePolylineKm(route), { now });
  const hazards = [...computeHazards(enriched, stages).filter(isWeatherHazard), ...eventHazards(roadEvents)].sort(
    (a, b) => a.startKm - b.startKm
  );

  const withWeather = enriched.segments.filter((s) => s.hasWeather);
  const temps = withWeather.map((s) => s.temperature);

  return {
    id: route.id,
    name: route.nameZh || route.name,
    distanceKm: routeTotalKm(route),
    elevationGainM: route.elevationGain,
    verdict: summarizeVerdict(hazards, stages, { eventsFailed: failedOnRoute(route, eventsFailed) }),
    hazards,
    roadEvents,
    maxRain: withWeather.length ? Math.max(...withWeather.map((s) => s.rainProbability)) : null,
    maxWindKmh: withWeather.length ? Math.max(...withWeather.map((s) => s.windSpeed)) : null,
    temperature: temps.length ? { min: Math.min(...temps), max: Math.max(...temps) } : null,
    periodLabel: usedPeriodLabel(route, lookup, weatherOptions),
    elevationProfile: route.elevationProfile,
  };
}

/** 越小越安全；未判定不可拿來推薦 */
const SAFETY_RANK: Record<VerdictLevel, number> = { clear: 0, caution: 1, risky: 2, unknown: 99 };

/**
 * 建議替代路線：比目前路線「更安全」的路線中最安全者；
 * 同等級時示警少者優先，再比距離短者。
 * 目前路線已安全、未判定（無從比較），或沒有更安全的路線時回傳 null。
 */
export function pickAlternative(current: RouteBriefing, all: RouteBriefing[]): RouteBriefing | null {
  const level = current.verdict.level;
  if (level === "clear" || level === "unknown") return null;
  const currentRank = SAFETY_RANK[level];
  const candidates = all
    .filter((b) => b.id !== current.id && SAFETY_RANK[b.verdict.level] < currentRank)
    .sort(
      (a, b) =>
        SAFETY_RANK[a.verdict.level] - SAFETY_RANK[b.verdict.level] ||
        a.hazards.length - b.hazards.length ||
        a.distanceKm - b.distanceKm
    );
  return candidates[0] ?? null;
}
