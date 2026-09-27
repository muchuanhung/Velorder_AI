import { test, expect, type Page } from "@playwright/test";
import { CCTV_FEED, makeRoute, segment, slopeProfile } from "../fixtures/route";
import { stubCctv, stubRoutes, stubWeather } from "./stubs";

// 5 km 處有一段 1 km 的 16% 陡坡；鏡頭在約 5.5 km
const ROUTE = makeRoute({
  elevationProfile: slopeProfile(0.16),
  segments: [segment("大安區", [0]), segment("士林區", [10, 20])],
});

/** 假地形：覆蓋路線 bbox 的 40×60 網格，往北漸高 */
async function stubTerrain(page: Page) {
  const [minLon, minLat, maxLon, maxLat] = ROUTE.bbox!;
  const w = 40;
  const h = 60;
  const heights = Array.from({ length: w * h }, (_, k) => Math.round((1 - Math.floor(k / w) / (h - 1)) * 600));
  await page.route("**/api/lab/terrain?**", (r) =>
    r.fulfill({
      json: { version: 1, routeId: ROUTE.id, source: "test", bbox: { minLon, maxLon, minLat, maxLat }, grid: { w, h }, heights },
    })
  );
}

// headless Chromium 以軟體 GPU（SwiftShader）算 WebGL，與其他 worker 平行時單一測試約需 30–40 秒，
// 超過預設 30 秒上限。放寬這支檔案的時間上限，不用重試掩蓋問題。
test.describe.configure({ timeout: 90_000 });

test.beforeEach(async ({ page }) => {
  await stubRoutes(page, [ROUTE]);
  await stubWeather(page, "error");
  await stubCctv(page, [CCTV_FEED]);
  await stubTerrain(page);
});

test("桌機：3D 直接顯示，點監視器後所有面板跳到該處", async ({ page, isMobile }) => {
  test.skip(isMobile, "桌機限定");
  await page.goto("/lab/route-sim");

  const stage = page.getByRole("region", { name: "三維地形與剖面" });
  await expect(stage.locator("canvas").first()).toBeVisible({ timeout: 45_000 }); // 負載高時動態載入 three.js＋建幾何可能超過 20 秒
  await expect(page.getByRole("status").filter({ hasText: "危險" })).toContainText("陡升 16%");

  const readout = page.getByRole("region", { name: "海拔與位置" });
  await expect(readout).toContainText("0.0 km");
  await page.getByRole("button", { name: /故宮路-至善路口/ }).first().click();
  await expect(readout).not.toContainText("0.0 km");
  // 監視器面板切到該鏡頭
  await expect(page.getByText("故宮路-至善路口・故宮路-至善路口 (士林區)")).toBeVisible();
});

test("手機：3D 預設收起，點卡片才全螢幕載入", async ({ page, isMobile }) => {
  test.skip(!isMobile, "手機限定");
  await page.goto("/lab/route-sim");

  await expect(page.getByRole("button", { name: /3D 地形與監視器/ })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.getByRole("button", { name: /3D 地形與監視器/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("canvas").first()).toBeVisible({ timeout: 45_000 }); // 負載高時動態載入 three.js＋建幾何可能超過 20 秒

  await dialog.getByRole("button", { name: "關閉" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
