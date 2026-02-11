import { NextResponse } from "next/server";
import { getCWBdatasetId } from "@/lib/cwb/county-map";

const CWB_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

type CWBWeatherCondition = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy";

const CONDITION_VALUES: CWBWeatherCondition[] = ["sunny", "cloudy", "rainy", "stormy", "snowy"];

/** CWB 天氣現象（中文）→ condition */
const WEATHER_TEXT_MAP: Record<string, CWBWeatherCondition> = {
  晴: "sunny",
  多雲: "cloudy",
  陰: "cloudy",
  雨: "rainy",
  雷: "stormy",
  雪: "snowy",
};

function resolveCondition(conditionOrWeather?: string, weatherText?: string): CWBWeatherCondition {
  const c = (conditionOrWeather ?? "").toLowerCase();
  if (CONDITION_VALUES.includes(c as CWBWeatherCondition)) return c as CWBWeatherCondition;
  for (const [key, val] of Object.entries(WEATHER_TEXT_MAP)) {
    if (weatherText?.includes(key)) return val;
  }
  return "cloudy";
}

export type CWBWeatherResponse = {
  temperature: number;
  feelsLike: number;
  condition: CWBWeatherCondition;
  description: string;
  windSpeed: number;
  windSpeedKmh: number;
  humidity: number;
  uvIndex: number;
  uvLevel: string;
  sunset: string;
  rainfall12h: Array<{ startTime: string; endTime: string; pop: number; label: string }>;
  verdict: string;
  verdictType: "good" | "caution" | "bad";
};

type WeatherElement = {
  ElementName?: string;
  Time?: Array<{ StartTime?: string; EndTime?: string; ElementValue?: Array<Record<string, string>> }>;
};

type CWBLocation = {
  LocationName?: string;
  WeatherElement?: WeatherElement[];
};

function pickLocOrFirst(
  arr: CWBLocation[] | undefined,
  district?: string
): CWBLocation | undefined {
  if (!arr?.length) return undefined;
  if (district) {
    const found = arr.find((loc) => loc.LocationName?.includes(district));
    if (found) return found;
  }
  return arr[0];
}

function getElementValue(elements: WeatherElement[] | undefined, name: string): Record<string, string> | undefined {
  if (!elements?.length) return undefined;
  const item = elements.find((e) => e.ElementName === name);
  const firstTime = item?.Time?.[0];
  return firstTime?.ElementValue?.[0];
}

/** 從 O-A0002-002 回傳中取得該縣市最大 1hr 雨量 (mm/hr)，若無資料回傳 null */
function parseRainfallMmPerHr(rainData: unknown, county: string): number | null {
  const countyNorm = county.replace(/台/g, "臺");
  let maxRain = 0;
  let found = false;
  const rec = (rainData as { records?: Record<string, unknown> })?.records;
  const stations = (rec?.Station ?? rec?.station) as unknown[] | undefined;
  const arr = Array.isArray(stations) ? stations : stations ? [stations] : [];
  for (const s of arr) {
    const st = s as Record<string, unknown>;
    const stationCounty = String(st?.CountyName ?? st?.countyName ?? "");
    if (!stationCounty.includes(countyNorm) && !stationCounty.includes(county)) continue;
    const rainVal =
      st?.Rain ??
      st?.rain ??
      st?.Precipitation ??
      st?.precipitation ??
      (st?.WeatherElement as Array<{ ElementName?: string; ElementValue?: Array<{ value?: string }> }>)?.find?.((e) => /雨量|RAIN|Rain/i.test(e.ElementName ?? ""))?.ElementValue?.[0]?.value;
    const r = parseFloat(String(rainVal ?? "0").replace(/^-$|^T$|^X$/i, "0"));
    if (!Number.isNaN(r) && r > maxRain) maxRain = r;
    found = true;
  }
  return found ? maxRain : null;
}

/** 降雨判斷：雨量 mm/hr → verdict，windMs 用於雨+風體感判斷 */
function computeVerdict(
  temp: number,
  pop: number,
  uv: number,
  windMs: number,
  rainfallMmPerHr: number | null
): { verdict: string; verdictType: "good" | "caution" | "bad" } {
  const rain = rainfallMmPerHr;
  const hasRainData = rain !== null;

  // 中雨 2.6+ / 大雨 >8：不論機率，不適合或嚴禁
  if (hasRainData && rain >= 2.6) {
    if (rain > 8) return { verdict: "大雨，嚴禁戶外運動", verdictType: "bad" };
    return { verdict: "中雨，不適合戶外運動", verdictType: "bad" };
  }

  // 雨量 > 0.5 且 風速 > 10 m/s → 體感嚴寒，不適合
  if (hasRainData && rain > 0.5 && windMs > 10) {
    return { verdict: "雨勢加上強風，體感寒冷，不適合戶外運動", verdictType: "bad" };
  }

  // 自動忽略：雨量 < 0.5 mm/hr，不論 PoP → 適合
  if (hasRainData && rain < 0.5) {
    const msg = rain < 0.1 ? "微量降雨，適合運動" : "毛毛雨，適合運動";
    return { verdict: msg, verdictType: "good" };
  }

  // 警示：PoP >= 70% 且 雨量 >= 1.0 mm/hr → 不適合
  if (pop >= 70 && (rain === null || rain >= 1)) {
    return { verdict: "高降雨機率，不建議戶外運動", verdictType: "bad" };
  }

  // 小雨 0.5–2.5：尚可跑步，不適球類
  if (hasRainData && rain >= 0.5 && rain <= 2.5) {
    return { verdict: "小雨，尚可跑步，不建議球類運動", verdictType: "caution" };
  }

  // 其他 bad 條件
  const bad: string[] = [];
  if (uv >= 8) bad.push("高紫外線");
  if (windMs > 10) bad.push("風速較強");
  if (temp >= 35 || temp <= 5) bad.push("溫度極端");
  if (bad.length > 0) return { verdict: bad.join("，不建議戶外運動"), verdictType: "bad" };

  // 一般 caution
  if (pop >= 40 || uv >= 6) return { verdict: "注意防曬與降雨", verdictType: "caution" };
  return { verdict: "適合戶外運動", verdictType: "good" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get("county");
  const district = searchParams.get("district") ?? undefined;

  const key = process.env.CWB_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "CWB_API_KEY 未設定" }, { status: 500 });
  }
  if (!county) {
    return NextResponse.json({ error: "缺少 county 參數" }, { status: 400 });
  }

  const datasetId = getCWBdatasetId(county);
  if (!datasetId) {
    return NextResponse.json(
      { error: `找不到縣市對應：${county}，請使用繁體中文縣市名（如：新竹縣）` },
      { status: 400 }
    );
  }

  const auth = `Authorization=${encodeURIComponent(key)}`;
  const format = "format=JSON";

  try {
    const [forecastRes, sunsetRes, rainRes] = await Promise.all([
      fetch(`${CWB_BASE}/F-D0047-${datasetId}?${auth}&${format}`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${CWB_BASE}/A-B0062-001?${auth}&${format}`, {
        next: { revalidate: 86400 },
      }),
      fetch(`${CWB_BASE}/O-A0002-002?${auth}&${format}&locationName=${encodeURIComponent(county.replace(/台/g, "臺"))}`, {
        next: { revalidate: 600 },
      }),
    ]);

    if (!forecastRes.ok) {
      const t = await forecastRes.text();
      return NextResponse.json(
        { error: `CWB 預報 API 錯誤：${forecastRes.status}`, detail: t },
        { status: 502 }
      );
    }
    if (!sunsetRes.ok) {
      const t = await sunsetRes.text();
      return NextResponse.json(
        { error: `CWB 日出日落 API 錯誤：${sunsetRes.status}`, detail: t },
        { status: 502 }
      );
    }

    const forecastData = await forecastRes.json();
    let rainfallMmPerHr: number | null = null;
    if (rainRes.ok) {
      try {
        const rainData = await rainRes.json();
        rainfallMmPerHr = parseRainfallMmPerHr(rainData, county);
      } catch {
        // 雨量 API 失敗不影響主流程
      }
    }
    const sunsetData = await sunsetRes.json();

    const success = forecastData?.success === "true" || forecastData?.success === true;
    if (!success) {
      return NextResponse.json(
        { error: "CWB 預報資料異常", result: forecastData?.result },
        { status: 502 }
      );
    }

    const locations = forecastData?.records?.Locations;
    const locs = Array.isArray(locations) ? locations : locations ? [locations] : [];
    const countyObj = locs[0] as { Location?: CWBLocation[] } | undefined;
    const loc = pickLocOrFirst(countyObj?.Location, district) ?? countyObj?.Location?.[0];

    if (!loc?.WeatherElement?.length) {
      return NextResponse.json({ error: "無法取得該地區預報" }, { status: 404 });
    }

    const weatherElements: WeatherElement[] = loc.WeatherElement;
    const getVal = (name: string) => getElementValue(weatherElements, name);

    const tempVal = getVal("平均溫度");
    const temp = parseInt(tempVal?.Temperature ?? tempVal?.value ?? "0", 10) || 0;

    const maxAT = getVal("最高體感溫度");
    const minAT = getVal("最低體感溫度");
    const feelsLike = Math.round(
      (parseInt(maxAT?.MaxApparentTemperature ?? maxAT?.value ?? "0", 10) +
        parseInt(minAT?.MinApparentTemperature ?? minAT?.value ?? "0", 10)) /
        2
    ) || temp;

    const wx = getVal("天氣現象");
    const condition = resolveCondition(
      wx?.condition ?? wx?.Condition,
      wx?.Weather ?? wx?.value
    );

    const descEl = getVal("天氣預報綜合描述");
    const description = descEl?.WeatherDescription ?? descEl?.value ?? "—";

    const windEl = getVal("風速");
    const windMs = parseFloat(windEl?.WindSpeed ?? windEl?.value ?? "0") || 0;
    const windKmh = Math.round(windMs * 3.6);

    const rhEl = getVal("平均相對濕度");
    const humidity = parseInt(rhEl?.RelativeHumidity ?? rhEl?.value ?? "0", 10) || 0;

    const uvEl = getVal("紫外線指數");
    const uvIndex = parseInt(uvEl?.UVIndex ?? uvEl?.value ?? "0", 10) || 0;
    const uvLevel = uvEl?.UVExposureLevel ?? uvEl?.value ?? "—";

    const popEl = getVal("12小時降雨機率");
    const popFirst = parseInt(popEl?.ProbabilityOfPrecipitation ?? popEl?.value ?? "0", 10) || 0;

    const popTimes = weatherElements.find((e: WeatherElement) => e.ElementName === "12小時降雨機率")?.Time ?? [];
    const rainfall12h = popTimes.slice(0, 12).map((t: { StartTime?: string; EndTime?: string; ElementValue?: Array<Record<string, string>> }) => {
      const v = t.ElementValue?.[0];
      const pop = parseInt(v?.ProbabilityOfPrecipitation ?? v?.value ?? "0", 10) || 0;
      const start = t.StartTime ?? "";
      const end = t.EndTime ?? "";
      const label = start ? new Date(start).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) : "—";
      return { startTime: start, endTime: end, pop, label };
    });

    const today = new Date().toISOString().slice(0, 10);
    const sunsetLocList = sunsetData?.records?.locations?.location;
    const sunsetLocs = Array.isArray(sunsetLocList) ? sunsetLocList : sunsetLocList ? [sunsetLocList] : [];
    const countyNorm = county.replace(/台/g, "臺");
    const sunsetLoc = sunsetLocs.find(
      (l: { locationName?: string; CountyName?: string }) =>
        (l.locationName ?? l.CountyName ?? "").includes(countyNorm) ||
        (l.locationName ?? l.CountyName ?? "").includes(county)
    ) ?? sunsetLocs[0];
    const sunsetTime = sunsetLoc?.time?.find((t: { Date?: string }) => t.Date === today);
    const sunsetStr = sunsetTime?.SunSetTime ?? "17:45";

    const { verdict, verdictType } = computeVerdict(
      temp,
      popFirst,
      uvIndex,
      windMs,
      rainfallMmPerHr
    );

    const out: CWBWeatherResponse = {
      temperature: temp,
      feelsLike,
      condition,
      description,
      windSpeed: windMs,
      windSpeedKmh: windKmh,
      humidity,
      uvIndex,
      uvLevel,
      sunset: sunsetStr,
      rainfall12h,
      verdict,
      verdictType,
    };

    // Debug: 輸出關鍵氣象資料
    console.log("[CWB]", {
      county,
      district,
      temp: `${temp}°C`,
      feelsLike: `${feelsLike}°C`,
      rainfallMmPerHr: rainfallMmPerHr ?? "無資料",
      pop: `${popFirst}%`,
      uvIndex,
      windMs: `${windMs} m/s`,
      humidity: `${humidity}%`,
      verdict,
      verdictType,
    });

    return NextResponse.json(out);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `CWB 請求失敗：${err}` }, { status: 500 });
  }
}
