/**
 * 鄉鎮區邊界，來自 g0v/twgeojson twTown1982.topo.json
 * 支援「縣市+鄉鎮區」例如 台北市大安區
 */

import townTopology from "./twTown1982.topo.json";
import { normalizeCountyForCWB, normalizeLocationCounty } from "@/lib/cwb/county-map";

type TopoGeometry = {
  type: "Polygon" | "MultiPolygon" | null;
  arcs?: number[][] | number[][][];
  properties?: { COUNTYNAME?: string; TOWNNAME?: string };
};

type Topology = {
  type: "Topology";
  transform: { scale: [number, number]; translate: [number, number] };
  objects: { layer1: { geometries: TopoGeometry[] } };
  arcs: number[][][];
};

const BBOX = {
  minLng: 118.217,
  maxLng: 122.006,
  minLat: 21.896,
  maxLat: 26.276,
};
const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 90;

function projectToSvg(lng: number, lat: number): [number, number] {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * VIEW_WIDTH;
  const y = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * VIEW_HEIGHT;
  return [x, y];
}

function decodeArc(topo: Topology, arcIndex: number): [number, number][] {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  const arc = topo.arcs[arcIndex];
  if (!arc) return [];
  const out: [number, number][] = [];
  let x = 0, y = 0;
  for (const pt of arc) {
    x += pt[0] ?? 0;
    y += pt[1] ?? 0;
    out.push([tx + sx * x, ty + sy * y]);
  }
  return out;
}

function resolveRing(topo: Topology, indices: number[]): [number, number][] {
  let points: [number, number][] = [];
  for (const idx of indices) {
    const arc = decodeArc(topo, idx < 0 ? ~idx : idx);
    if (idx < 0) arc.reverse();
    if (points.length) points.pop();
    points = points.concat(arc);
  }
  return points;
}

function resolvePolygonRings(topo: Topology, arcs: number[][]): number[][][] {
  const rings: number[][][] = [];
  for (const ringRef of arcs) {
    const points = resolveRing(topo, ringRef);
    if (points.length) rings.push(points);
  }
  return rings;
}

function ringToPath(ring: number[][]): string {
  const p0 = ring[0];
  if (!ring.length || !p0) return "";
  const [x0, y0] = projectToSvg(p0[0] ?? 0, p0[1] ?? 0);
  let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)}`;
  for (let i = 1; i < ring.length; i++) {
    const pt = ring[i];
    if (!pt) continue;
    const [x, y] = projectToSvg(pt[0] ?? 0, pt[1] ?? 0);
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d} Z`;
}

function geometryToPath(topo: Topology, geom: TopoGeometry): string {
  if (!geom.arcs) return "";
  const paths: string[] = [];
  if (geom.type === "Polygon") {
    for (const ring of resolvePolygonRings(topo, geom.arcs as number[][])) {
      paths.push(ringToPath(ring));
    }
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.arcs as number[][][]) {
      for (const ring of resolvePolygonRings(topo, poly)) {
        paths.push(ringToPath(ring));
      }
    }
  }
  return paths.join(" ");
}

function getCentroid(topo: Topology, geom: TopoGeometry): [number, number] {
  if (!geom.arcs) return [121.0, 23.5];
  const rings =
    geom.type === "Polygon"
      ? resolvePolygonRings(topo, geom.arcs as number[][])
      : (geom.arcs as number[][][]).flatMap((p) => resolvePolygonRings(topo, p));
  let sumLng = 0, sumLat = 0, count = 0;
  for (const ring of rings) {
    for (const pt of ring) {
      sumLng += pt[0] ?? 0;
      sumLat += pt[1] ?? 0;
      count++;
    }
  }
  return count > 0 ? [sumLng / count, sumLat / count] : [121.0, 23.5];
}

/** 使用完整 縣市鄉鎮區 作為唯一 id，避免 高雄縣三民鄉 vs 高雄市三民區 碰撞 */
function toId(county: string, town: string): string {
  return county && town ? `${county}${town}` : "unknown";
}

/** 比對用：統一 臺/台 方便字串比對 */
function normalizeForMatch(s: string): string {
  return s.replace(/臺/g, "台").replace(/\s/g, "");
}

/** Point-in-polygon (ray casting)：點是否在多邊形內 */
function pointInRing(lng: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ptI = ring[i];
    const ptJ = ring[j];
    if (ptI == null || ptJ == null) continue;
    const [xi, yi] = ptI;
    const [xj, yj] = ptJ;
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/** 從經緯度找出包含該點的鄉鎮區 nameZh */
export function findTownshipByLngLat(
  lng: number,
  lat: number
): string | null {
  const topo = townTopology as unknown as Topology;
  const layer = topo.objects?.layer1;
  if (!layer?.geometries) return null;

  for (const geom of layer.geometries) {
    if (geom.type !== "Polygon" && geom.type !== "MultiPolygon" || !geom.arcs) continue;
    const county = (geom.properties?.COUNTYNAME ?? "") as string;
    const town = (geom.properties?.TOWNNAME ?? "") as string;
    if (!county || !town) continue;

    const polygons: number[][][][] =
      geom.type === "Polygon"
        ? [resolvePolygonRings(topo, geom.arcs as number[][])]
        : (geom.arcs as number[][][]).map((p) => resolvePolygonRings(topo, p));

    for (const polyRings of polygons) {
      const outer = polyRings[0];
      if (!outer || !pointInRing(lng, lat, outer as [number, number][])) continue;
      let inHole = false;
      for (let i = 1; i < polyRings.length; i++) {
        if (pointInRing(lng, lat, polyRings[i] as [number, number][])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return `${county}${town}`;
    }
  }
  return null;
}

/** 從經緯度找出鄉鎮區，回傳 {county, town}（town 如 士林區） */
export function findTownshipDetailByLngLat(
  lng: number,
  lat: number
): { county: string; town: string } | null {
  const topo = townTopology as unknown as Topology;
  const layer = topo.objects?.layer1;
  if (!layer?.geometries) return null;
  for (const geom of layer.geometries) {
    if (geom.type !== "Polygon" && geom.type !== "MultiPolygon" || !geom.arcs) continue;
    const county = (geom.properties?.COUNTYNAME ?? "") as string;
    const town = (geom.properties?.TOWNNAME ?? "") as string;
    if (!county || !town) continue;
    const polygons: number[][][][] =
      geom.type === "Polygon"
        ? [resolvePolygonRings(topo, geom.arcs as number[][])]
        : (geom.arcs as number[][][]).map((p) => resolvePolygonRings(topo, p));
    for (const polyRings of polygons) {
      const outer = polyRings[0];
      if (!outer || !pointInRing(lng, lat, outer as [number, number][])) continue;
      let inHole = false;
      for (let i = 1; i < polyRings.length; i++) {
        if (pointInRing(lng, lat, polyRings[i] as [number, number][])) { inHole = true; break; }
      }
      if (!inHole) return { county, town };
    }
  }
  return null;
}

export interface TownshipFromTopo {
  id: string;
  name: string;
  nameZh: string;
  countyName: string;
  townName: string;
  path: string;
  center: [number, number];
  rainProbability: number;
  isCurrentDistrict: boolean;
}

/**
 * @param currentLocation 使用者位置，格式 "縣市鄉鎮區" 如 "台北市大安區"（用於字串比對）
 * @param lngLat 若提供，以經緯度 point-in-polygon 找出鄉鎮區，優先於 currentLocation
 * @param countyRainfall 縣市名(已正規化) → 12hr 降雨機率，若無則該縣市鄉鎮顯示 0
 */
export function getTaiwanTownshipsFromTopojson(
  currentLocation = "台北市大安區",
  lngLat?: [number, number],
  countyRainfall?: Record<string, number>
): TownshipFromTopo[] {
  const rawLocation =
    lngLat ? (findTownshipByLngLat(lngLat[0], lngLat[1]) ?? currentLocation) : currentLocation;
  const effectiveLocation = normalizeLocationCounty(rawLocation);
  const topo = townTopology as unknown as Topology;
  const layer = topo.objects?.layer1;
  if (!layer?.geometries) return [];

  // 依 縣市+鄉鎮區 分組，合併同鄉鎮的多個 polygon（如離島）
  const byTown = new Map<string, { paths: string[]; centers: [number, number][]; geom: TopoGeometry }>();

  for (const geom of layer.geometries) {
    if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") continue;
    const county = (geom.properties?.COUNTYNAME ?? "") as string;
    const town = (geom.properties?.TOWNNAME ?? "") as string;
    if (!county || !town) continue;

    const key = `${county}-${town}`;
    const path = geometryToPath(topo, geom);
    const center = getCentroid(topo, geom);

    if (!byTown.has(key)) {
      byTown.set(key, { paths: [], centers: [], geom });
    }
    const entry = byTown.get(key)!;
    entry.paths.push(path);
    entry.centers.push(center);
  }

  const results: TownshipFromTopo[] = [];

  for (const [key, { paths, centers, geom }] of byTown) {
    const parts = key.split("-");
    const county = parts[0] ?? "";
    const town = parts[1] ?? "";
    const countyDisplay = normalizeCountyForCWB(county);
    const nameZh = `${countyDisplay}${town}`;
    const fullPath = paths.join(" ");

    // centroid 取平均
    const cx = centers.reduce((s, c) => s + c[0], 0) / centers.length;
    const cy = centers.reduce((s, c) => s + c[1], 0) / centers.length;

    const rainProbability =
      countyRainfall != null && countyDisplay in countyRainfall
        ? countyRainfall[countyDisplay] ?? 0
        : 0;

    results.push({
      id: toId(countyDisplay, town),
      name: town,
      nameZh,
      countyName: countyDisplay,
      townName: town,
      path: fullPath,
      center: [cx, cy],
      rainProbability,
      isCurrentDistrict: normalizeForMatch(nameZh) === normalizeForMatch(effectiveLocation),
    });
  }

  return results;
}
