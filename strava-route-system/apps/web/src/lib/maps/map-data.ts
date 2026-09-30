// 台灣鄉鎮區地圖資料：投影、行政區（topojson）與中央氣象署降雨機率色階

import { getTaiwanTownshipsFromTopojson } from "./taiwan-towns-topojson";

const BBOX = { minLng: 118.217, maxLng: 122.006, minLat: 21.896, maxLat: 26.276 };
const VIEW = { w: 100, h: 90 };

/** 經緯度 → SVG 座標 (viewBox 0 0 100 90) */
export function projectLngLatToSvg(lng: number, lat: number): [number, number] {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * VIEW.w;
  const y = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * VIEW.h;
  return [x, y];
}

/**
 * 根據 focus 中心點與 zoom 計算 SVG viewBox
 * @param center [lng, lat] 中心點
 * @param zoom 100=全台, 越大越放大（如 150=1.5x）
 */
export function getViewBoxForFocus(center: [number, number], zoom: number): string {
  const [cx, cy] = projectLngLatToSvg(center[0], center[1]);
  const scale = zoom / 100;
  const w = VIEW.w / scale;
  const h = VIEW.h / scale;
  const x = Math.max(0, Math.min(cx - w / 2, VIEW.w - w));
  const y = Math.max(0, Math.min(cy - h / 2, VIEW.h - h));
  return `${x} ${y} ${w} ${h}`;
}

export interface District {
  id: string;
  name: string;
  nameZh: string;
  /** 0–100；hasRain 為 false 時沒有意義，不可顯示為 0% */
  rainProbability: number;
  /** 是否取得該縣市的降雨機率 */
  hasRain: boolean;
  center: [number, number]; // [lng, lat]
  /** SVG path（viewBox 0 0 100 90） */
  path: string;
  isCurrentDistrict: boolean;
  countyName?: string;
  townName?: string;
}

/**
 * 從 LocationContext 的 LocationInfo 取得 縣市鄉鎮區 字串
 * 格式如 "台北市大安區"，供 getTaiwanTownships 使用
 */
export function getCurrentLocationFromInfo(
  info: {
    county?: string;
    city?: string;
    district?: string;
  } | null
): string {
  if (!info) return "台北市大安區";
  const county = info.county ?? info.city ?? "";
  const district = info.district ?? "";
  const s = county && district ? `${county}${district}` : county || "台北市大安區";
  return s.replace(/\s/g, "");
}

/**
 * 鄉鎮區 (~368)，例如 台北市大安區
 * @param currentLocation 使用者位置，格式 "縣市鄉鎮區" 如 "台北市大安區"
 * @param lngLat 若有經緯度則用 point-in-polygon 找出鄉鎮區，優先於 currentLocation
 * @param countyRainfall 縣市名 → 12hr 降雨機率，來自 CWB API
 */
export function getTaiwanTownships(
  currentLocation = "台北市大安區",
  lngLat?: [number, number],
  countyRainfall?: Record<string, number>
): District[] {
  return getTaiwanTownshipsFromTopojson(currentLocation, lngLat, countyRainfall).map((t) => ({
    id: t.id,
    name: t.name,
    nameZh: t.nameZh,
    rainProbability: t.rainProbability,
    hasRain: t.hasRain,
    center: t.center,
    path: t.path,
    isCurrentDistrict: t.isCurrentDistrict,
    countyName: t.countyName,
    townName: t.townName,
  }));
}

/** 降雨機率色階：單一藍色系由淺到深（降雨的慣用色），五段 */
export const RAIN_STEPS = [
  { max: 20, color: "#BFDDF0" },
  { max: 40, color: "#8BBEE3" },
  { max: 60, color: "#4F8FCC" },
  { max: 80, color: "#2A63A8" },
  { max: 100, color: "#143F78" },
] as const;

export function getRainColor(probability: number): string {
  return (RAIN_STEPS.find((s) => probability <= s.max) ?? RAIN_STEPS[4]).color;
}
