/**
 * TDX 即時道路事件（伺服器端專用）
 * /v1/Traffic/RoadEvent/LiveEvent/City/{City}：帶 POINT 座標，可對應到路線。
 *
 * TDX 限流很嚴（實測連續 6 次就 429），因此：
 * - 每個縣市結果快取 10 分鐘（失敗不快取，下次重試）
 * - 多個縣市依序請求，不並發
 */

import { unstable_cache } from "next/cache";
import { getAccessToken, tdxCityCode } from "@/lib/tdx/client";
import { parseTdxEvent, type RoadEvent } from "@/lib/routes/road-events";

const EVENT_BASE = "https://tdx.transportdata.tw/api/basic/v1/Traffic/RoadEvent/LiveEvent/City";
const REQUEST_TIMEOUT_MS = 6000;

async function fetchCityEventsUncached(cityCode: string): Promise<RoadEvent[]> {
  const token = await getAccessToken();
  const res = await fetch(`${EVENT_BASE}/${cityCode}?$format=JSON`, {
    headers: { Authorization: `Bearer ${token}`, "Accept-Encoding": "gzip, br" },
    cache: "no-store",
    // 網路卡住時不可拖住整頁判讀；逾時視為該縣市取不到
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`TDX 路況事件取得失敗 ${cityCode}: ${res.status}`);
  const data: unknown = await res.json();
  const list = Array.isArray(data)
    ? data
    : (Object.values((data ?? {}) as Record<string, unknown>).find(Array.isArray) ?? []);
  return (list as Parameters<typeof parseTdxEvent>[0][]).map(parseTdxEvent).filter((e): e is RoadEvent => e !== null);
}

const fetchCityEvents = (cityCode: string) =>
  unstable_cache(() => fetchCityEventsUncached(cityCode), ["tdx-road-events", cityCode], {
    revalidate: 600,
    tags: ["tdx-road-events"],
  })();

export interface RoadEventsResult {
  events: RoadEvent[];
  /** 取不到資料的縣市（顯示「暫時取不到」，不可當成沒有事件） */
  failed: string[];
}

/** 依路段縣市（可為舊名）取得事件；查無 TDX 代碼的縣市略過 */
export async function getRoadEvents(counties: string[]): Promise<RoadEventsResult> {
  const byCode = new Map<string, string>();
  for (const county of counties) {
    const code = tdxCityCode(county);
    if (code && !byCode.has(code)) byCode.set(code, county);
  }

  const events: RoadEvent[] = [];
  const failed: string[] = [];
  for (const [code, county] of byCode) {
    try {
      events.push(...(await fetchCityEvents(code)));
    } catch (e) {
      console.warn("[TDX] 路況事件取得失敗:", county, e instanceof Error ? e.message : e);
      failed.push(county);
    }
  }
  return { events, failed };
}
