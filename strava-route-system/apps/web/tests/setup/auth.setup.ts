import { test as setup } from "@playwright/test";
import { AUTH_STATE_PATH, NO_ACCOUNT_REASON, hasTestAccount } from "./auth-state";

setup("登入測試帳號", async ({ page }) => {
  setup.skip(!hasTestAccount(), NO_ACCOUNT_REASON);

  await page.goto("/login");
  await page.locator("#email").fill(process.env.E2E_USER_EMAIL!);
  await page.locator("#password").fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });

  // Firebase Web SDK 的登入狀態存在 IndexedDB，一併保存
  await page.context().storageState({ path: AUTH_STATE_PATH, indexedDB: true });
});
