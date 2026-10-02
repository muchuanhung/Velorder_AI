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

type TownshipLookup = (lon: number, lat: number) => { county: string; town: string } | null;

/** 沿軌跡取樣間距（km）；鄉鎮區最窄處約 1 km，0.5 km 才不會漏掉短暫穿越的行政區 */
export const SEGMENT_SAMPLE_INTERVAL_KM = 0.5;

/**
 * 沿軌跡每 SEGMENT_SAMPLE_INTERVAL_KM（含終點）內插取樣，反查行政區；
 * 連續落在同一行政區的取樣合併為一段，sampleKms 依里程遞增，首尾即該段涵蓋範圍。
 * 環狀路線回到同一區時會是另一段（同名，不同里程）。查不到行政區的取樣點（海上、邊界外）略過。
 */
export function getSegmentsFromPoints(
  points: Point[],
  lookup: TownshipLookup = findTownshipDetailByLngLat
): RouteSegment[] {
  if (points.length < 2) return [];

  // 累計里程，與 parseGpxToRoute 的 elevationProfile 同一算法
  const cumulKm: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    cumulKm.push(cumulKm[i - 1]! + haversineKm(a.lat, a.lon, b.lat, b.lon));
  }
  const totalKm = cumulKm[cumulKm.length - 1]!;

  const sampleCount = Math.floor(totalKm / SEGMENT_SAMPLE_INTERVAL_KM);
  const sampleKms = Array.from({ length: sampleCount + 1 }, (_, i) => i * SEGMENT_SAMPLE_INTERVAL_KM);
  if (totalKm - sampleKms[sampleKms.length - 1]! > 1e-9) sampleKms.push(totalKm);

  const segments: RouteSegment[] = [];
  let lastKey = "";
  let j = 1;
  for (const km of sampleKms) {
    while (j < cumulKm.length - 1 && cumulKm[j]! < km) j++;
    const a = points[j - 1]!;
    const b = points[j]!;
    const span = cumulKm[j]! - cumulKm[j - 1]!;
    const t = span > 0 ? Math.min(1, Math.max(0, (km - cumulKm[j - 1]!) / span)) : 0;
    const detail = lookup(a.lon + (b.lon - a.lon) * t, a.lat + (b.lat - a.lat) * t);
    if (!detail) continue;

    const key = `${detail.county}|${detail.town}`;
    const last = segments[segments.length - 1];
    if (last && key === lastKey) {
      last.sampleKms!.push(km);
      continue;
    }
    lastKey = key;
    segments.push({
      district: detail.town,
      districtZh: detail.town,
      county: detail.county,
      rainProbability: 0,
      windSpeed: 0,
      temperature: 0,
      condition: "clear",
      sampleKms: [km],
    });
  }
  return segments;
}
