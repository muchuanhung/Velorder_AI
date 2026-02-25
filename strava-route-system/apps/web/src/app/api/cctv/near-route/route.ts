/**
 * 依路線 bbox 查詢附近 CCTV（Firestore 篩選）
 * GET /api/cctv/near-route?minLon=&minLat=&maxLon=&maxLat=
 */

import { NextResponse } from "next/server";
import { getCCTVInBbox } from "@/lib/background/tdx-cctv.firestore";
import type { CCTVFeed } from "@/lib/routes/route-data";

function toCCTVFeed(doc: { id: string; label: string; roadName?: string; county?: string; videoUrl: string; syncedAt: number }): CCTVFeed {
  const seed = doc.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    id: doc.id,
    label: doc.label,
    location: doc.roadName ?? doc.county ?? doc.label,
    lastUpdated: new Date(doc.syncedAt).toLocaleString("zh-TW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    imageSeed: seed,
    status: "online",
    videoUrl: doc.videoUrl || undefined,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minLon = parseFloat(searchParams.get("minLon") ?? "");
  const minLat = parseFloat(searchParams.get("minLat") ?? "");
  const maxLon = parseFloat(searchParams.get("maxLon") ?? "");
  const maxLat = parseFloat(searchParams.get("maxLat") ?? "");

  if (Number.isNaN(minLon) || Number.isNaN(minLat) || Number.isNaN(maxLon) || Number.isNaN(maxLat)) {
    return NextResponse.json({ error: "缺少 bbox 參數：minLon, minLat, maxLon, maxLat" }, { status: 400 });
  }

  try {
    const bbox: [number, number, number, number] = [minLon, minLat, maxLon, maxLat];
    const docs = await getCCTVInBbox(bbox, 15);
    const feeds: CCTVFeed[] = docs.map(toCCTVFeed);
    return NextResponse.json(feeds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
