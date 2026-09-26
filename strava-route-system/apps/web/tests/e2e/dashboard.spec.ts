import { test, expect } from "@playwright/test";
import { NO_ACCOUNT_REASON, hasTestAccount } from "../setup/auth-state";

test.skip(!hasTestAccount(), NO_ACCOUNT_REASON);

test.describe("Dashboard 同步流程", () => {
  test("同步完成後顯示筆數，並可直達路線示警", async ({ page }) => {
    // 攔截同步 API，不打 Strava、不寫 Firestore
    await page.route("**/api/strava/sync", (r) =>
      r.fulfill({ json: { success: true, count: 3, activities: [] } })
    );
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "同步 Strava" }).click();
    await expect(page.getByRole("status").filter({ hasText: "已同步 3 筆活動" })).toBeVisible();

    await page.getByRole("link", { name: "查看路線示警" }).click();
    await expect(page).toHaveURL(/\/routes/);
  });

  test("側欄預設就看得到熱門路線", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "熱門路線" }).first()).toBeVisible();
  });
});
