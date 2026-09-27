/**
 * 三維沙盤的地形前處理（純函式，不依賴 three.js）
 * 地形資料由 scripts/bake-terrain.mjs 從 SRTM 烘焙，存於 Firebase Storage terrain/routes/{routeId}.json
 */

import type { GeoBBox } from "@/lib/geo/local-projection";

export interface TerrainGrid {
  version: number;
  routeId: string;
  source: string;
  bbox: GeoBBox;
  grid: { w: number; h: number };
  /** 列優先，j=0 為北、i=0 為西，單位公尺 */
  heights: number[];
}

/** 紙板等高：每一層的高度（公尺） */
export const CONTOUR_STEP_M = 30;
/** SRTM 在市區會把建築量成 10–40 m 的隆起；低於此值視為平地 */
export const LOWLAND_M = 40;

/** 盒狀模糊：抑制 SRTM 雜訊，避免分層時出現碎斑 */
export function smoothHeights(src: ArrayLike<number>, w: number, h: number, r: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let sum = 0;
      let n = 0;
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          const jj = j + dj;
          const ii = i + di;
          if (jj < 0 || jj >= h || ii < 0 || ii >= w) continue;
          sum += src[jj * w + ii]!;
          n++;
        }
      }
      out[j * w + i] = sum / n;
    }
  }
  return out;
}

/** 市區壓平：沙盤語意上城市是平底，低於門檻歸零，其餘整體下移 */
export function flattenLowland(heights: Float32Array, threshold = LOWLAND_M): Float32Array {
  return heights.map((e) => (e < threshold ? 0 : e - (threshold - 2)));
}

export function quantize(e: number, step = CONTOUR_STEP_M): number {
  return Math.round(e / step) * step;
}

/** 前處理後的高度場：平滑兩次 → 市區壓平 */
export function prepareHeights(grid: TerrainGrid): { heights: Float32Array; max: number } {
  const { w, h } = grid.grid;
  const smoothed = smoothHeights(smoothHeights(grid.heights, w, h, 3), w, h, 3);
  const heights = flattenLowland(smoothed);
  let max = 0;
  for (const e of heights) if (e > max) max = e;
  return { heights, max };
}

/** 雙線性取樣：給定經緯度回傳高度 */
export function sampleHeight(
  heights: ArrayLike<number>,
  grid: Pick<TerrainGrid, "bbox" | "grid">,
  lat: number,
  lon: number
): number {
  const { w, h } = grid.grid;
  const { minLon, maxLon, minLat, maxLat } = grid.bbox;
  const u = ((lon - minLon) / (maxLon - minLon)) * (w - 1);
  const v = ((maxLat - lat) / (maxLat - minLat)) * (h - 1);
  const i = Math.max(0, Math.min(w - 2, Math.floor(u)));
  const j = Math.max(0, Math.min(h - 2, Math.floor(v)));
  const fu = Math.max(0, Math.min(1, u - i));
  const fv = Math.max(0, Math.min(1, v - j));
  return (
    heights[j * w + i]! * (1 - fu) * (1 - fv) +
    heights[j * w + i + 1]! * fu * (1 - fv) +
    heights[(j + 1) * w + i]! * (1 - fu) * fv +
    heights[(j + 1) * w + i + 1]! * fu * fv
  );
}

/** 每個剖面點的坡度（±windowKm 視窗），供路線著色 */
export function pointGrades(profile: [number, number][], windowKm = 0.25): number[] {
  if (profile.length < 2) return profile.map(() => 0);
  const total = profile[profile.length - 1]![0];
  const eleAt = (km: number) => {
    if (km <= profile[0]![0]) return profile[0]![1];
    let lo = 0;
    let hi = profile.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (profile[mid]![0] <= km) lo = mid;
      else hi = mid;
    }
    const [k0, e0] = profile[lo]!;
    const [k1, e1] = profile[hi]!;
    return k1 > k0 ? e0 + ((e1 - e0) * (km - k0)) / (k1 - k0) : e0;
  };
  return profile.map(([km]) => {
    const a = Math.max(0, km - windowKm);
    const b = Math.min(total, km + windowKm);
    return b > a ? (eleAt(b) - eleAt(a)) / ((b - a) * 1000) : 0;
  });
}
