/**
 * 局部等距投影：經緯度 → 三維場景座標（單位 km，bbox 中心為原點）
 * 台灣路線範圍 < 300 km，誤差可忽略，不需要 proj4。
 * three.js 慣例：-z 朝北、+x 朝東、+y 朝上。
 */

export interface GeoBBox {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

const M_PER_DEG_LAT = 110_574;

export function createLocalProjection(bbox: GeoBBox) {
  const lat0 = (bbox.minLat + bbox.maxLat) / 2;
  const lon0 = (bbox.minLon + bbox.maxLon) / 2;
  const mPerDegLon = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  return {
    /** 經度 → 場景 x（km） */
    x: (lon: number) => ((lon - lon0) * mPerDegLon) / 1000,
    /** 緯度 → 場景 z（km），北方為負 */
    z: (lat: number) => (-(lat - lat0) * M_PER_DEG_LAT) / 1000,
    /** bbox 的實際寬（東西）與深（南北），單位 km */
    widthKm: ((bbox.maxLon - bbox.minLon) * mPerDegLon) / 1000,
    depthKm: ((bbox.maxLat - bbox.minLat) * M_PER_DEG_LAT) / 1000,
  };
}
