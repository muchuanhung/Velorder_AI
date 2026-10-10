import { test, expect } from "@playwright/test";
import {
  DEFAULT_CYCLING_SPEED_KMH,
  estimateArrivalTime,
  pickRainfallBucketByEta,
  pickRainfallBucketForSegment,
  isBeyondForecast,
  pickWindForSegment,
  windBucketsFromCwb,
  type RainfallBucket,
} from "@/lib/cwb/forecast-eta";

const at = (hhmm: string, day = "01") => new Date(`2026-10-${day}T${hhmm}:00+08:00`);
const bucket = (start: string, end: string, pop: number, endDay = "01"): RainfallBucket => ({
  startTime: `2026-10-01T${start}:00+08:00`,
  endTime: `2026-10-${endDay}T${end}:00+08:00`,
  pop,
  label: start,
  endLabel: end,
});

test.describe("estimateArrivalTime", () => {
  test("預設 20 km/h：20 km 後 1 小時抵達", () => {
    expect(DEFAULT_CYCLING_SPEED_KMH).toBe(20);
    expect(estimateArrivalTime(20, at("08:00")).getTime()).toBe(at("09:00").getTime());
  });

  test("可指定速度", () => {
    expect(estimateArrivalTime(15, at("08:00"), 30).getTime()).toBe(at("08:30").getTime());
  });
});

test.describe("pickRainfallBucketByEta", () => {
  const buckets = [bucket("06:00", "12:00", 10), bucket("12:00", "18:00", 50), bucket("18:00", "00:00", 70, "02")];

  test("取涵蓋 ETA 的時段；開始時間屬於該時段，結束時間屬於下一段", () => {
    expect(pickRainfallBucketByEta(at("10:00"), buckets)?.pop).toBe(10);
    expect(pickRainfallBucketByEta(at("12:00"), buckets)?.pop).toBe(50);
  });

  test("ETA 早於所有時段取第一個未來時段；晚於所有時段回傳 null（不拿最後一段頂替）", () => {
    expect(pickRainfallBucketByEta(at("05:00"), buckets)?.pop).toBe(10);
    expect(pickRainfallBucketByEta(at("05:00", "02"), buckets)).toBeNull();
  });

  test("時間無法解析的時段略過；沒有可用時段回傳 null", () => {
    const broken = { ...bucket("06:00", "12:00", 99), startTime: "" };
    expect(pickRainfallBucketByEta(at("10:00"), [broken, bucket("12:00", "18:00", 50)])?.pop).toBe(50);
    expect(pickRainfallBucketByEta(at("10:00"), [broken])).toBeNull();
    expect(pickRainfallBucketByEta(at("10:00"), [])).toBeNull();
  });
});

test.describe("pickRainfallBucketForSegment", () => {
  const buckets = [bucket("06:00", "12:00", 10), bucket("12:00", "18:00", 50), bucket("18:00", "00:00", 30, "02")];

  test("路段只在一個時段內：取該時段", () => {
    expect(pickRainfallBucketForSegment([0, 0.5, 20], at("08:00"), buckets)?.pop).toBe(10);
  });

  test("長路段橫跨兩個時段：取降雨機率較高者", () => {
    // 11:00 進入，40 km 後 13:00 離開
    expect(pickRainfallBucketForSegment([20, 60], at("10:00"), buckets)?.pop).toBe(50);
  });

  test("沒有 sampleKms 視為起點；出發早於所有時段退回第一個未來時段", () => {
    expect(pickRainfallBucketForSegment(undefined, at("14:00"), buckets)?.pop).toBe(50);
    expect(pickRainfallBucketForSegment([0], at("04:00"), buckets)?.pop).toBe(10);
    expect(pickRainfallBucketForSegment([0], at("08:00"), [])).toBeNull();
  });
});

test.describe("超出預報時段", () => {
  const buckets = [bucket("06:00", "12:00", 10), bucket("12:00", "18:00", 50)];

  test("路段離開 ETA 超過最後一個時段：isBeyondForecast 為 true，pickRainfallBucketForSegment 回 null", () => {
    // 16:00 出發，進入 0 km、離開 60 km → 19:00，超過 18:00
    expect(isBeyondForecast([0, 60], at("16:00"), buckets)).toBe(true);
    expect(pickRainfallBucketForSegment([0, 60], at("16:00"), buckets)).toBeNull();
  });

  test("路段完全在時段內：不算超出", () => {
    expect(isBeyondForecast([0, 20], at("16:00"), buckets)).toBe(false);
    expect(pickRainfallBucketForSegment([0, 20], at("16:00"), buckets)?.pop).toBe(50);
  });

  test("沒有可用時段時不算超出（交給無資料處理）", () => {
    expect(isBeyondForecast([0, 60], at("16:00"), [])).toBe(false);
  });
});

test.describe("風速時段", () => {
  test("有起訖時間時直接用；風速 m/s 換算 km/h", () => {
    const b = windBucketsFromCwb([
      { StartTime: at("06:00").toISOString(), EndTime: at("09:00").toISOString(), ElementValue: [{ WindSpeed: "5" }] },
    ]);
    expect(b).toEqual([{ startTime: at("06:00").toISOString(), endTime: at("09:00").toISOString(), kmh: 18 }]);
  });

  test("只有時間點時以到下一個時間點為一段，最後一段沿用前一段長度；缺值略過", () => {
    const b = windBucketsFromCwb([
      { DataTime: at("06:00").toISOString(), ElementValue: [{ WindSpeed: "3" }] },
      { DataTime: at("09:00").toISOString(), ElementValue: [{ WindSpeed: "12" }] },
      { DataTime: at("12:00").toISOString(), ElementValue: [{}] },
    ]);
    expect(b.map((x) => [x.endTime, x.kmh])).toEqual([
      [at("09:00").toISOString(), 11],
      [at("12:00").toISOString(), 43],
    ]);
    expect(windBucketsFromCwb(undefined)).toEqual([]);
  });

  test("路段行經時間重疊的時段取最大風速；不重疊取 ETA 之後第一段", () => {
    const wind = [
      { startTime: at("08:00").toISOString(), endTime: at("10:00").toISOString(), kmh: 10 },
      { startTime: at("10:00").toISOString(), endTime: at("12:00").toISOString(), kmh: 55 },
    ];
    // 0–20 km、08:00 出發、20 km/h：08:00–09:00 只碰第一段
    expect(pickWindForSegment([0, 20], at("08:00"), wind)).toBe(10);
    // 20–60 km：09:00–11:00 橫跨兩段，取較大
    expect(pickWindForSegment([20, 60], at("08:00"), wind)).toBe(55);
    expect(pickWindForSegment([0], at("07:00"), wind)).toBe(10);
    expect(pickWindForSegment([0], at("08:00"), [])).toBeNull();
  });
});
