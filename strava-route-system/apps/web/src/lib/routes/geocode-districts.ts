/**
 * 依 GPX 軌跡點做 point-in-polygon，用本地 TopoJSON 找出涵蓋行政區
 * 無網路請求，即時計算
 */

import { findTownshipDetailByLngLat } from "@/lib/maps/taiwan-towns-topojson";
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

  const districtZhs: string[] = [];
  const seen = new Set<string>();

  for (const i of indices) {
    const pt = points[i]!;
    const detail = findTownshipDetailByLngLat(pt.lon, pt.lat);
    const districtZh = detail?.town ?? null;
    if (districtZh && !seen.has(districtZh)) {
      seen.add(districtZh);
      districtZhs.push(districtZh);
    }
  }

  return districtZhs.map((districtZh) => ({
    district: districtZh,
    districtZh,
    rainProbability: 0,
    windSpeed: 0,
    temperature: 0,
    condition: "clear" as const,
  }));
}
