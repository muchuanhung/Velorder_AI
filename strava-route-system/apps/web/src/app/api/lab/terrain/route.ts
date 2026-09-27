/**
 * 從 Firebase Storage 取得路線的烘焙地形（/lab 三維沙盤用）
 * 資料由 scripts/bake-terrain.mjs 產生並上傳至 terrain/routes/{routeId}.json
 */

import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { isLabEnabled } from "@/lib/lab/flag";

const TERRAIN_FOLDER = "terrain/routes";

export async function GET(request: Request) {
  if (!isLabEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const routeId = new URL(request.url).searchParams.get("routeId") ?? "";
  if (!routeId || routeId.includes("/") || routeId.includes("..")) {
    return NextResponse.json({ error: "缺少或不合法的 routeId" }, { status: 400 });
  }

  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = getFirebaseAdmin().storage().bucket(bucketName || undefined);
    const file = bucket.file(`${TERRAIN_FOLDER}/${routeId}.json`);
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: "此路線尚未產生地形資料" }, { status: 404 });
    }
    const [buf] = await file.download();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // 地形資料只在重新烘焙時變動
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("地形資料讀取失敗:", err);
    return NextResponse.json({ error: "地形資料讀取失敗" }, { status: 500 });
  }
}
