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
  type VerdictOptions,
} from "@/lib/routes/recon-geo";

/** 預設平均騎乘速度（km/h），用於估算抵達各路段的時間。可依使用者設定覆寫。 */
export const DEFAULT_CYCLING_SPEED_KMH = 20;

export interface RainfallBucket {
  startTime: string;
  endTime: string;
  pop: number;
  label: string;
  endLabel: string;
}

export interface DistrictWeather {
  rainProbability: number;
  windSpeedKmh: number;
  temperature: number;
  condition: RouteSegment["condition"];
  /** 判讀所依據的預報時段（台灣時間標籤） */
  periodLabel: string | null;
  /** 完整降雨預報時段，供依 ETA 選擇適當時段 */
  rainfallBuckets?: RainfallBucket[];
}

export type WeatherLookup = ReadonlyMap<string, DistrictWeather>;

export const districtKey = (county: string, district: string) => `${county}|${district}`;

/**
 * 計算路段的預估抵達時間（ETA），基於起點里程與平均速度。
 * @param segmentStartKm 路段起點里程
 * @param departureTime 出發時間
 * @param avgSpeedKmh 平均速度（預設 DEFAULT_CYCLING_SPEED_KMH）
 * @returns 預估抵達時間
 */
export function estimateArrivalTime(
  segmentStartKm: number,
  departureTime: Date,
  avgSpeedKmh: number = DEFAULT_CYCLING_SPEED_KMH
): Date {
  const hoursToSegment = segmentStartKm / avgSpeedKmh;
  const msToSegment = hoursToSegment * 60 * 60 * 1000;
  return new Date(departureTime.getTime() + msToSegment);
}

/**
 * 依 ETA 選擇適當的降雨預報時段。
 * 若 ETA 落在某時段的 startTime ~ endTime 內，選該時段；
 * 否則選最接近的未來時段，或最後一個時段（若 ETA 已超過所有時段）。
 * @param eta 預估抵達時間
 * @param buckets 降雨預報時段陣列
 * @returns 選中的時段，或 null（若無時段資料）
 */
export function pickRainfallBucketByEta(
  eta: Date,
  buckets: RainfallBucket[]
): RainfallBucket | null {
  if (!buckets || buckets.length === 0) return null;

  const etaMs = eta.getTime();

  // 先找涵蓋 ETA 的時段
  for (const bucket of buckets) {
    const startMs = Date.parse(bucket.startTime);
    const endMs = Date.parse(bucket.endTime);
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && etaMs >= startMs && etaMs < endMs) {
      return bucket;
    }
  }

  // 找最接近的未來時段
  for (const bucket of buckets) {
    const startMs = Date.parse(bucket.startTime);
    if (!Number.isNaN(startMs) && startMs > etaMs) {
      return bucket;
    }
  }

  // 若 ETA 已超過所有時段，回傳最後一個
  return buckets[buckets.length - 1] ?? null;
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

export interface ApplyWeatherOptions {
  /** 出發時間，用於計算各路段的 ETA 並選擇對應的降雨時段 */
  departureTime?: Date;
  /** 平均速度（km/h），預設 DEFAULT_CYCLING_SPEED_KMH */
  avgSpeedKmh?: number;
}

/**
 * 把天氣合併進路段；查不到的路段標 hasWeather=false（數值不可當真）
 * 若提供 departureTime，會依各路段的 ETA 選擇對應的降雨預報時段；
 * 否則使用第一個時段（舊行為）。
 */
export function applyWeather(
  route: Route,
  lookup: WeatherLookup,
  options: ApplyWeatherOptions = {}
): Route {
  const { departureTime, avgSpeedKmh = DEFAULT_CYCLING_SPEED_KMH } = options;

  return {
    ...route,
    segments: route.segments.map((seg) => {
      const w = seg.county && seg.districtZh ? lookup.get(districtKey(seg.county, seg.districtZh)) : undefined;
      if (!w) return { ...seg, hasWeather: false };

      // 依 ETA 選擇降雨時段
      let rainProbability = w.rainProbability;
      if (departureTime && w.rainfallBuckets && w.rainfallBuckets.length > 0) {
        // 使用路段的第一個取樣里程作為起點里程
        const segmentStartKm = seg.sampleKms?.[0] ?? 0;
        const eta = estimateArrivalTime(segmentStartKm, departureTime, avgSpeedKmh);
        const bucket = pickRainfallBucketByEta(eta, w.rainfallBuckets);
        if (bucket) {
          rainProbability = bucket.pop;
        }
      }

      return {
        ...seg,
        rainProbability,
        windSpeed: w.windSpeedKmh,
        temperature: w.temperature,
        condition: w.condition,
        hasWeather: true,
      };
    }),
  };
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
  now?: Date;
  /** 路況事件取不到的縣市清單；null = 整個服務失敗 */
  eventsFailed?: string[] | null;
}

export function briefRoute(
  route: Route,
  lookup: WeatherLookup,
  eventsOrOptions: RoadEvent[] | BriefRouteOptions = [],
  nowParam?: Date
): RouteBriefing {
  // 兼容舊簽名：briefRoute(route, lookup, events[], now?)
  const isLegacyCall = Array.isArray(eventsOrOptions);
  const events = isLegacyCall ? eventsOrOptions : (eventsOrOptions.events ?? []);
  const now = isLegacyCall ? (nowParam ?? new Date()) : (eventsOrOptions.now ?? new Date());
  const eventsFailed = isLegacyCall ? undefined : eventsOrOptions.eventsFailed;

  // 使用 now 作為出發時間，依各路段的 ETA 選擇對應的降雨預報時段
  const enriched = applyWeather(route, lookup, { departureTime: now });
  const stages = deriveStages(enriched);
  const roadEvents = matchEventsToRoute(events, buildRoutePolylineKm(route), { now });
  const hazards = [...computeHazards(enriched, stages).filter(isWeatherHazard), ...eventHazards(roadEvents)].sort(
    (a, b) => a.startKm - b.startKm
  );

  const verdictOptions: VerdictOptions = { eventsFailed };

  const withWeather = enriched.segments.filter((s) => s.hasWeather);
  const temps = withWeather.map((s) => s.temperature);
  const firstKey = withWeather[0]?.county && withWeather[0]?.districtZh
    ? districtKey(withWeather[0].county, withWeather[0].districtZh)
    : null;

  return {
    id: route.id,
    name: route.nameZh || route.name,
    distanceKm: routeTotalKm(route),
    elevationGainM: route.elevationGain,
    verdict: summarizeVerdict(hazards, stages, verdictOptions),
    hazards,
    roadEvents,
    maxRain: withWeather.length ? Math.max(...withWeather.map((s) => s.rainProbability)) : null,
    maxWindKmh: withWeather.length ? Math.max(...withWeather.map((s) => s.windSpeed)) : null,
    temperature: temps.length ? { min: Math.min(...temps), max: Math.max(...temps) } : null,
    periodLabel: firstKey ? (lookup.get(firstKey)?.periodLabel ?? null) : null,
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
