/**
 * TDX 即時道路事件的純函式：解析、分級、對應到路線
 * 不依賴 React 與伺服器，可單元測試；伺服器端抓取在 lib/tdx/road-events.server.ts。
 *
 * 分級（依 2026-09 實際資料歸納：EventSubType 百位數 = EventType）：
 * - 事故(1)、特殊管制(4)、交通障礙(8)：今天突發的狀況 → 判「注意」
 * - 施工(2)、壅塞(3)、活動(7)：列出但不影響判定
 * - 例行道路維護（2/298，道管中心許可、無到期時間、數量大）→ 收合成一行，避免洗版
 */

import { mapLatLonToKm, type Hazard, type RoutePolylineKm } from "@/lib/routes/recon-geo";

export type RoadEventCategory = "accident" | "control" | "obstacle" | "construction" | "congestion" | "activity" | "other";

export interface RoadEvent {
  id: string;
  type: number;
  subType: number;
  title: string;
  description: string;
  lat: number;
  lon: number;
  source: string;
  /** ISO 字串（含 +08:00） */
  effectiveTime: string | null;
  expireTime: string | null;
  updatedTime: string | null;
}

export interface RouteEvent extends RoadEvent {
  category: RoadEventCategory;
  /** 例行道路維護：收合顯示 */
  routine: boolean;
  /** 是否影響出發判定 */
  affectsVerdict: boolean;
  km: number;
  distKm: number;
}

export const CATEGORY_LABEL: Record<RoadEventCategory, string> = {
  accident: "事故",
  control: "管制",
  obstacle: "交通障礙",
  construction: "施工",
  congestion: "壅塞",
  activity: "活動",
  other: "路況",
};

/** 事件離路線多近才算「在路線上」：事件發生在道路上，門檻比監視器（2 km）嚴 */
export const EVENT_MAX_DIST_KM = 0.15;
const ROUTINE_MAINTENANCE_SUBTYPE = 298;

export function categoryOf(type: number): RoadEventCategory {
  switch (type) {
    case 1:
      return "accident";
    case 2:
      return "construction";
    case 3:
      return "congestion";
    case 4:
      return "control";
    case 7:
      return "activity";
    case 8:
      return "obstacle";
    default:
      return "other";
  }
}

const VERDICT_CATEGORIES = new Set<RoadEventCategory>(["accident", "control", "obstacle"]);

type TdxRawEvent = {
  EventID?: string;
  EventTitle?: string;
  Description?: string;
  EventType?: number;
  EventSubType?: number;
  Positions?: string;
  Source?: string;
  EffectiveTime?: string;
  ExpireTime?: string;
  LastUpdateTime?: string;
};

/** TDX 原始資料 → RoadEvent；沒有可用座標（POINT）的事件回傳 null */
export function parseTdxEvent(raw: TdxRawEvent): RoadEvent | null {
  const m = String(raw.Positions ?? "").match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
  if (!m || !raw.EventID) return null;
  const lon = Number(m[1]);
  const lat = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    id: raw.EventID,
    type: raw.EventType ?? 0,
    subType: raw.EventSubType ?? 0,
    title: (raw.EventTitle ?? "").trim() || "路況事件",
    description: (raw.Description ?? "").trim(),
    lat,
    lon,
    source: raw.Source ?? "",
    effectiveTime: raw.EffectiveTime ?? null,
    expireTime: raw.ExpireTime ?? null,
    updatedTime: raw.LastUpdateTime ?? null,
  };
}

/** 目前有效：已生效且未到期（沒有時間欄位視為有效） */
export function isActive(e: RoadEvent, now: Date = new Date()): boolean {
  const t = now.getTime();
  if (e.effectiveTime && Date.parse(e.effectiveTime) > t) return false;
  if (e.expireTime && Date.parse(e.expireTime) <= t) return false;
  return true;
}

/** 有效事件中，落在路線 maxDistKm 內者，依里程排序 */
export function matchEventsToRoute(
  events: RoadEvent[],
  polyline: RoutePolylineKm | null,
  { now = new Date(), maxDistKm = EVENT_MAX_DIST_KM }: { now?: Date; maxDistKm?: number } = {}
): RouteEvent[] {
  if (!polyline) return [];
  // 先用路線範圍框（外擴 maxDistKm）排除遠處事件：台北一次就有數百筆，
  // 逐筆對整條折線求距離在伺服器端是同步的重運算
  const lats = polyline.points.map((p) => p[0]);
  const lons = polyline.points.map((p) => p[1]);
  const padLat = maxDistKm / 110.574;
  const padLon = maxDistKm / (111.32 * Math.cos((Math.max(...lats.map(Math.abs)) * Math.PI) / 180));
  const [minLat, maxLat] = [Math.min(...lats) - padLat, Math.max(...lats) + padLat];
  const [minLon, maxLon] = [Math.min(...lons) - padLon, Math.max(...lons) + padLon];

  const out: RouteEvent[] = [];
  for (const e of events) {
    if (e.lat < minLat || e.lat > maxLat || e.lon < minLon || e.lon > maxLon) continue;
    if (!isActive(e, now)) continue;
    const hit = mapLatLonToKm(e.lat, e.lon, polyline.points, polyline.cumulativeKm);
    if (!hit || hit.distKm > maxDistKm) continue;
    const category = categoryOf(e.type);
    out.push({
      ...e,
      category,
      routine: e.subType === ROUTINE_MAINTENANCE_SUBTYPE,
      affectsVerdict: VERDICT_CATEGORIES.has(category),
      km: hit.km,
      distKm: hit.distKm,
    });
  }
  return out.sort((a, b) => a.km - b.km);
}

/** 影響判定的事件 → 示警（一律「注意」：代碼對照未經官方文件確認，不判危險） */
export function eventHazards(routeEvents: RouteEvent[]): Hazard[] {
  return routeEvents
    .filter((e) => e.affectsVerdict)
    .map((e) => ({
      id: `event-${e.id}`,
      kind: "event" as const,
      level: "caution" as const,
      startKm: e.km,
      endKm: e.km,
      label: `${CATEGORY_LABEL[e.category]}：${e.title}`,
    }));
}

/** 顯示分組：影響判定者走示警清單；其餘分成一般路況與例行維護 */
export function groupRouteEvents(routeEvents: RouteEvent[]) {
  return {
    notices: routeEvents.filter((e) => !e.affectsVerdict && !e.routine),
    routine: routeEvents.filter((e) => !e.affectsVerdict && e.routine),
  };
}
