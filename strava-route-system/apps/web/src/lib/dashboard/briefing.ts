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

export interface DistrictWeather {
  rainProbability: number;
  windSpeedKmh: number;
  temperature: number;
  condition: RouteSegment["condition"];
  /** 判讀所依據的預報時段（台灣時間標籤） */
  periodLabel: string | null;
}

export type WeatherLookup = ReadonlyMap<string, DistrictWeather>;

export const districtKey = (county: string, district: string) => `${county}|${district}`;

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

/** 把天氣合併進路段；查不到的路段標 hasWeather=false（數值不可當真） */
export function applyWeather(route: Route, lookup: WeatherLookup): Route {
  return {
    ...route,
    segments: route.segments.map((seg) => {
      const w = seg.county && seg.districtZh ? lookup.get(districtKey(seg.county, seg.districtZh)) : undefined;
      if (!w) return { ...seg, hasWeather: false };
      return {
        ...seg,
        rainProbability: w.rainProbability,
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

export function briefRoute(
  route: Route,
  lookup: WeatherLookup,
  events: RoadEvent[] = [],
  now: Date = new Date()
): RouteBriefing {
  const enriched = applyWeather(route, lookup);
  const stages = deriveStages(enriched);
  const roadEvents = matchEventsToRoute(events, buildRoutePolylineKm(route), { now });
  const hazards = [...computeHazards(enriched, stages).filter(isWeatherHazard), ...eventHazards(roadEvents)].sort(
    (a, b) => a.startKm - b.startKm
  );

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
    verdict: summarizeVerdict(hazards, stages),
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
