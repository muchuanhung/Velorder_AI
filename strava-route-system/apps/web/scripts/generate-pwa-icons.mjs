#!/usr/bin/env node
/**
 * 從 public/icon.svg 產生 PWA 所需的 PNG 圖示
 * 執行: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svgPath = join(publicDir, "icon.svg");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    process.exit(0);
  }

  const svg = readFileSync(svgPath);
  const sizes = [192, 512];

  for (const size of sizes) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer();
    writeFileSync(join(publicDir, `icon-${size}.png`), buf);
    console.log(`已產生 icon-${size}.png`);
  }

  // Apple touch icon (180x180)
  const appleBuf = await sharp(svg).resize(180, 180).png().toBuffer();
  writeFileSync(join(publicDir, "apple-icon.png"), appleBuf);
  console.log("已產生 apple-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
