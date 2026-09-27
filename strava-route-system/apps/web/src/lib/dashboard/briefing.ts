/**
 * Dashboard「今日判讀」的純函式：天氣合併、判定、替代路線
 * 不依賴 React 與伺服器，可單元測試。
 *
 * 判定原則：今日判讀只看「今天的條件」（降雨、風、雷雨）；
 * 陡坡是路線本身的特性，另列「路線特性」，不影響判讀顏色，
 * 否則陡的路線天天都是危險，示警會失去可信度。
 */

import type { Route, RouteSegment } from "@/lib/routes/route-data";
import {
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
  /** 今日判讀（只看天氣） */
  verdict: ReconVerdict;
  weatherHazards: Hazard[];
  /** 路線特性：陡坡，不影響今日判讀 */
  gradeHazards: Hazard[];
  maxRain: number | null;
  maxWindKmh: number | null;
  temperature: { min: number; max: number } | null;
  periodLabel: string | null;
  elevationProfile: [number, number][];
}

export function briefRoute(route: Route, lookup: WeatherLookup): RouteBriefing {
  const enriched = applyWeather(route, lookup);
  const stages = deriveStages(enriched);
  const hazards = computeHazards(enriched, stages);
  const weatherHazards = hazards.filter(isWeatherHazard);
  const gradeHazards = hazards.filter((h) => !isWeatherHazard(h));

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
    verdict: summarizeVerdict(weatherHazards, stages),
    weatherHazards,
    gradeHazards,
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
        a.weatherHazards.length - b.weatherHazards.length ||
        a.distanceKm - b.distanceKm
    );
  return candidates[0] ?? null;
}
