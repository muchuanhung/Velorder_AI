/**
 * 依 GPX 起點、中點、終點座標 reverse geocode 取得行政區
 */

import type { RouteSegment } from "./route-data";

interface Point {
  lat: number;
  lon: number;
}

/** 從 Nominatim 取得行政區名稱（繁中） */
async function fetchDistrictFromNominatim(lat: number, lon: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=zh`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Velorder-Strava-Routes/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;
  const addr = data.address ?? {};
  const district =
    addr.suburb ?? addr.district ?? addr.village ?? addr.neighbourhood ?? addr.county ?? null;
  return district;
}

/**
 * 依 GPX 起點、中點、終點 reverse geocode，回傳唯一行政區列表（RouteSegment 格式）
 * 天氣欄位為 placeholder，可後續由 CWB API 補上
 */
export async function getSegmentsFromPoints(
  points: Point[]
): Promise<RouteSegment[]> {
  if (points.length < 2) return [];

  const indices = [
    0,
    Math.floor(points.length / 2),
    points.length - 1,
  ];
  const uniqueCoords = Array.from(
    new Map(indices.map((i) => [`${points[i]!.lat},${points[i]!.lon}`, points[i]!])).values()
  );

  const districtZhs: string[] = [];
  const seen = new Set<string>();

  for (const pt of uniqueCoords) {
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim 要求 1 req/s
    const districtZh = await fetchDistrictFromNominatim(pt.lat, pt.lon);
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
