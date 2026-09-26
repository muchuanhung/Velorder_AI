import { test, expect } from "@playwright/test";
import { isForecastStale } from "@/lib/cwb/forecast-freshness";

const NOW = Date.parse("2026-09-26T18:00:00+08:00");
const DAY = 24 * 60 * 60 * 1000;

function forecast(times: Array<Record<string, string>>, asArray = true) {
  const locations = { Location: [{ LocationName: "士林區", WeatherElement: [{ ElementName: "3小時降雨機率", Time: times }] }] };
  return { success: "true", records: { Locations: asArray ? [locations] : locations } };
}

const iso = (ms: number) => new Date(ms).toISOString();

test.describe("isForecastStale", () => {
  test("一個月前的預報視為過期", () => {
    const data = forecast([
      { StartTime: "2026-08-24T18:00:00+08:00", EndTime: "2026-08-25T06:00:00+08:00" },
      { StartTime: "2026-08-25T06:00:00+08:00", EndTime: "2026-08-27T06:00:00+08:00" },
    ]);
    expect(isForecastStale(data, NOW)).toBe(true);
  });

  test("兩天前發布、最晚時段只剩不到 24 小時的預報視為過期", () => {
    const data = forecast([{ StartTime: iso(NOW - 2 * DAY), EndTime: iso(NOW + 12 * 60 * 60 * 1000) }]);
    expect(isForecastStale(data, NOW)).toBe(true);
  });

  test("涵蓋未來 3 天的預報為新鮮", () => {
    const data = forecast([
      { StartTime: iso(NOW), EndTime: iso(NOW + 12 * 60 * 60 * 1000) },
      { StartTime: iso(NOW + 2 * DAY), EndTime: iso(NOW + 3 * DAY) },
    ]);
    expect(isForecastStale(data, NOW)).toBe(false);
  });

  test("只有 DataTime 的元素也能判斷", () => {
    expect(isForecastStale(forecast([{ DataTime: iso(NOW + 3 * DAY) }]), NOW)).toBe(false);
    expect(isForecastStale(forecast([{ DataTime: iso(NOW - 30 * DAY) }]), NOW)).toBe(true);
  });

  test("Locations 為單一物件時也能判斷", () => {
    const data = forecast([{ EndTime: iso(NOW - 30 * DAY) }], false);
    expect(isForecastStale(data, NOW)).toBe(true);
  });

  test("沒有任何時間欄位時不誤判為過期", () => {
    expect(isForecastStale(forecast([]), NOW)).toBe(false);
    expect(isForecastStale({}, NOW)).toBe(false);
    expect(isForecastStale(null, NOW)).toBe(false);
  });
});
