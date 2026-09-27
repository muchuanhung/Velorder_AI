import { test, expect } from "@playwright/test";
import {
  computeHazards,
  deriveStages,
  isWeatherHazard,
  mapLatLonToKm,
  summarizeVerdict,
} from "@/lib/routes/recon-geo";
import { flatProfile, makeRoute, segment, slopeProfile, withWeather } from "../fixtures/route";

test.describe("isWeatherHazard", () => {
  test("降雨、風、雷雨算天氣；陡升陡降是路線特性", () => {
    const route = makeRoute({
      elevationProfile: slopeProfile(0.16),
      segments: [segment("士林區", [0, 10, 20], withWeather(70, { windSpeed: 40, condition: "stormy" }))],
    });
    const hazards = computeHazards(route, deriveStages(route));
    const kinds = (pred: (h: (typeof hazards)[number]) => boolean) => new Set(hazards.filter(pred).map((h) => h.kind));
    expect(kinds(isWeatherHazard)).toEqual(new Set(["rain", "wind", "storm"]));
    expect(kinds((h) => !isWeatherHazard(h))).toEqual(new Set(["climb"]));
  });
});

test.describe("mapLatLonToKm", () => {
  // 沿經線往北 2 km 的直線路線
  const points: [number, number][] = [
    [25.0, 121.55],
    [25.0 + 2 / 110.574, 121.55],
  ];
  const cumulativeKm = [0, 2];

  test("路線東側 100 m 的點：離路 0.1 km（不可放大 57 倍）", () => {
    const dLon = 0.1 / (111.32 * Math.cos((25.009 * Math.PI) / 180));
    const r = mapLatLonToKm(25.0 + 1 / 110.574, 121.55 + dLon, points, cumulativeKm)!;
    expect(r.km).toBeCloseTo(1, 2);
    expect(r.distKm).toBeCloseTo(0.1, 2);
  });

  test("路線上的點：離路 0", () => {
    expect(mapLatLonToKm(25.0 + 0.5 / 110.574, 121.55, points, cumulativeKm)!.distKm).toBeCloseTo(0, 4);
  });
});

function hazardsOf(route: ReturnType<typeof makeRoute>) {
  const stages = deriveStages(route);
  return { stages, hazards: computeHazards(route, stages) };
}

test.describe("deriveStages", () => {
  test("依 sampleKms 對應行政區（環狀路線回到起點）", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 20]), segment("北投區", [10])],
    });
    const at = (km: number) => deriveStages(route).find((s) => s.km === km)?.name;
    expect(at(0)).toBe("士林區");
    expect(at(10)).toBe("北投區");
    expect(at(20)).toBe("士林區");
  });

  test("舊資料沒有 sampleKms 時退回索引對應", () => {
    const route = makeRoute({
      segments: [segment("大安區", []), segment("中山區", [])].map((s) => ({ ...s, sampleKms: undefined })),
    });
    const names = deriveStages(route).map((s) => s.name);
    expect(names).toEqual(["大安區", "中山區", "中山區", "中山區", "中山區"]);
  });
});

test.describe("computeHazards：天氣", () => {
  test("相鄰同等級的降雨路段合併為一筆", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 5], withWeather(70)), segment("北投區", [10, 15, 20], withWeather(10))],
    });
    const rain = hazardsOf(route).hazards.filter((h) => h.kind === "rain");
    expect(rain).toHaveLength(1);
    expect(rain[0]).toMatchObject({ level: "risky", startKm: 0, endKm: 7.5, label: "降雨 70%" });
  });

  test("降雨 40% 為注意、60% 為危險、39% 無示警", () => {
    const levelFor = (rain: number) => {
      const route = makeRoute({ segments: [segment("士林區", [0, 10, 20], withWeather(rain))] });
      return hazardsOf(route).hazards.find((h) => h.kind === "rain")?.level ?? null;
    };
    expect(levelFor(39)).toBeNull();
    expect(levelFor(40)).toBe("caution");
    expect(levelFor(60)).toBe("risky");
  });

  test("預報有雨但降雨機率未達門檻，列為注意", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 10, 20], withWeather(30, { condition: "rainy" }))],
    });
    const rain = hazardsOf(route).hazards.find((h) => h.kind === "rain");
    expect(rain).toMatchObject({ level: "caution", label: "降雨 30%" });
  });

  test("沒有天氣資料的路段不產生天氣示警（預設 0 不可當成真值）", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 10, 20], { rainProbability: 90, hasWeather: false })],
    });
    expect(hazardsOf(route).hazards).toEqual([]);
  });
});

test.describe("computeHazards：坡度", () => {
  test("12% 陡升為注意", () => {
    const { hazards } = hazardsOf(makeRoute({ elevationProfile: slopeProfile(0.12) }));
    expect(hazards).toContainEqual(expect.objectContaining({ kind: "climb", level: "caution", label: "陡升 12%" }));
    expect(hazards.some((h) => h.level === "risky")).toBe(false);
  });

  test("16% 陡升為危險", () => {
    const { hazards } = hazardsOf(makeRoute({ elevationProfile: slopeProfile(0.16) }));
    expect(hazards).toContainEqual(expect.objectContaining({ kind: "climb", level: "risky", label: "陡升 16%" }));
  });

  test("12% 陡降為注意，不再是綠色的低嚴重度", () => {
    const { hazards } = hazardsOf(makeRoute({ elevationProfile: slopeProfile(-0.12) }));
    expect(hazards).toContainEqual(expect.objectContaining({ kind: "descent", level: "caution", label: "陡降 12%" }));
  });

  test("取樣雜訊（±3 m 起伏）不算陡坡", () => {
    const bumpy = flatProfile().map(([km], i): [number, number] => [km, 100 + (i % 2 === 0 ? 3 : -3)]);
    expect(hazardsOf(makeRoute({ elevationProfile: bumpy })).hazards).toEqual([]);
  });
});

test.describe("summarizeVerdict", () => {
  test("完全沒有天氣資料時為未判定，不可顯示安全", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20])] });
    const { stages, hazards } = hazardsOf(route);
    expect(summarizeVerdict(hazards, stages)).toMatchObject({ level: "unknown", headline: "尚無天氣資料" });
  });

  test("有天氣且無示警時為安全", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20], withWeather(10))] });
    const { stages, hazards } = hazardsOf(route);
    expect(summarizeVerdict(hazards, stages)).toEqual({ level: "clear", headline: "沿途無示警", note: "" });
  });

  test("部分路段無天氣時加註", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 5], withWeather(10)), segment("北投區", [10, 15, 20])],
    });
    const { stages, hazards } = hazardsOf(route);
    expect(summarizeVerdict(hazards, stages)).toMatchObject({ level: "clear", note: "部分路段無天氣資料" });
  });

  test("取最嚴重的示警作為判定，並列出其他示警數", () => {
    const route = makeRoute({
      elevationProfile: slopeProfile(0.12),
      segments: [segment("士林區", [0, 10, 20], withWeather(70))],
    });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages);
    expect(verdict.level).toBe("risky");
    expect(verdict.headline).toBe("0.0 km 起降雨 70%");
    expect(verdict.note).toMatch(/^另有 \d+ 項示警$/);
  });

  test("只有坡度示警、沒有天氣時，仍提示尚無天氣資料", () => {
    const route = makeRoute({ elevationProfile: slopeProfile(0.12), segments: [segment("士林區", [0, 10, 20])] });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages);
    expect(verdict.level).toBe("caution");
    expect(verdict.note).toContain("尚無天氣資料");
  });
});
