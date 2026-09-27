import { test, expect } from "@playwright/test";
import {
  applyWeather,
  briefRoute,
  districtKey,
  mapCwbCondition,
  pickAlternative,
  type DistrictWeather,
} from "@/lib/dashboard/briefing";
import { makeRoute, segment, slopeProfile } from "../fixtures/route";

function weather(rain: number, extra: Partial<DistrictWeather> = {}): DistrictWeather {
  return {
    rainProbability: rain,
    windSpeedKmh: 5,
    temperature: 25,
    condition: "cloudy",
    periodLabel: "今天 12:00–18:00",
    ...extra,
  };
}

const lookupOf = (entries: Record<string, DistrictWeather>) =>
  new Map(Object.entries(entries).map(([district, w]) => [districtKey("台北市", district), w]));

test.describe("applyWeather", () => {
  test("查得到的行政區帶入天氣並標 hasWeather，查不到的標 false", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10]), segment("北投區", [20])] });
    const out = applyWeather(route, lookupOf({ 士林區: weather(70, { windSpeedKmh: 12 }) }));
    const [shilin, beitou] = out.segments;
    expect(shilin).toMatchObject({ rainProbability: 70, windSpeed: 12, hasWeather: true });
    expect(beitou!.hasWeather).toBe(false);
  });
});

test.describe("mapCwbCondition", () => {
  test("sunny 對應 clear；未知字串退回 cloudy", () => {
    expect(mapCwbCondition("sunny")).toBe("clear");
    expect(mapCwbCondition("stormy")).toBe("stormy");
    expect(mapCwbCondition("foggy")).toBe("cloudy");
  });
});

test.describe("briefRoute", () => {
  test("陡坡列為路線特性，不影響今日判讀", () => {
    const route = makeRoute({
      elevationProfile: slopeProfile(0.2),
      segments: [segment("士林區", [0, 5, 10, 15, 20])],
    });
    const b = briefRoute(route, lookupOf({ 士林區: weather(10) }));
    expect(b.gradeHazards.length).toBeGreaterThan(0);
    expect(b.weatherHazards).toHaveLength(0);
    expect(b.verdict.level).toBe("clear");
  });

  test("降雨達門檻判為危險，並帶出最高降雨與預報時段", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 5, 10, 15, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(70) }));
    expect(b.verdict.level).toBe("risky");
    expect(b.maxRain).toBe(70);
    expect(b.periodLabel).toBe("今天 12:00–18:00");
  });

  test("完全沒有天氣資料時為未判定，數值為 null", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 20])] });
    const b = briefRoute(route, new Map());
    expect(b.verdict.level).toBe("unknown");
    expect(b.maxRain).toBeNull();
    expect(b.temperature).toBeNull();
  });
});

test.describe("pickAlternative", () => {
  const lookup = lookupOf({ 士林區: weather(70), 北投區: weather(45), 內湖區: weather(0) });
  const brief = (id: string, district: string, distance = 20) =>
    briefRoute(makeRoute({ id, distance, segments: [segment(district, [0, 5, 10, 15, distance])] }), lookup);

  const risky = brief("risky", "士林區");
  const caution = brief("caution", "北投區");
  const clearLong = brief("clear-long", "內湖區", 20);
  const clearShort = brief("clear-short", "內湖區", 10);

  test("挑出比目前更安全的路線中最安全、再比距離短者", () => {
    expect(pickAlternative(risky, [risky, caution, clearLong, clearShort])?.id).toBe("clear-short");
  });

  test("只有同級或更危險的路線時不推薦", () => {
    expect(pickAlternative(caution, [caution, risky])).toBeNull();
  });

  test("目前路線已安全或未判定時不推薦", () => {
    const unknown = briefRoute(makeRoute({ id: "u", segments: [segment("萬華區", [0, 20])] }), lookup);
    expect(pickAlternative(clearLong, [clearLong, clearShort])).toBeNull();
    expect(pickAlternative(unknown, [unknown, clearShort])).toBeNull();
  });
});
