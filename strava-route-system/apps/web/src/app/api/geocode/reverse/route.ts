import { NextResponse } from "next/server";

/** 代理 Nominatim reverse geocoding（繁中地名，適合台灣/中文市場） */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("latitude");
  const lng = searchParams.get("longitude");
  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=zh`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Velorder-Strava-Weather/1.0" },
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
  return NextResponse.json({ source: "nominatim", ...data });
}
