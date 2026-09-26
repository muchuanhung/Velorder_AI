/**
 * 手動觸發 TDX CCTV 同步（開發/驗證用）
 * POST 直接執行同步，方便驗證
 * production 需帶 header `x-sync-secret`，值須等於 env CCTV_SYNC_SECRET；未設定時一律拒絕
 */

import { NextResponse } from "next/server";
import { fetchAllCCTV, TDX_SYNC_CITIES } from "@/lib/tdx/client";
import { persistCCTVFirestore } from "@/lib/background/tdx-cctv.firestore";

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CCTV_SYNC_SECRET;
  if (!secret) return false;
  return request.headers.get("x-sync-secret") === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  try {
    const items = await fetchAllCCTV(TDX_SYNC_CITIES);
    const { written, skipped } = await persistCCTVFirestore(items);
    return NextResponse.json({
      ok: true,
      total: items.length,
      written,
      skipped,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
