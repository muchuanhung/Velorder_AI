/**
 * 依 GPX 軌跡點做 point-in-polygon，用本地 TopoJSON 找出涵蓋行政區
 * 無網路請求，即時計算
 */

import { findTownshipDetailByLngLat } from "@/lib/maps/taiwan-towns-topojson";
import { haversineKm } from "./parse-gpx";
import type { RouteSegment } from "./route-data";

interface Point {
  lat: number;
  lon: number;
}

/** 每 ~0.5 km 取樣一次以達成真實路段涵蓋，可調整此常數 */
export const SEGMENT_SAMPLE_INTERVAL_KM = 0.5;

/**
 * 依 GPX 軌跡約每 0.5 km 取樣，用本地 TopoJSON 找出涵蓋行政區
 * 連續相同行政區合併成一段，記錄 startKm/endKm（合併為 sampleKms 陣列的首尾）
 */
export function getSegmentsFromPoints(points: Point[]): RouteSegment[] {
  if (points.length < 2) return [];

  const n = points.length;

  // 累計里程，與 parseGpxToRoute 的 elevationProfile 同一算法
  const cumulKm: number[] = [0];
  for (let i = 1; i < n; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    cumulKm.push(cumulKm[i - 1]! + haversineKm(a.lat, a.lon, b.lat, b.lon));
  }

  const totalKm = cumulKm[n - 1] ?? 0;

  // 計算取樣點：每 SEGMENT_SAMPLE_INTERVAL_KM 取樣一次，至少包含起點與終點
  const sampleKms: number[] = [0];
  let nextSampleKm = SEGMENT_SAMPLE_INTERVAL_KM;
  while (nextSampleKm < totalKm) {
    sampleKms.push(nextSampleKm);
    nextSampleKm += SEGMENT_SAMPLE_INTERVAL_KM;
  }
  if (sampleKms[sampleKms.length - 1] !== totalKm) {
    sampleKms.push(totalKm);
  }

  // 找出每個取樣里程對應的軌跡點索引
  const sampleIndices = sampleKms.map((targetKm) => {
    // 二分搜尋找最接近的累計里程
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if ((cumulKm[mid] ?? 0) < targetKm) lo = mid + 1;
      else hi = mid;
    }
    // 找最接近的
    if (lo > 0 && Math.abs((cumulKm[lo - 1] ?? 0) - targetKm) < Math.abs((cumulKm[lo] ?? 0) - targetKm)) {
      return lo - 1;
    }
    return lo;
  });

  // 依序反查行政區，連續相同行政區合併
  type SegmentItem = { county: string; town: string; startKm: number; endKm: number; sampleKms: number[] };
  const items: SegmentItem[] = [];

  for (let i = 0; i < sampleKms.length; i++) {
    const idx = sampleIndices[i]!;
    const pt = points[idx]!;
    const km = sampleKms[i]!;
    const detail = findTownshipDetailByLngLat(pt.lon, pt.lat);

    if (!detail) continue;

    const key = `${detail.county}-${detail.town}`;
    const last = items[items.length - 1];

    if (last && `${last.county}-${last.town}` === key) {
      // 連續相同行政區，延長 endKm 並補記里程
      last.endKm = km;
      last.sampleKms.push(km);
    } else {
      // 新行政區
      items.push({
        county: detail.county,
        town: detail.town,
        startKm: km,
        endKm: km,
        sampleKms: [km],
      });
    }
  }

  return items.map(({ county, town, sampleKms }) => ({
    district: town,
    districtZh: town,
    county,
    rainProbability: 0,
    windSpeed: 0,
    temperature: 0,
    condition: "clear" as const,
    sampleKms,
  }));
}
