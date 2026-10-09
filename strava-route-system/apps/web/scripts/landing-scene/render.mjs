// 產生入口頁背景的靜態圖層：node scripts/landing-scene/render.mjs
// 需要 Playwright 的 Chromium；輸出到 public/landing/。
/* global process, Buffer, window */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../../public/landing");
mkdirSync(out, { recursive: true });

// 本機選用：指定 Chromium 路徑（只給這支產生腳本用，不影響建置）
// eslint-disable-next-line turbo/no-undeclared-env-vars
const chromiumPath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(chromiumPath ? { executablePath: chromiumPath } : {});
const page = await browser.newPage({ deviceScaleFactor: 1 });
// 場景參數與網頁動畫共用（src/components/auth/dawn-scene-params.json）
const params = readFileSync(join(here, "../../src/components/auth/dawn-scene-params.json"), "utf8");
await page.addInitScript(`window.__DAWN_PARAMS = ${params};`);
await page.goto("file://" + join(here, "scene.html"));
const assets = await page.evaluate(() => window.__renderAssets());
await browser.close();

for (const [name, url] of Object.entries(assets)) {
  const file = join(out, `dawn-${name}.webp`);
  writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
  console.log(file);
}
