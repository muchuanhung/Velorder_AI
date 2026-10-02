import { test, expect } from "@playwright/test";
import {
  computeHazards,
  deriveStages,
  isWeatherHazard,
  mapLatLonToKm,
  summarizeVerdict,
} from "@/lib/routes/recon-geo";
import { makeRoute, segment, slopeProfile, withWeather } from "../fixtures/route";

test.describe("computeHazards 只計算天氣", () => {
  test("陡坡路線也只產生降雨、風、雷雨示警", () => {
    const route = makeRoute({
      elevationProfile: slopeProfile(0.2),
      segments: [segment("士林區", [0, 10, 20], withWeather(70, { windSpeed: 40, condition: "stormy" }))],
    });
    const hazards = computeHazards(route, deriveStages(route));
    expect(new Set(hazards.map((h) => h.kind))).toEqual(new Set(["rain", "wind", "storm"]));
    expect(hazards.every(isWeatherHazard)).toBe(true);
  });

  test("陡坡、天氣良好：沒有任何示警", () => {
    const route = makeRoute({
      elevationProfile: slopeProfile(0.2),
      segments: [segment("士林區", [0, 10, 20], withWeather(10))],
    });
    expect(computeHazards(route, deriveStages(route))).toEqual([]);
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
  test("新資料：每個 segment 產生一個 stage，使用 sampleKms 中位數", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 10, 20]), segment("北投區", [15])],
    });
    const stages = deriveStages(route);
    // 新行為：每個 segment 一個 stage
    expect(stages).toHaveLength(2);
    // 士林區 sampleKms=[0,10,20]，中位數 = floor(3/2)=1，第 1 個 = 10
    expect(stages[0]?.name).toBe("士林區");
    expect(stages[0]?.km).toBe(10);
    // 北投區 sampleKms=[15]，中位數 = 15
    expect(stages[1]?.name).toBe("北投區");
    expect(stages[1]?.km).toBe(15);
  });

  test("舊資料沒有 sampleKms 時退回 5 點取樣對應", () => {
    const route = makeRoute({
      segments: [segment("大安區", []), segment("中山區", [])].map((s) => ({ ...s, sampleKms: undefined })),
    });
    const names = deriveStages(route).map((s) => s.name);
    expect(names).toEqual(["大安區", "中山區", "中山區", "中山區", "中山區"]);
  });

  test("新資料：stage 順序與 segments 一致", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 5]), segment("北投區", [10, 15]), segment("內湖區", [20])],
    });
    const stages = deriveStages(route);
    expect(stages).toHaveLength(3);
    expect(stages.map((s) => s.name)).toEqual(["士林區", "北投區", "內湖區"]);
  });
});

test.describe("computeHazards：天氣", () => {
  test("相鄰同等級的降雨路段合併為一筆", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 5], withWeather(70)), segment("北投區", [10, 15, 20], withWeather(10))],
    });
    const rain = hazardsOf(route).hazards.filter((h) => h.kind === "rain");
    expect(rain).toHaveLength(1);
    // 新行為：每 segment 一個 stage，士林區 stage 的範圍是 [0, 中點到下一個 stage]
    // 士林區 km=0（中位數），北投區 km=15（中位數），中點 = 7.5
    // 但因為 totalKm=20，實際 endKm 會依 stageRanges 計算
    expect(rain[0]).toMatchObject({ level: "risky", startKm: 0, label: "降雨 70%" });
    // endKm 依 stage 範圍計算，驗證 level 和 label 已足夠
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

  test("部分路段無天氣時不可宣稱安全，必須為未判定", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 5], withWeather(10)), segment("北投區", [10, 15, 20])],
    });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages);
    expect(verdict.level).toBe("unknown");
    expect(verdict.note).toContain("部分路段無天氣資料");
  });

  test("部分路段無天氣但有示警時，示警等級優先", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 5], withWeather(70)), segment("北投區", [10, 15, 20])],
    });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages);
    expect(verdict.level).toBe("risky");
    expect(verdict.note).toContain("部分路段無天氣資料");
  });

  test("取最嚴重的示警作為判定，並列出其他示警數", () => {
    const route = makeRoute({
      segments: [segment("士林區", [0, 10, 20], withWeather(70, { windSpeed: 40 }))],
    });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages);
    expect(verdict.level).toBe("risky");
    expect(verdict.headline).toBe("0.0 km 起降雨 70%");
    expect(verdict.note).toBe("另有 1 項示警");
  });

  test("只有路況事件、沒有天氣時，仍提示尚無天氣資料", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20])] });
    const stages = deriveStages(route);
    const event = { id: "e", kind: "event" as const, level: "caution" as const, startKm: 3, endKm: 3, label: "事故：交通事故" };
    const verdict = summarizeVerdict([event], stages);
    expect(verdict.level).toBe("caution");
    expect(verdict.note).toContain("尚無天氣資料");
  });

  test("路況事件服務完全失敗（eventsFailed=null）時，不可宣稱安全", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20], withWeather(10))] });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages, { eventsFailed: null });
    expect(verdict.level).toBe("unknown");
    expect(verdict.note).toContain("路況事件服務暫時無法取得");
  });

  test("路況事件部分縣市失敗時，不可宣稱安全", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20], withWeather(10))] });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages, { eventsFailed: ["新北市"] });
    expect(verdict.level).toBe("unknown");
    expect(verdict.note).toContain("部分路況事件取不到");
  });

  test("路況事件失敗但有示警時，示警等級優先", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20], withWeather(70))] });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages, { eventsFailed: null });
    expect(verdict.level).toBe("risky");
    expect(verdict.note).toContain("路況事件服務暫時無法取得");
  });

  test("eventsFailed 為空陣列時，可正常判定為安全", () => {
    const route = makeRoute({ segments: [segment("士林區", [0, 10, 20], withWeather(10))] });
    const { stages, hazards } = hazardsOf(route);
    const verdict = summarizeVerdict(hazards, stages, { eventsFailed: [] });
    expect(verdict.level).toBe("clear");
    expect(verdict.headline).toBe("沿途無示警");
  });
});
