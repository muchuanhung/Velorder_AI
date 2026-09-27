import { test, expect } from "@playwright/test";
import { createLocalProjection } from "@/lib/geo/local-projection";

// 以台北 101 為中心的 0.1° 方框
const bbox = { minLon: 121.5145, maxLon: 121.6145, minLat: 24.9836, maxLat: 25.0836 };
const proj = createLocalProjection(bbox);

test.describe("局部等距投影", () => {
  test("bbox 中心（台北 101）投影到原點", () => {
    expect(proj.x(121.5645)).toBeCloseTo(0, 6);
    expect(proj.z(25.0336)).toBeCloseTo(0, 6);
  });

  test("往北約 1 km → z 約 -1；往東約 1 km → x 約 +1", () => {
    expect(proj.z(25.0336 + 1000 / 110_574)).toBeCloseTo(-1, 3);
    const dLon = 1000 / (111_320 * Math.cos((25.0336 * Math.PI) / 180));
    expect(proj.x(121.5645 + dLon)).toBeCloseTo(1, 3);
  });

  test("寬深換算：0.1° 在北緯 25 度約 10.1 × 11.1 km", () => {
    expect(proj.widthKm).toBeGreaterThan(10);
    expect(proj.widthKm).toBeLessThan(10.2);
    expect(proj.depthKm).toBeCloseTo(11.06, 1);
  });
});
