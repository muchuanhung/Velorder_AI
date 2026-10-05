import { test, expect } from "@playwright/test";
import {
  DEFAULT_CYCLING_SPEED_KMH,
  estimateArrivalTime,
  pickRainfallBucketByEta,
  pickRainfallBucketForSegment,
  isBeyondForecast,
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
