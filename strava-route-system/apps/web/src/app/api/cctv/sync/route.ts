/**
 * 手動觸發 TDX CCTV 同步（開發/驗證用）
 * POST 直接執行同步，方便驗證
 */

import { NextResponse } from "next/server";
import { fetchAllCCTV, TDX_SYNC_CITIES } from "@/lib/tdx/client";
import { persistCCTVFirestore } from "@/lib/background/tdx-cctv.firestore";

export async function POST() {
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
