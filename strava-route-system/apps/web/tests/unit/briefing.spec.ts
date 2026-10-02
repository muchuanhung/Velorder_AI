import { test, expect } from "@playwright/test";
import {
  applyWeather,
  briefRoute,
  DEFAULT_CYCLING_SPEED_KMH,
  districtKey,
  estimateArrivalTime,
  mapCwbCondition,
  pickAlternative,
  pickRainfallBucketByEta,
  type DistrictWeather,
  type RainfallBucket,
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

  test("依 ETA 選擇降雨時段", () => {
    const buckets: RainfallBucket[] = [
      { startTime: "2026-10-01T08:00:00+08:00", endTime: "2026-10-01T12:00:00+08:00", pop: 10, label: "08:00", endLabel: "12:00" },
      { startTime: "2026-10-01T12:00:00+08:00", endTime: "2026-10-01T16:00:00+08:00", pop: 50, label: "12:00", endLabel: "16:00" },
    ];
    const route = makeRoute({
      segments: [
        segment("士林區", [0]),     // 起點，ETA = departure
        segment("北投區", [20]),    // 20 km @ 20 km/h = 1 小時後
      ],
    });
    const lookup = lookupOf({
      士林區: weather(0, { rainfallBuckets: buckets }),
      北投區: weather(0, { rainfallBuckets: buckets }),
    });
    // 08:30 出發：士林區在 08:30，北投區在 09:30，都在第一個時段
    const out = applyWeather(route, lookup, { departureTime: new Date("2026-10-01T08:30:00+08:00") });
    expect(out.segments[0]?.rainProbability).toBe(10);
    expect(out.segments[1]?.rainProbability).toBe(10);
  });

  test("遠處路段選擇較晚的時段", () => {
    const buckets: RainfallBucket[] = [
      { startTime: "2026-10-01T08:00:00+08:00", endTime: "2026-10-01T10:00:00+08:00", pop: 10, label: "08:00", endLabel: "10:00" },
      { startTime: "2026-10-01T10:00:00+08:00", endTime: "2026-10-01T12:00:00+08:00", pop: 50, label: "10:00", endLabel: "12:00" },
    ];
    const route = makeRoute({
      segments: [
        segment("士林區", [0]),     // 起點
        segment("北投區", [40]),    // 40 km @ 20 km/h = 2 小時後
      ],
    });
    const lookup = lookupOf({
      士林區: weather(0, { rainfallBuckets: buckets }),
      北投區: weather(0, { rainfallBuckets: buckets }),
    });
    // 08:00 出發：士林區在 08:00，北投區在 10:00（進入第二個時段）
    const out = applyWeather(route, lookup, { departureTime: new Date("2026-10-01T08:00:00+08:00") });
    expect(out.segments[0]?.rainProbability).toBe(10);
    expect(out.segments[1]?.rainProbability).toBe(50);
  });

  test("無 departureTime 時使用第一個時段（舊行為）", () => {
    const buckets: RainfallBucket[] = [
      { startTime: "2026-10-01T08:00:00+08:00", endTime: "2026-10-01T12:00:00+08:00", pop: 10, label: "08:00", endLabel: "12:00" },
      { startTime: "2026-10-01T12:00:00+08:00", endTime: "2026-10-01T16:00:00+08:00", pop: 50, label: "12:00", endLabel: "16:00" },
    ];
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20])] });
    // 即使路段 sampleKms 顯示會有時間差，不提供 departureTime 時仍使用預設值
    const lookup = lookupOf({ 士林區: weather(99, { rainfallBuckets: buckets }) });
    const out = applyWeather(route, lookup); // no departureTime
    // 預設使用 weather() 裡的 rainProbability = 99（不依 ETA 選擇）
    expect(out.segments[0]?.rainProbability).toBe(99);
  });
});

test.describe("mapCwbCondition", () => {
  test("sunny 對應 clear；未知字串退回 cloudy", () => {
    expect(mapCwbCondition("sunny")).toBe("clear");
    expect(mapCwbCondition("stormy")).toBe("stormy");
    expect(mapCwbCondition("foggy")).toBe("cloudy");
  });
});

test.describe("estimateArrivalTime", () => {
  test("預設速度為 20 km/h", () => {
    expect(DEFAULT_CYCLING_SPEED_KMH).toBe(20);
  });

  test("依起點里程計算預估抵達時間", () => {
    const departure = new Date("2026-10-01T08:00:00+08:00");
    // 20 km @ 20 km/h = 1 hour
    const eta = estimateArrivalTime(20, departure);
    expect(eta.getTime()).toBe(departure.getTime() + 60 * 60 * 1000);
  });

  test("自訂速度計算", () => {
    const departure = new Date("2026-10-01T08:00:00+08:00");
    // 30 km @ 30 km/h = 1 hour
    const eta = estimateArrivalTime(30, departure, 30);
    expect(eta.getTime()).toBe(departure.getTime() + 60 * 60 * 1000);
  });
});

test.describe("pickRainfallBucketByEta", () => {
  const buckets: RainfallBucket[] = [
    { startTime: "2026-10-01T06:00:00+08:00", endTime: "2026-10-01T12:00:00+08:00", pop: 10, label: "06:00", endLabel: "12:00" },
    { startTime: "2026-10-01T12:00:00+08:00", endTime: "2026-10-01T18:00:00+08:00", pop: 50, label: "12:00", endLabel: "18:00" },
    { startTime: "2026-10-01T18:00:00+08:00", endTime: "2026-10-02T00:00:00+08:00", pop: 70, label: "18:00", endLabel: "00:00" },
  ];

  test("選中涵蓋 ETA 的時段", () => {
    const eta = new Date("2026-10-01T10:00:00+08:00");
    const bucket = pickRainfallBucketByEta(eta, buckets);
    expect(bucket?.pop).toBe(10);
    expect(bucket?.label).toBe("06:00");
  });

  test("ETA 在時段邊界（開始時間）時選中該時段", () => {
    const eta = new Date("2026-10-01T12:00:00+08:00");
    const bucket = pickRainfallBucketByEta(eta, buckets);
    expect(bucket?.pop).toBe(50);
  });

  test("ETA 超前所有時段時選擇最接近的未來時段", () => {
    const eta = new Date("2026-10-01T05:00:00+08:00");
    const bucket = pickRainfallBucketByEta(eta, buckets);
    expect(bucket?.pop).toBe(10);
  });

  test("ETA 超過所有時段時回傳最後一個", () => {
    const eta = new Date("2026-10-02T05:00:00+08:00");
    const bucket = pickRainfallBucketByEta(eta, buckets);
    expect(bucket?.pop).toBe(70);
  });

  test("空陣列回傳 null", () => {
    expect(pickRainfallBucketByEta(new Date(), [])).toBeNull();
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

    const onlyWork = briefRoute(route, lookupOf({ 士林區: weather(10) }), [work], now);
    expect(onlyWork.verdict.level).toBe("clear");
    expect(onlyWork.roadEvents.map((e) => e.id)).toEqual(["work"]);

    const withAccident = briefRoute(route, lookupOf({ 士林區: weather(10) }), [work, accident], now);
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

  test("完全沒有天氣資料時為未判定，數值為 null", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 20])] });
    const b = briefRoute(route, new Map());
    expect(b.verdict.level).toBe("unknown");
    expect(b.maxRain).toBeNull();
    expect(b.temperature).toBeNull();
  });

  test("路況事件服務失敗（eventsFailed=null）時判為未判定", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 5, 10, 15, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(10) }), { events: [], now: new Date(), eventsFailed: null });
    expect(b.verdict.level).toBe("unknown");
    expect(b.verdict.note).toContain("路況事件服務暫時無法取得");
  });

  test("路況事件部分失敗時判為未判定", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 5, 10, 15, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(10) }), {
      events: [],
      now: new Date(),
      eventsFailed: ["新北市"],
    });
    expect(b.verdict.level).toBe("unknown");
    expect(b.verdict.note).toContain("部分路況事件取不到");
  });

  test("路況事件失敗但有示警時，示警等級優先", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 5, 10, 15, 20])] });
    const b = briefRoute(route, lookupOf({ 士林區: weather(70) }), { events: [], now: new Date(), eventsFailed: null });
    expect(b.verdict.level).toBe("risky");
    expect(b.verdict.note).toContain("路況事件服務暫時無法取得");
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
