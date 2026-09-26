import { defineConfig, devices } from "@playwright/test";
import { AUTH_STATE_PATH } from "./tests/setup/auth-state";

// 測試帳號（E2E_USER_EMAIL／E2E_USER_PASSWORD）放在 .env.local，已被 .gitignore 排除
try {
  process.loadEnvFile(".env.local");
} catch {
  // 沒有 .env.local 時 dashboard 測試會自動跳過
}

/** 只跑 unit 時不需要 server，避免每次都要先 build */
function isUnitOnly(argv: string[]): boolean {
  const projects: string[] = [];
  argv.forEach((arg, i) => {
    if (arg.startsWith("--project=")) projects.push(arg.slice("--project=".length));
    else if (arg === "--project" && argv[i + 1]) projects.push(argv[i + 1]!);
  });
  return projects.length > 0 && projects.every((p) => p === "unit");
}

// E2E 測 production build：dev server 同時服務多個瀏覽器時送 JS 太慢且會中途重新編譯，
// 平行測試會超時。用 3100 port，不影響開著的 pnpm dev（3000）。
// 直接呼叫 next build，不走 pnpm build，避免 generate-pwa-icons 覆寫 public/ 的 icon。
const PORT = 3100;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    // 純函式，不開瀏覽器
    { name: "unit", testDir: "./tests/unit" },
    {
      name: "e2e-desktop",
      testDir: "./tests/e2e",
      testIgnore: /dashboard/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "e2e-mobile",
      testDir: "./tests/e2e",
      testIgnore: /dashboard/,
      use: { ...devices["Pixel 7"] },
    },
    // 需要 .env.local 的測試帳號；未設定時整組跳過
    { name: "auth-setup", testDir: "./tests/setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "e2e-dashboard",
      testDir: "./tests/e2e",
      testMatch: /dashboard/,
      dependencies: ["auth-setup"],
      use: { ...devices["Desktop Chrome"], storageState: AUTH_STATE_PATH },
    },
  ],
  webServer: isUnitOnly(process.argv)
    ? undefined
    : {
        command: `pnpm exec next build && pnpm exec next start --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        // 每次都重新 build，避免測到舊版本
        reuseExistingServer: false,
        timeout: 300_000,
      },
});
