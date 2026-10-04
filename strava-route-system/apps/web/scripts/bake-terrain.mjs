#!/usr/bin/env node
/* global process, Buffer */
/* eslint-disable turbo/no-undeclared-env-vars -- 手動執行的維運腳本，不是 turbo 任務 */
/**
 * 烘焙路線地形並上傳 Firebase Storage（/lab 三維沙盤用）
 *
 * 流程：讀路線清單 → 依路線 bbox 抓 SRTM（AWS Terrarium 圖磚，z13 約 17 m/px）
 *      → 取樣成高度網格 → 上傳 terrain/routes/{routeId}.json
 *
 * 用法（在 apps/web，Node 22）：
 *   node scripts/bake-terrain.mjs                 # 全部路線，上傳
 *   node scripts/bake-terrain.mjs --dry-run       # 只寫到暫存資料夾，不上傳
 *   node scripts/bake-terrain.mjs --only=<routeId>
 *   BASE_URL=http://localhost:3000 node scripts/bake-terrain.mjs
 *
 * 憑證：讀 .env.development 的 GOOGLE_APPLICATION_CREDENTIALS 與 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET。
 * 地形來源：SRTM（NASA/USGS），經 AWS Open Data「Terrain Tiles」，需標示出處。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ONLY = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const BASE_URL = process.env.BASE_URL ?? "https://strava-sync-alpha.vercel.app";

const ZOOM = 13;
const MARGIN = 0.12; // bbox 外擴比例，讓路線不貼邊
const MAX_W = 200; // 網格上限，控制檔案大小
const MAX_H = 320;
const TARGET_CELL_M = 48; // 目標網格間距
const TILE_CACHE = join(tmpdir(), "dawnline-terrain-tiles");
const OUT_DIR = join(tmpdir(), "dawnline-terrain-out");
const STORAGE_PREFIX = "terrain/routes";

try {
  process.loadEnvFile(join(APP_DIR, ".env.development"));
} catch {
  // 沒有 .env.development 時僅能 --dry-run
}

// ── 圖磚 ──
const n = 2 ** ZOOM;
const tileX = (lon) => ((lon + 180) / 360) * n;
const tileY = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
};

async function loadTile(x, y) {
  mkdirSync(TILE_CACHE, { recursive: true });
  const file = join(TILE_CACHE, `${ZOOM}-${x}-${y}.png`);
  let buf;
  if (existsSync(file)) buf = readFileSync(file);
  else {
    const res = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${ZOOM}/${x}/${y}.png`);
    if (!res.ok) throw new Error(`圖磚 ${x},${y} 下載失敗：HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(file, buf);
  }
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  return { data, ch: info.channels, w: info.width };
}

/** Terrarium 編碼：h = R*256 + G + B/256 - 32768，雙線性取樣 */
function makeSampler(tiles) {
  const px = (gx, gy) => {
    const tX = Math.floor(gx);
    const tY = Math.floor(gy);
    const t = tiles.get(`${tX},${tY}`);
    if (!t) return 0;
    const ix = Math.min(255, Math.floor((gx - tX) * 256));
    const iy = Math.min(255, Math.floor((gy - tY) * 256));
    const o = (iy * t.w + ix) * t.ch;
    return t.data[o] * 256 + t.data[o + 1] + t.data[o + 2] / 256 - 32768;
  };
  const s = 1 / 256;
  return (lat, lon) => {
    const gx = tileX(lon);
    const gy = tileY(lat);
    const x0 = Math.floor(gx * 256) / 256;
    const y0 = Math.floor(gy * 256) / 256;
    const u = (gx - x0) / s;
    const v = (gy - y0) / s;
    return (
      px(x0, y0) * (1 - u) * (1 - v) +
      px(x0 + s, y0) * u * (1 - v) +
      px(x0, y0 + s) * (1 - u) * v +
      px(x0 + s, y0 + s) * u * v
    );
  };
}

async function bakeRoute(route) {
  const [minLon0, minLat0, maxLon0, maxLat0] = route.bbox;
  const mLon = (maxLon0 - minLon0) * MARGIN;
  const mLat = (maxLat0 - minLat0) * MARGIN;
  const bbox = { minLon: minLon0 - mLon, maxLon: maxLon0 + mLon, minLat: minLat0 - mLat, maxLat: maxLat0 + mLat };

  const tiles = new Map();
  for (let x = Math.floor(tileX(bbox.minLon)); x <= Math.floor(tileX(bbox.maxLon)); x++) {
    for (let y = Math.floor(tileY(bbox.maxLat)); y <= Math.floor(tileY(bbox.minLat)); y++) {
      tiles.set(`${x},${y}`, await loadTile(x, y));
    }
  }
  const sample = makeSampler(tiles);

  const lat0 = (bbox.minLat + bbox.maxLat) / 2;
  const widthM = (bbox.maxLon - bbox.minLon) * 111_320 * Math.cos((lat0 * Math.PI) / 180);
  const depthM = (bbox.maxLat - bbox.minLat) * 110_574;
  let w = Math.round(widthM / TARGET_CELL_M);
  let h = Math.round(depthM / TARGET_CELL_M);
  const scale = Math.min(1, MAX_W / w, MAX_H / h);
  w = Math.max(32, Math.round(w * scale));
  h = Math.max(32, Math.round(h * scale));

  const heights = new Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const lon = bbox.minLon + ((bbox.maxLon - bbox.minLon) * i) / (w - 1);
      const lat = bbox.maxLat - ((bbox.maxLat - bbox.minLat) * j) / (h - 1); // j=0 為北
      heights[j * w + i] = Math.max(0, Math.round(sample(lat, lon)));
    }
  }
  return {
    version: 1,
    routeId: route.id,
    source: "SRTM（NASA/USGS）via AWS Terrain Tiles z13",
    bakedAt: new Date().toISOString(),
    bbox,
    grid: { w, h },
    heights,
    tiles: tiles.size,
  };
}

async function getBucket() {
  const { initializeApp, applicationDefault, getApps } = await import("firebase-admin/app");
  const { getStorage } = await import("firebase-admin/storage");
  const cred = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (cred && !cred.startsWith("/")) process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(APP_DIR, cred);
  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault() });
  return getStorage(app).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined);
}

async function main() {
  const res = await fetch(`${BASE_URL}/api/routes/gpx`);
  if (!res.ok) throw new Error(`路線清單讀取失敗：${BASE_URL} HTTP ${res.status}`);
  const routes = (await res.json()).filter((r) => !ONLY || r.id === ONLY);
  if (routes.length === 0) throw new Error(ONLY ? `找不到路線 ${ONLY}` : "沒有路線");

  const bucket = DRY_RUN ? null : await getBucket();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`${routes.length} 條路線，${DRY_RUN ? "僅寫入暫存（--dry-run）" : `上傳至 ${STORAGE_PREFIX}/`}`);

  for (const route of routes) {
    const { tiles, ...terrain } = await bakeRoute(route);
    const json = JSON.stringify(terrain);
    const kb = Math.round(json.length / 1024);
    if (bucket) {
      await bucket.file(`${STORAGE_PREFIX}/${route.id}.json`).save(json, {
        contentType: "application/json; charset=utf-8",
        metadata: { cacheControl: "public, max-age=86400" },
      });
    } else {
      writeFileSync(join(OUT_DIR, `${encodeURIComponent(route.id)}.json`), json);
    }
    const [lo, hi] = [Math.min(...terrain.heights), Math.max(...terrain.heights)];
    console.log(`✓ ${route.id}  ${terrain.grid.w}×${terrain.grid.h}  ${tiles} 張圖磚  ${lo}–${hi} m  ${kb} KB`);
  }
  if (!bucket) console.log(`輸出：${OUT_DIR}`);
}

main().catch((err) => {
  console.error("烘焙失敗：", err.message ?? err);
  process.exit(1);
});
