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

/**
 * 依 GPX 起點、1/4、中點、3/4、終點 sample，用本地 TopoJSON 找出唯一行政區
 */
export function getSegmentsFromPoints(points: Point[]): RouteSegment[] {
  if (points.length < 2) return [];

  const n = points.length;
  const indices = [
    0,
    Math.floor(n * 0.25),
    Math.floor(n / 2),
    Math.floor(n * 0.75),
    n - 1,
  ].filter((i, pos, arr) => arr.indexOf(i) === pos); // 去重

  // 累計里程，與 parseGpxToRoute 的 elevationProfile 同一算法
  const cumulKm: number[] = [0];
  for (let i = 1; i < n; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    cumulKm.push(cumulKm[i - 1]! + haversineKm(a.lat, a.lon, b.lat, b.lon));
  }

  const items: { county: string; town: string; sampleKms: number[] }[] = [];
  const byKey = new Map<string, (typeof items)[number]>();

  for (const i of indices) {
    const pt = points[i]!;
    const detail = findTownshipDetailByLngLat(pt.lon, pt.lat);
    if (!detail) continue;
    const key = `${detail.county}-${detail.town}`;
    const km = cumulKm[i] ?? 0;
    const existing = byKey.get(key);
    if (existing) {
      // 同一行政區再次出現（例如環狀路線回到起點），補記里程
      existing.sampleKms.push(km);
      continue;
    }
    const item = { county: detail.county, town: detail.town, sampleKms: [km] };
    byKey.set(key, item);
    items.push(item);
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
