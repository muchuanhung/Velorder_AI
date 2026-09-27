import { test, expect, type Page } from "@playwright/test";
import { CCTV_FEED, makeRoute, segment, slopeProfile } from "../fixtures/route";
import { stubCctv, stubRoutes, stubWeather } from "./stubs";

// 大安區在起點；士林區涵蓋 10 km 之後，對應的示警從 7.5 km 開始
const ROUTE = makeRoute({
  segments: [segment("大安區", [0]), segment("士林區", [10, 15, 20])],
});

const verdictBar = (page: Page) =>
  page.getByRole("status").filter({ hasText: /危險|注意|安全|未判定/ });

test.describe("/routes 路線偵察", () => {
  test.beforeEach(async ({ page }) => {
    await stubRoutes(page, [ROUTE]);
  });

  test("危險天氣時，判定列在最上層並說明原因", async ({ page }) => {
    await stubWeather(page, { 大安區: 10, 士林區: 70 });
    await stubCctv(page, [CCTV_FEED]);
    await page.goto("/routes");

    const verdict = verdictBar(page);
    await expect(verdict).toContainText("危險");
    await expect(verdict).toContainText("7.5 km 起降雨 70%");

    // 資訊層級：判定 → 示警 → 高程圖 → 監視器
    const order = await Promise.all(
      [
        verdict,
        page.getByRole("region", { name: /沿途示警/ }),
        page.getByRole("region", { name: "海拔與位置" }),
        page.getByRole("region", { name: /沿途監視器/ }),
      ].map(async (l) => (await l.boundingBox())!.y)
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  test("判定列不用捲動就看得到", async ({ page }) => {
    await stubWeather(page, { 大安區: 10, 士林區: 70 });
    await stubCctv(page, [CCTV_FEED]);
    await page.goto("/routes");
    await expect(verdictBar(page)).toBeInViewport();
  });

  test("天氣 API 失敗時顯示未判定，絕不顯示安全", async ({ page }) => {
    await stubWeather(page, "error");
    await stubCctv(page, [CCTV_FEED]);
    await page.goto("/routes");

    await expect(verdictBar(page)).toContainText("未判定");
    await expect(verdictBar(page)).toContainText("尚無天氣資料");
    await expect(page.getByText("無天氣資料", { exact: true })).toBeVisible();
    await expect(page.getByText("安全", { exact: true })).toHaveCount(0);
  });

  test("點示警會把位置移到該處", async ({ page }) => {
    await stubWeather(page, { 大安區: 10, 士林區: 70 });
    await stubCctv(page, [CCTV_FEED]);
    await page.goto("/routes");

    const readout = page.getByRole("region", { name: "海拔與位置" });
    await expect(readout).not.toContainText("7.5 km");
    await page.getByRole("button", { name: /降雨 70%/ }).click();
    await expect(readout).toContainText("7.5 km");
  });

  test("CCTV 載入失敗與沿途無監視器分開顯示", async ({ page }) => {
    await stubWeather(page, { 大安區: 10, 士林區: 10 });
    await stubCctv(page, "error");
    await page.goto("/routes");
    await expect(page.getByText("監視器載入失敗")).toBeVisible();
  });
});

test.describe("/routes 與 Dashboard 判定一致", () => {
  test("只有陡坡、天氣良好時判定為安全，陡坡列為路線特性", async ({ page }) => {
    const steep = makeRoute({ elevationProfile: slopeProfile(0.16), segments: ROUTE.segments });
    await stubRoutes(page, [steep]);
    await stubWeather(page, { 大安區: 10, 士林區: 10 });
    await stubCctv(page, [CCTV_FEED]);
    await page.goto("/routes");

    await expect(verdictBar(page)).toContainText("安全");
    await expect(page.getByText("路線特性")).toBeVisible();
    await expect(page.getByRole("button", { name: /陡升 16%/ })).toBeVisible();
  });

  test("?route= 直接打開指定路線", async ({ page }) => {
    const second = makeRoute({ id: "second-route", name: "Second Route", segments: ROUTE.segments });
    await stubRoutes(page, [ROUTE, second]);
    await stubWeather(page, { 大安區: 10, 士林區: 10 });
    await stubCctv(page, [CCTV_FEED]);
    await page.goto("/routes?route=second-route");

    await expect(page.getByRole("heading", { level: 2, name: "Second Route" })).toBeVisible();
  });
});
