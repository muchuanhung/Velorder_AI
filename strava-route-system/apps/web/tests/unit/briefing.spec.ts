import { test, expect } from "@playwright/test";
import {
  applyWeather,
  briefRoute,
  districtKey,
  mapCwbCondition,
  pickAlternative,
  type DistrictWeather,
} from "@/lib/dashboard/briefing";
import type { RainfallBucket } from "@/lib/cwb/forecast-eta";
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

const lookupOf = (entries: Record<string, DistrictWeather>, county = "台北市") =>
  new Map(Object.entries(entries).map(([district, w]) => [districtKey(county, district), w]));

const bucket = (start: string, end: string, pop: number): RainfallBucket => ({
  startTime: `2026-10-01T${start}:00+08:00`,
  endTime: `2026-10-01T${end}:00+08:00`,
  pop,
  label: start,
  endLabel: end,
});

/** 08:00–10:00 降雨 10%、10:00–12:00 降雨 70% */
const MORNING_THEN_RAIN = [bucket("08:00", "10:00", 10), bucket("10:00", "12:00", 70)];
const AT_8AM = new Date("2026-10-01T08:00:00+08:00");

test.describe("applyWeather", () => {
  test("查得到的行政區帶入天氣並標 hasWeather，查不到的標 false", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10]), segment("北投區", [20])] });
    const out = applyWeather(route, lookupOf({ 士林區: weather(70, { windSpeedKmh: 12 }) }));
    const [shilin, beitou] = out.segments;
    expect(shilin).toMatchObject({ rainProbability: 70, windSpeed: 12, hasWeather: true });
    expect(beitou!.hasWeather).toBe(false);
  });

  test("有出發時間時，各路段取起點 ETA 所在的時段（20 km/h）", () => {
    // 士林區 0 km → 08:00；北投區 40 km → 10:00，進入第二個時段
    const route = makeRoute({ distance: 50, segments: [segment("士林區", [0, 20]), segment("北投區", [40, 50])] });
    const lookup = lookupOf({
      士林區: weather(10, { rainfallBuckets: MORNING_THEN_RAIN }),
      北投區: weather(10, { rainfallBuckets: MORNING_THEN_RAIN }),
    });
    const out = applyWeather(route, lookup, { departureTime: AT_8AM });
    expect(out.segments.map((s) => s.rainProbability)).toEqual([10, 70]);
  });

  test("沒有出發時間時維持第一個時段", () => {
    const route = makeRoute({ segments: [segment("北投區", [40])] });
    const out = applyWeather(route, lookupOf({ 北投區: weather(10, { rainfallBuckets: MORNING_THEN_RAIN }) }));
    expect(out.segments[0]!.rainProbability).toBe(10);
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
  test("陡坡不列入示警，也不影響今日判讀", () => {
    const route = makeRoute({
      elevationProfile: slopeProfile(0.2),
      segments: [segment("士林區", [0, 5, 10, 15, 20])],
    });
    const b = briefRoute(route, lookupOf({ 士林區: weather(10) }));
    expect(b.hazards).toHaveLength(0);
    expect(b.verdict.level).toBe("clear");
  });

  test("路線上的事故讓天氣良好的路線判為注意；施工只列出不影響判定", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 5, 10, 15, 20])] });
    const now = new Date("2026-09-27T12:00:00+08:00");
    const base = {
      description: "",
      lon: 121.55,
      source: "測試",
      effectiveTime: null,
      expireTime: null,
      updatedTime: null,
    };
    const work = { ...base, id: "work", type: 2, subType: 205, title: "道路施工", lat: 25.05 + 8 / 111 };
    const accident = { ...base, id: "acc", type: 1, subType: 101, title: "交通事故", lat: 25.05 + 5 / 111 };

    const onlyWork = briefRoute(route, lookupOf({ 士林區: weather(10) }), { events: [work], now });
    expect(onlyWork.verdict.level).toBe("clear");
    expect(onlyWork.roadEvents.map((e) => e.id)).toEqual(["work"]);

    const withAccident = briefRoute(route, lookupOf({ 士林區: weather(10) }), { events: [work, accident], now });
    expect(withAccident.verdict.level).toBe("caution");
    expect(withAccident.verdict.headline).toContain("事故：交通事故");
  });

  test("降雨達門檻判為危險，並帶出最高降雨與預報時段", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 5, 10, 15, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(70) }));
    expect(b.verdict.level).toBe("risky");
    expect(b.maxRain).toBe(70);
    expect(b.periodLabel).toBe("今天 12:00–18:00");
  });

  test("遠端路段 ETA 落在下雨時段：判為危險，預報時段標示涵蓋實際用到的時段", () => {
    const route = makeRoute({ distance: 50, segments: [segment("士林區", [0, 20]), segment("北投區", [40, 50])] });
    const lookup = lookupOf({
      士林區: weather(10, { rainfallBuckets: MORNING_THEN_RAIN }),
      北投區: weather(10, { rainfallBuckets: MORNING_THEN_RAIN }),
    });
    const b = briefRoute(route, lookup, { now: AT_8AM });
    expect(b.verdict.level).toBe("risky");
    expect(b.maxRain).toBe(70);
    expect(b.periodLabel).toBe("08:00–12:00");
  });

  test("預報過期時為未判定，原因 stale", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(10, { stale: true }) }), { now: AT_8AM });
    expect(b.verdict.level).toBe("unknown");
    expect(b.verdict.reasons).toEqual(["stale"]);
  });

  test("路段 ETA 超出最後一個預報時段時為未判定，原因 out_of_coverage", () => {
    // 北投區出口 100 km → 13:00，超出 12:00 結束的預報
    const route = makeRoute({ distance: 100, segments: [segment("士林區", [0, 20]), segment("北投區", [40, 100])] });
    const lookup = lookupOf({
      士林區: weather(10, { rainfallBuckets: [bucket("08:00", "10:00", 10), bucket("10:00", "12:00", 10)] }),
      北投區: weather(10, { rainfallBuckets: [bucket("08:00", "10:00", 10), bucket("10:00", "12:00", 10)] }),
    });
    const b = briefRoute(route, lookup, { now: AT_8AM });
    expect(b.verdict.level).toBe("unknown");
    expect(b.verdict.reasons).toEqual(["out_of_coverage"]);
  });

  test("超出預報時段的路段不拿其他時段數值產生示警，也不列入最高降雨", () => {
    // 北投區 40–100 km → 10:00–13:00 超出 12:00；即使第二時段降雨 90% 也不能拿來判危險
    const route = makeRoute({ distance: 100, segments: [segment("士林區", [0, 20]), segment("北投區", [40, 100])] });
    const buckets = [bucket("08:00", "10:00", 10), bucket("10:00", "12:00", 90)];
    const lookup = lookupOf({
      士林區: weather(10, { rainfallBuckets: buckets }),
      北投區: weather(90, { rainfallBuckets: buckets, windSpeedKmh: 50 }),
    });
    const b = briefRoute(route, lookup, { now: AT_8AM });
    expect(b.verdict.level).toBe("unknown");
    expect(b.verdict.reasons).toEqual(["out_of_coverage"]);
    expect(b.hazards).toEqual([]);
    expect(b.maxRain).toBe(10);
    expect(b.segments[1]).toMatchObject({ hasWeather: true, outOfCoverage: true });
  });

  test("回傳合併天氣後的路段、此路線的事件失敗縣市與建議出發時段", () => {
    const route = makeRoute({ distance: 50, segments: [segment("士林區", [0, 20]), segment("北投區", [40, 50])] });
    const lookup = lookupOf({
      士林區: weather(10, { rainfallBuckets: MORNING_THEN_RAIN }),
      北投區: weather(10, { rainfallBuckets: MORNING_THEN_RAIN }),
    });
    const b = briefRoute(route, lookup, { now: AT_8AM, eventsFailed: ["新北市", "台北市"] });
    expect(b.segments.every((s) => s.hasWeather)).toBe(true);
    expect(b.eventsFailed).toEqual(["台北市"]);
    expect(b.bestTimeToRide).toBe("08:00");
    expect(briefRoute(route, lookup, { now: AT_8AM, eventsFailed: null }).eventsFailed).toBeNull();
    expect(briefRoute(route, new Map(), { now: AT_8AM }).bestTimeToRide).toBeNull();
  });

  test("ETA 都在預報時段內且資料新，可判安全", () => {
    const route = makeRoute({ distance: 50, segments: [segment("士林區", [0, 20]), segment("北投區", [40, 50])] });
    const buckets = [bucket("08:00", "10:00", 10), bucket("10:00", "12:00", 10)];
    const lookup = lookupOf({ 士林區: weather(10, { rainfallBuckets: buckets }), 北投區: weather(10, { rainfallBuckets: buckets }) });
    expect(briefRoute(route, lookup, { now: AT_8AM }).verdict.level).toBe("clear");
  });

  test("完全沒有天氣資料時為未判定，數值為 null", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 20])] });
    const b = briefRoute(route, new Map());
    expect(b.verdict.level).toBe("unknown");
    expect(b.maxRain).toBeNull();
    expect(b.temperature).toBeNull();
  });

  test("路況事件服務整個失敗時，天氣良好也判為未判定", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(10) }), { eventsFailed: null });
    expect(b.verdict.level).toBe("unknown");
    expect(b.verdict.note).toContain("路況事件暫時取不到");
  });

  test("路況事件失敗的縣市在路線上（新舊縣名、台臺皆可對上）時判為未判定", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(10) }), { eventsFailed: ["臺北市"] });
    expect(b.verdict.level).toBe("unknown");
  });

  test("路況事件失敗的縣市不在這條路線上時，不影響判定", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(10) }), { eventsFailed: ["宜蘭縣"] });
    expect(b.verdict.level).toBe("clear");
  });

  test("路況事件失敗但天氣已達危險時，仍判為危險", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(70) }), { eventsFailed: null });
    expect(b.verdict.level).toBe("risky");
    expect(b.verdict.note).toContain("路況事件暫時取不到");
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
