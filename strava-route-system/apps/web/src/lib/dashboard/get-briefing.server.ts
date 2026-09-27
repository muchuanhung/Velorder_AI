/**
 * Dashboard 今日判讀的資料組裝（伺服器端專用）
 * 路線與各行政區天氣平行抓取；同一縣市的 CWB 請求由 fetch 快取去重。
 */

import { loadRoutes } from "@/lib/routes/load-routes.server";
import { getDistrictWeather } from "@/lib/cwb/district-weather.server";
import {
  briefRoute,
  mapCwbCondition,
  pickAlternative,
  routeDistrictKeys,
  type DistrictWeather,
  type RouteBriefing,
} from "@/lib/dashboard/briefing";

export type DashboardBriefing =
  | { status: "no-routes" }
  | {
      status: "ok";
      featured: RouteBriefing;
      alternative: RouteBriefing | null;
      routes: { id: string; name: string }[];
      /** 有天氣資料的行政區數 / 總數 */
      weatherCoverage: { ok: number; total: number };
    };

export async function getDashboardBriefing(routeId?: string): Promise<DashboardBriefing> {
  const routes = await loadRoutes();
  if (routes.length === 0) return { status: "no-routes" };

  const keys = routeDistrictKeys(routes);
  const results = await Promise.allSettled(
    keys.map(async (key) => {
      const [county, district] = key.split("|") as [string, string];
      const w = await getDistrictWeather(county, district);
      const first = w.rainfall12h[0];
      const weather: DistrictWeather = {
        rainProbability: first?.pop ?? 0,
        windSpeedKmh: w.windSpeedKmh,
        temperature: w.temperature,
        condition: mapCwbCondition(w.condition),
        periodLabel: first ? `${first.label}–${first.endLabel}` : null,
      };
      return [key, weather] as const;
    })
  );

  const lookup = new Map<string, DistrictWeather>();
  for (const r of results) {
    if (r.status === "fulfilled") lookup.set(r.value[0], r.value[1]);
    else console.warn("行政區天氣取得失敗:", r.reason instanceof Error ? r.reason.message : r.reason);
  }

  const briefings = routes.map((route) => briefRoute(route, lookup));
  const featured = briefings.find((b) => b.id === routeId) ?? briefings[0]!;

  return {
    status: "ok",
    featured,
    alternative: pickAlternative(featured, briefings),
    routes: briefings.map((b) => ({ id: b.id, name: b.name })),
    weatherCoverage: { ok: lookup.size, total: keys.length },
  };
}
