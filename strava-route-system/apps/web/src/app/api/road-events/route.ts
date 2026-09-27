/**
 * 依縣市取得 TDX 即時道路事件（已解析為 RoadEvent，未過濾路線）
 * GET /api/road-events?counties=台北市,台北縣
 *
 * 對應到路線由客戶端以路線折線計算（lib/routes/road-events.matchEventsToRoute）。
 * 伺服器端每縣市快取 10 分鐘，縣市數有上限，避免被拿來打爆 TDX 配額。
 */

import { NextResponse } from "next/server";
import { getRoadEvents } from "@/lib/tdx/road-events.server";

const MAX_COUNTIES = 6;

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("counties") ?? "";
  const counties = [...new Set(raw.split(",").map((c) => c.trim()).filter(Boolean))];
  if (counties.length === 0 || counties.length > MAX_COUNTIES) {
    return NextResponse.json({ error: `counties 需為 1–${MAX_COUNTIES} 個縣市` }, { status: 400 });
  }

  const result = await getRoadEvents(counties);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
