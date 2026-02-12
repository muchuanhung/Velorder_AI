import { NextResponse } from "next/server";
import {
  getCWBdatasetId,
  normalizeCountyForCWB,
} from "@/lib/cwb/county-map";

const CWB_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

type WeatherElement = {
  ElementName?: string;
  Time?: Array<{
    StartTime?: string;
    EndTime?: string;
    ElementValue?: Array<Record<string, string>>;
  }>;
};

type CWBLocation = {
  LocationName?: string;
  WeatherElement?: WeatherElement[];
};

function getPopFromForecast(forecastData: unknown): number {
  const locations = (forecastData as { records?: { Locations?: CWBLocation | CWBLocation[] } })
    ?.records?.Locations;
  const locs = Array.isArray(locations) ? locations : locations ? [locations] : [];
  const countyObj = locs[0] as { Location?: CWBLocation[] } | undefined;
  const loc = countyObj?.Location?.[0];
  if (!loc?.WeatherElement?.length) return 0;
  const popEl = loc.WeatherElement.find((e) => e.ElementName === "12小時降雨機率");
  const firstTime = popEl?.Time?.[0];
  const v = firstTime?.ElementValue?.[0];
  const pop = parseInt(
    v?.ProbabilityOfPrecipitation ?? v?.value ?? "0",
    10
  );
  return Number.isNaN(pop) ? 0 : Math.min(100, Math.max(0, pop));
}

export async function GET() {
  const key = process.env.CWB_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "CWB_API_KEY 未設定" }, { status: 500 });
  }

  const counties = [
    "宜蘭縣", "桃園市", "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣",
    "嘉義縣", "屏東縣", "臺東縣", "花蓮縣", "澎湖縣", "基隆市", "新竹市",
    "嘉義市", "臺北市", "高雄市", "新北市", "臺中市", "臺南市", "連江縣", "金門縣",
  ];

  const auth = `Authorization=${encodeURIComponent(key)}`;
  const format = "format=JSON";

  try {
    const results = await Promise.all(
      counties.map(async (county) => {
        const datasetId = getCWBdatasetId(county);
        if (!datasetId) return { county, pop: 0 };
        const cwbCounty = normalizeCountyForCWB(county);
        const url = `${CWB_BASE}/F-D0047-${datasetId}?${auth}&${format}`;
        const res = await fetch(url, { next: { revalidate: 600 } });
        if (!res.ok) return { county: cwbCounty, pop: 0 };
        const data = await res.json();
        const success = data?.success === "true" || data?.success === true;
        if (!success) return { county: cwbCounty, pop: 0 };
        return { county: cwbCounty, pop: getPopFromForecast(data) };
      })
    );

    const countyRainfall: Record<string, number> = {};
    for (const { county, pop } of results) {
      countyRainfall[county] = pop;
    }

    return NextResponse.json(countyRainfall);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `CWB 全縣市請求失敗：${err}` },
      { status: 500 }
    );
  }
}
