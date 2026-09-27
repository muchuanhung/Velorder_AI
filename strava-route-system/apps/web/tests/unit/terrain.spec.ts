import { test, expect } from "@playwright/test";
import {
  flattenLowland,
  pointGrades,
  prepareHeights,
  quantize,
  sampleHeight,
  smoothHeights,
  type TerrainGrid,
} from "@/lib/lab/terrain";

const bbox = { minLon: 121.5, maxLon: 121.6, minLat: 25.0, maxLat: 25.1 };

test.describe("地形前處理", () => {
  test("平滑：常數場維持不變", () => {
    const flat = new Array(12 * 8).fill(250);
    expect([...smoothHeights(flat, 12, 8, 3)].every((e) => Math.abs(e - 250) < 1e-9)).toBe(true);
  });

  test("平滑：單點雜訊被攤平", () => {
    const src = new Array(9 * 9).fill(100);
    src[4 * 9 + 4] = 1000;
    const out = smoothHeights(src, 9, 9, 2);
    expect(out[4 * 9 + 4]).toBeLessThan(200);
  });

  test("市區壓平：40 m 以下歸零，以上整體下移", () => {
    expect([...flattenLowland(Float32Array.from([0, 25, 39.9, 40, 540]))]).toEqual([0, 0, 0, 2, 502]);
  });

  test("分層：四捨五入到 30 m", () => {
    expect([quantize(0), quantize(14), quantize(16), quantize(767)]).toEqual([0, 0, 30, 780]);
  });

  test("取樣：四角與中心的雙線性結果正確", () => {
    // 2×2：西北 0、東北 100、西南 200、東南 300
    const grid = { bbox, grid: { w: 2, h: 2 } };
    const hs = [0, 100, 200, 300];
    expect(sampleHeight(hs, grid, 25.1, 121.5)).toBeCloseTo(0);
    expect(sampleHeight(hs, grid, 25.1, 121.6)).toBeCloseTo(100);
    expect(sampleHeight(hs, grid, 25.0, 121.5)).toBeCloseTo(200);
    expect(sampleHeight(hs, grid, 25.05, 121.55)).toBeCloseTo(150);
  });

  test("取樣：bbox 外夾回邊界，不會回傳 NaN", () => {
    const grid = { bbox, grid: { w: 2, h: 2 } };
    expect(Number.isFinite(sampleHeight([0, 100, 200, 300], grid, 30, 130))).toBe(true);
  });

  test("prepareHeights：回傳最高點", () => {
    const w = 20;
    const h = 20;
    const heights = Array.from({ length: w * h }, (_, k) => ((k % w) / (w - 1)) * 600);
    const grid: TerrainGrid = { version: 1, routeId: "t", source: "test", bbox, grid: { w, h }, heights };
    const { heights: out, max } = prepareHeights(grid);
    expect(out).toHaveLength(w * h);
    expect(max).toBeGreaterThan(400);
    expect(max).toBeLessThan(600);
  });
});

test.describe("pointGrades", () => {
  test("等坡度剖面：每點坡度一致", () => {
    const profile = Array.from({ length: 51 }, (_, i): [number, number] => [i / 10, 100 + i * 8]); // 8 m / 100 m = 8%
    for (const g of pointGrades(profile)) expect(g).toBeCloseTo(0.08, 5);
  });

  test("平路為 0、下坡為負", () => {
    const flat = Array.from({ length: 11 }, (_, i): [number, number] => [i / 10, 50]);
    expect(pointGrades(flat).every((g) => g === 0)).toBe(true);
    const down = Array.from({ length: 11 }, (_, i): [number, number] => [i / 10, 500 - i * 12]);
    expect(pointGrades(down).every((g) => g < 0)).toBe(true);
  });
});
