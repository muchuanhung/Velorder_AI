import type { Page } from "@playwright/test";
import type { CCTVFeed, Route } from "@/lib/routes/route-data";
import type { RoadEvent } from "@/lib/routes/road-events";

/**
 * 以假資料攔截瀏覽器端 API，測試不打真的 CWB／TDX，結果固定且不需要金鑰
 */

export async function stubRoutes(page: Page, routes: Route[]) {
  await page.route("**/api/routes/gpx", (r) => r.fulfill({ json: routes }));
  // 測試路線位於台北，不攔截會打到真的 TDX，附近剛好有事件就會改變判定；預設沒有事件
  await stubEvents(page, []);
}

/** 路況事件；"error" 模擬 TDX 失敗。後註冊的攔截優先，可在 stubRoutes 之後覆寫 */
export async function stubEvents(page: Page, events: RoadEvent[] | "error") {
  await page.route("**/api/road-events?**", (r) =>
    events === "error"
      ? r.fulfill({ status: 500, json: { error: "TDX 請求失敗" } })
      : r.fulfill({ json: { events, failed: [] } })
  );
}

/** 依行政區回傳降雨機率；"error" 模擬 CWB 失敗 */
export async function stubWeather(page: Page, rainByDistrict: Record<string, number> | "error") {
  await page.route("**/api/weather/cwb?**", (r) => {
    if (rainByDistrict === "error") {
      return r.fulfill({ status: 500, json: { error: "CWB 請求失敗" } });
    }
    const district = new URL(r.request().url()).searchParams.get("district") ?? "";
    const pop = rainByDistrict[district] ?? 0;
    return r.fulfill({
      json: {
        temperature: 25,
        windSpeedKmh: 8,
        condition: pop >= 60 ? "rainy" : "cloudy",
        rainfall12h: [{ pop, label: "下午06:00", endLabel: "上午06:00" }],
      },
    });
  });
}

/** "error" 模擬 CCTV API 失敗 */
export async function stubCctv(page: Page, feeds: CCTVFeed[] | "error") {
  await page.route("**/api/cctv/near-route**", (r) =>
    feeds === "error"
      ? r.fulfill({ status: 500, json: { error: "TDX 請求失敗" } })
      : r.fulfill({ json: feeds })
  );
}
