/**
 * 取得 Firestore 內 CCTV 筆數（驗證用）
 */

import { NextResponse } from "next/server";
import { getCCTVCountFirestore } from "@/lib/background/tdx-cctv.firestore";

export async function GET() {
  try {
    const count = await getCCTVCountFirestore();
    return NextResponse.json({ count });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
