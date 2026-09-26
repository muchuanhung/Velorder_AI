/**
 * CWB 預報新鮮度判斷
 * Next 的 fetch 快取過期後，第一個請求仍會拿到舊資料（背景才更新），
 * 冷門行政區可能拿到數週前的預報。以預報時段判斷是否過期。
 */

/** 預報最晚時段距今不足此時間即視為舊資料（鄉鎮預報正常涵蓋約 3 天） */
export const STALE_HORIZON_MS = 24 * 60 * 60 * 1000;

type ForecastTime = Record<string, unknown>;
type ForecastLocation = { WeatherElement?: Array<{ Time?: ForecastTime[] }> };

export function isForecastStale(forecastData: unknown, now = Date.now()): boolean {
  const locations = (forecastData as { records?: { Locations?: unknown } })?.records?.Locations;
  const locs = (Array.isArray(locations) ? locations : locations ? [locations] : []) as {
    Location?: ForecastLocation[];
  }[];
  let latest = 0;
  for (const el of locs[0]?.Location?.[0]?.WeatherElement ?? []) {
    for (const t of el.Time ?? []) {
      const raw = t.EndTime ?? t.DataTime ?? t.StartTime;
      const ts = typeof raw === "string" ? Date.parse(raw) : NaN;
      if (Number.isFinite(ts) && ts > latest) latest = ts;
    }
  }
  return latest > 0 && latest < now + STALE_HORIZON_MS;
}
