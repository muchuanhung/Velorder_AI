import { test, expect } from "@playwright/test";
import { computeRouteStatus } from "@/lib/routes/route-data";
import { segment, withWeather } from "../fixtures/route";

test.describe("computeRouteStatus", () => {
  test("取最高降雨：70% 與 20% 兩區判為危險（平均 45% 會被稀釋成注意）", () => {
    const result = computeRouteStatus([
      segment("士林區", [0], withWeather(70)),
      segment("北投區", [10], withWeather(20)),
    ]);
    expect(result.status).toBe("risky");
    expect(result.verdictMessage).toContain("最高降雨機率 70%");
  });

  test("最高降雨 40% 為注意", () => {
    const result = computeRouteStatus([
      segment("士林區", [0], withWeather(40)),
      segment("北投區", [10], withWeather(0)),
    ]);
    expect(result.status).toBe("caution");
  });

  test("預報有雨為注意", () => {
    const result = computeRouteStatus([segment("士林區", [0], withWeather(10, { condition: "rainy" }))]);
    expect(result.status).toBe("caution");
  });

  test("天氣良好為安全", () => {
    const result = computeRouteStatus([segment("士林區", [0], withWeather(10))]);
    expect(result.status).toBe("safe");
  });
});
