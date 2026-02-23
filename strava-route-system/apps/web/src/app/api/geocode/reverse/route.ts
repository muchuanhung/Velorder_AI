import { NextResponse } from "next/server";
import { findTownshipDetailByLngLat } from "@/lib/maps/taiwan-towns-topojson";

/** 用本地 TopoJSON point-in-polygon 取得行政區（無外部 API） */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("latitude");
  const lngParam = searchParams.get("longitude");
  if (!latParam || !lngParam) {
    return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 });
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const detail = findTownshipDetailByLngLat(lng, lat);
  if (!detail) {
    return NextResponse.json({ error: "Location outside Taiwan or unknown" }, { status: 404 });
  }

  const displayName = `${detail.county}${detail.town}`;
  return NextResponse.json({
    source: "topojson",
    county: detail.county,
    district: detail.town,
    displayName,
  });
}
