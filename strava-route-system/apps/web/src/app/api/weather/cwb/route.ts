import { NextResponse } from "next/server";
import { CwbError, getDistrictWeather } from "@/lib/cwb/district-weather.server";

export type { CWBWeatherResponse } from "@/lib/cwb/district-weather.server";

/** GET /api/weather/cwb?county=臺北市&district=士林區[&lat=25.09&lon=121.52]；lat/lon 用於挑選附近雨量站 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const district = searchParams.get("district") ?? undefined;
  if (!county) {
    return NextResponse.json({ error: "缺少 county 參數" }, { status: 400 });
  }
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const near =
    searchParams.has("lat") && searchParams.has("lon") && Number.isFinite(lat) && Number.isFinite(lon)
      ? [{ lat, lon }]
      : [];

  try {
    return NextResponse.json(await getDistrictWeather(county, district, { near }));
  } catch (e) {
    if (e instanceof CwbError) {
      return NextResponse.json({ error: e.message, detail: e.detail }, { status: e.status });
    }
    return NextResponse.json(
      { error: `CWB 請求失敗：${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
