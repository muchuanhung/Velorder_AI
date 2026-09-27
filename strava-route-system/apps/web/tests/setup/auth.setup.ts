import { test as setup } from "@playwright/test";
import { AUTH_STATE_PATH, NO_ACCOUNT_REASON, hasTestAccount } from "./auth-state";

setup("登入測試帳號", async ({ page }) => {
  setup.skip(!hasTestAccount(), NO_ACCOUNT_REASON);

  await page.goto("/login");
  await page.locator("#email").fill(process.env.E2E_USER_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  // 等判讀真的渲染完成：順便預熱伺服器端的路線／天氣／路況快取，
  // 否則 dashboard 測試同時打冷伺服器，每個請求都各自重算而互相拖到逾時
  await page
    .getByRole("heading", { level: 2, name: /^(安全|注意|危險|未判定|目前沒有可判讀的路線)$/ })
    .waitFor({ timeout: 60_000 });

  // Firebase Web SDK 的登入狀態存在 IndexedDB，一併保存
  await page.context().storageState({ path: AUTH_STATE_PATH, indexedDB: true });
});
