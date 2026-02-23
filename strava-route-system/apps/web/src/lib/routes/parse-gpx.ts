/**
 * 瀏覽器端 GPX 解析，將 XML 字串轉為 Route 所需格式
 */

import { encodePolyline } from "./polyline";
import type { Route } from "./route-data";

interface Point {
  lat: number;
  lon: number;
  ele?: number;
}

function parseGpxType(xml: string): Route["type"] {
  // GPX <trk><type>run</type> 或 <rte><type>cycling</type>（Strava 等會輸出）
  const typeMatch = xml.match(/<type>\s*([^<]+)\s*<\/type>/i);
  const raw = typeMatch?.[1]?.trim().toLowerCase() ?? "";
  if (/run|跑步|jog|trail run|road run/i.test(raw)) return "running";
  if (/cycle|cycling|ride|bike|騎|車|騎車|road|mtb/i.test(raw)) return "cycling";
  if (/hike|walk|健行|步/i.test(raw)) return "running";
  return "cycling"; // 預設
}

function parseGpxPoints(xml: string): { points: Point[]; name: string } {
  const points: Point[] = [];
  const ptRegex =
    /<(?:rtept|trkpt)\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/(?:rtept|trkpt)>/gi;
  let m;
  while ((m = ptRegex.exec(xml)) !== null) {
    const lat = parseFloat(m[1] ?? "");
    const lon = parseFloat(m[2] ?? "");
    const eleMatch = (m[3] ?? "").match(/<ele>([^<]+)<\/ele>/);
    points.push({
      lat,
      lon,
      ele: eleMatch?.[1] != null ? parseFloat(eleMatch[1]) : undefined,
    });
  }
  const nameMatch = xml.match(/<name>([^<]+)<\/name>/);
  return {
    points,
    name: nameMatch?.[1] != null ? nameMatch[1].trim() : "Unknown",
  };
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function inferDifficulty(distanceKm: number, elevationGain: number): Route["difficulty"] {
  const ratio = elevationGain / distanceKm;
  if (ratio >= 50) return "hard";
  if (ratio >= 25) return "moderate";
  if (ratio >= 10) return "easy";
  return "easy";
}

function estimateTime(distanceKm: number, elevationGain: number): string {
  const baseHours = distanceKm / 25;
  const climbPenalty = (elevationGain / 500) * 0.25;
  const total = baseHours + climbPenalty;
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** 從 name 中提取中文（若格式為 "中文 English" 或 "English 中文"） */
function extractNameZh(name: string): string {
  const zhMatch = name.match(/[\u4e00-\u9fff]+/g);
  return zhMatch?.join("") ?? name;
}

/**
 * 解析 GPX XML 字串，轉為 Route 格式
 * GPX 無 weather/CCTV，使用預設空值
 */
export function parseGpxToRoute(xml: string, routeId: string): Route {
  const { points, name } = parseGpxPoints(xml);
  if (points.length < 2) {
    throw new Error("GPX 中無有效 route/track 點位");
  }

  let distanceKm = 0;
  const cumulDist: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const d = haversineKm(prev.lat, prev.lon, curr.lat, curr.lon);
    distanceKm += d;
    cumulDist.push(distanceKm);
  }

  const hasEle = points.some((p) => p.ele != null);
  const segs = Math.max(5, Math.floor(distanceKm / 2));
  const elevationProfile: [number, number][] = hasEle
    ? points.map((p, i) => [cumulDist[i] ?? 0, p.ele ?? 0])
    : Array.from({ length: segs + 1 }, (_, i) => [(distanceKm * i) / segs, 0]);

  const elevationGain = hasEle
    ? Math.round(
        points.reduce((sum, p, i) => {
          if (i === 0) return 0;
          const diff = (p.ele ?? 0) - ((points[i - 1]?.ele) ?? 0);
          return sum + (diff > 0 ? diff : 0);
        }, 0)
      )
    : 0;

  const distance = Math.round(distanceKm * 10) / 10;
  const polyline = encodePolyline(points);

  return {
    id: routeId,
    name,
    nameZh: extractNameZh(name),
    distance,
    elevationGain,
    type: parseGpxType(xml),
    difficulty: inferDifficulty(distanceKm, elevationGain),
    status: "safe",
    verdictMessage: "",
    segments: [],
    cctvFeeds: [],
    gpxPreviewPath: polyline,
    elevationProfile,
    estimatedTime: estimateTime(distanceKm, elevationGain),
    bestTimeToRide: "",
  };
}
