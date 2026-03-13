#!/usr/bin/env node
/**
 * 從 public/icon.svg 產生 PWA 所需的 PNG 圖示與 favicon
 * 執行: pnpm run generate-pwa-icons
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svgPath = join(publicDir, "icon.svg");

async function main() {
  let sharp;
  let toIco;
  try {
    sharp = (await import("sharp")).default;
    toIco = (await import("to-ico")).default;
  } catch (e) {
    console.warn("缺少 sharp 或 to-ico，跳過圖示產生。執行 pnpm install 後重試。");
    process.exit(0);
  }

  const svg = readFileSync(svgPath);

  // icon.png (32x32) - layout metadata
  const icon32 = await sharp(svg).resize(32, 32).png().toBuffer();
  writeFileSync(join(publicDir, "icon.png"), icon32);
  console.log("已產生 icon.png");

  // icon-192.png, icon-512.png - PWA manifest
  for (const size of [192, 512]) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer();
    writeFileSync(join(publicDir, `icon-${size}.png`), buf);
    console.log(`已產生 icon-${size}.png`);
  }

  // apple-icon.png (180x180)
  const appleBuf = await sharp(svg).resize(180, 180).png().toBuffer();
  writeFileSync(join(publicDir, "apple-icon.png"), appleBuf);
  console.log("已產生 apple-icon.png");

  // favicon.ico (16, 32, 48)
  const faviconSizes = [16, 32, 48];
  const faviconBuffers = await Promise.all(
    faviconSizes.map((s) => sharp(svg).resize(s, s).png().toBuffer())
  );
  const icoBuf = await toIco(faviconBuffers);
  writeFileSync(join(publicDir, "favicon.ico"), icoBuf);
  console.log("已產生 favicon.ico");

  // 更新 manifest 的 icon URL 加上 cache-busting，避免 PWA 安裝後圖示不更新
  const manifestPath = join(publicDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const v = Date.now();
  manifest.icons = manifest.icons.map((icon) => ({
    ...icon,
    src: `${icon.src}${icon.src.includes("?") ? "&" : "?"}v=${v}`,
  }));
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log("已更新 manifest.json (cache-busting)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
