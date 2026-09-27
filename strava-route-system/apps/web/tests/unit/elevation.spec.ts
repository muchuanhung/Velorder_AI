import { test, expect } from "@playwright/test";
import { repairSteppedElevation } from "@/lib/routes/elevation";
import { computeHazards, deriveStages } from "@/lib/routes/recon-geo";
import { makeRoute } from "../fixtures/route";

/**
 * 平均 10% 的爬坡，但海拔每 0.5 km 才跳一次 50 m（階梯紀錄）。
 * 到 19.9 km 為止，讓最後一階是完整的一段；若終點剛好是新一階的第一個點，
 * 那一跳無從得知跨了多長距離，修復也無法消除（已知邊界，實際 GPX 罕見）。
 */
function steppedClimb(): [number, number][] {
  return Array.from({ length: 200 }, (_, i): [number, number] => {
    const km = i / 10;
    return [km, 100 + Math.floor(km / 0.5) * 50];
  });
}

test.describe("repairSteppedElevation", () => {
  test("階梯輸入：修復後單調、不再跳格，起終點保留", () => {
    const input = steppedClimb();
    const out = repairSteppedElevation(input);
    expect(out).toHaveLength(input.length);
    expect(out[0]).toEqual(input[0]);
    expect(out[out.length - 1]).toEqual(input[input.length - 1]);
    for (let i = 1; i < out.length; i++) {
      expect(out[i]![1]).toBeGreaterThanOrEqual(out[i - 1]![1]);
      expect(out[i]![1] - out[i - 1]![1]).toBeLessThan(20); // 原本會一次跳 50 m
    }
  });

  test("平滑輸入：完全不變", () => {
    const smooth = Array.from({ length: 50 }, (_, i): [number, number] => [i / 10, 100 + i * 3.7]);
    expect(repairSteppedElevation(smooth)).toEqual(smooth.map(([k, e]) => [k, Math.round(e * 10) / 10]));
  });

  test("全程等高：不變", () => {
    const flat = Array.from({ length: 20 }, (_, i): [number, number] => [i / 10, 42]);
    expect(repairSteppedElevation(flat)).toEqual(flat);
  });

  test("里程不變，點數不變（3D 與 CCTV 投影仍對齊）", () => {
    const input = steppedClimb();
    expect(repairSteppedElevation(input).map(([k]) => k)).toEqual(input.map(([k]) => k));
  });

  test("階梯版 10% 爬坡修復後只判注意，不會出現假的危險", () => {
    const raw = makeRoute({ elevationProfile: steppedClimb() });
    const rawRisky = computeHazards(raw, deriveStages(raw)).some((h) => h.level === "risky");
    expect(rawRisky).toBe(true); // 修復前：跳格處算出假陡坡

    const fixed = makeRoute({ elevationProfile: repairSteppedElevation(steppedClimb()) });
    const hz = computeHazards(fixed, deriveStages(fixed));
    expect(hz.some((h) => h.level === "risky")).toBe(false);
    expect(hz.some((h) => h.kind === "climb" && h.level === "caution")).toBe(true);
  });
});
