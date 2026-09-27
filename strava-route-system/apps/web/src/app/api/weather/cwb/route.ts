import { NextResponse } from "next/server";
import { CwbError, getDistrictWeather } from "@/lib/cwb/district-weather.server";

export type { CWBWeatherResponse } from "@/lib/cwb/district-weather.server";

/** GET /api/weather/cwb?county=臺北市&district=士林區 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const district = searchParams.get("district") ?? undefined;
  if (!county) {
    return NextResponse.json({ error: "缺少 county 參數" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getDistrictWeather(county, district));
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
