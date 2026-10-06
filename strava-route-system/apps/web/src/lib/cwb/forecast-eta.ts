/**
 * 依預估抵達時間（ETA）挑選 CWB 降雨機率時段
 * 不依賴 React 與伺服器，Dashboard 判讀與路線偵察共用。
 */

/**
 * 估算 ETA 用的平均速度（km/h）。以一般公路車休閒騎乘的均速為準（含停等），
 * 跑步、健行會高估速度、ETA 偏早；之後可依路線類型或使用者設定覆寫。
 */
export const DEFAULT_CYCLING_SPEED_KMH = 20;

export interface RainfallBucket {
  startTime: string;
  endTime: string;
  pop: number;
  label: string;
  endLabel: string;
}

export function estimateArrivalTime(
  km: number,
  departure: Date,
  speedKmh: number = DEFAULT_CYCLING_SPEED_KMH
): Date {
  return new Date(departure.getTime() + (km / speedKmh) * 3_600_000);
}

/**
 * 涵蓋 ETA 的時段；ETA 早於所有時段取第一個未來時段。
 * 晚於所有時段回傳 null：超出預報時段不可拿其他時段頂替（判讀端改判 unknown）。
 * 時間無法解析的時段略過；沒有可用時段回傳 null。
 */
export function pickRainfallBucketByEta<T extends Pick<RainfallBucket, "startTime" | "endTime">>(
  eta: Date,
  buckets: readonly T[]
): T | null {
  const t = eta.getTime();
  const valid = buckets.filter((b) => !Number.isNaN(Date.parse(b.startTime)) && !Number.isNaN(Date.parse(b.endTime)));
  return (
    valid.find((b) => t >= Date.parse(b.startTime) && t < Date.parse(b.endTime)) ??
    valid.find((b) => Date.parse(b.startTime) > t) ??
    null
  );
}

type TimedPop = Pick<RainfallBucket, "startTime" | "endTime" | "pop">;

/**
 * 路段騎經時間（進入 ETA ～ 離開 ETA）重疊的時段中，降雨機率最高的一個；
 * 長路段可能橫跨兩個時段，取較保守者。沒有重疊時退回進入 ETA 的時段。
 */
export function pickRainfallBucketForSegment<T extends TimedPop>(
  sampleKms: readonly number[] | undefined,
  departure: Date,
  buckets: readonly T[],
  speedKmh: number = DEFAULT_CYCLING_SPEED_KMH
): T | null {
  if (isBeyondForecast(sampleKms, departure, buckets, speedKmh)) return null;
  const entryKm = sampleKms?.[0] ?? 0;
  const exitKm = sampleKms?.[sampleKms.length - 1] ?? entryKm;
  const from = estimateArrivalTime(entryKm, departure, speedKmh).getTime();
  const to = estimateArrivalTime(exitKm, departure, speedKmh).getTime();
  const overlapping = buckets.filter((b) => {
    const start = Date.parse(b.startTime);
    const end = Date.parse(b.endTime);
    return start <= to && end > from;
  });
  if (overlapping.length === 0) return pickRainfallBucketByEta(new Date(from), buckets);
  return overlapping.reduce((a, b) => (b.pop > a.pop ? b : a));
}

/**
 * 路段離開時的 ETA 已超出最後一個預報時段（含部分超出）。
 * 沒有可用時段時回 false，由「無資料」處理。
 */
export function isBeyondForecast(
  sampleKms: readonly number[] | undefined,
  departure: Date,
  buckets: readonly Pick<RainfallBucket, "endTime">[],
  speedKmh: number = DEFAULT_CYCLING_SPEED_KMH
): boolean {
  const ends = buckets.map((b) => Date.parse(b.endTime)).filter((t) => !Number.isNaN(t));
  if (ends.length === 0) return false;
  const exitKm = sampleKms?.[sampleKms.length - 1] ?? sampleKms?.[0] ?? 0;
  return estimateArrivalTime(exitKm, departure, speedKmh).getTime() >= Math.max(...ends);
}
