/**
 * Dashboard 今日判讀的資料組裝（伺服器端專用）
 * 路線與各行政區天氣平行抓取；同一縣市的 CWB 請求由 fetch 快取去重。
 */

import { loadRoutes } from "@/lib/routes/load-routes.server";
import { getCountyRainfallStations, getDistrictWeather } from "@/lib/cwb/district-weather.server";
import { getRoadEvents } from "@/lib/tdx/road-events.server";
import {
  briefRoute,
  mapCwbCondition,
  pickAlternative,
  routeDistrictKeys,
  withRouteObservedRain,
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
      /** 路況事件取不到的縣市；null 代表整個事件服務失敗 */
      eventsFailed: string[] | null;
    };

export async function getDashboardBriefing(routeId?: string): Promise<DashboardBriefing> {
  const routes = await loadRoutes();
  if (routes.length === 0) return { status: "no-routes" };

  const keys = routeDistrictKeys(routes);
  const counties = [...new Set(routes.flatMap((r) => r.segments.map((s) => s.county).filter((c): c is string => !!c)))];
  // 天氣與路況事件平行取得；事件失敗不影響天氣判讀
  const eventsPromise = getRoadEvents(counties).catch((e) => {
    console.warn("路況事件取得失敗:", e instanceof Error ? e.message : e);
    return null;
  });
  // 即時雨量站每縣市抓一次，再依各路線自己的座標篩 3 km 內測站
  const stationsPromise = Promise.all(
    counties.map(async (c) => [c, await getCountyRainfallStations(c)] as const)
  ).then((entries) => new Map(entries));
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
        rainfallBuckets: w.rainfall12h,
      };
      return [key, weather] as const;
    })
  );

  const lookup = new Map<string, DistrictWeather>();
  for (const r of results) {
    if (r.status === "fulfilled") lookup.set(r.value[0], r.value[1]);
    else console.warn("行政區天氣取得失敗:", r.reason instanceof Error ? r.reason.message : r.reason);
  }

  const [eventsResult, stationsByCounty] = await Promise.all([eventsPromise, stationsPromise]);
  const now = new Date();
  const eventsFailed = eventsResult ? eventsResult.failed : null;
  const briefings = routes.map((route) =>
    briefRoute(route, withRouteObservedRain(route, lookup, stationsByCounty), {
      events: eventsResult?.events ?? [],
      now,
      eventsFailed,
    })
  );
  const featured = briefings.find((b) => b.id === routeId) ?? briefings[0]!;

  return {
    status: "ok",
    featured,
    alternative: pickAlternative(featured, briefings),
    routes: briefings.map((b) => ({ id: b.id, name: b.name })),
    weatherCoverage: { ok: lookup.size, total: keys.length },
    eventsFailed,
  };
}
