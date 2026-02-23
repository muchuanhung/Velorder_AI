/**
 * Google/Mapbox Polyline 編解碼
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */

const VIEWBOX = { width: 200, height: 120, padding: 10 };

export function encodePolyline(points: { lat: number; lon: number }[]): string {
  if (points.length === 0) return "";
  let result = "";
  let prevLat = 0;
  let prevLon = 0;

  for (const { lat, lon } of points) {
    result += encodeValue(Math.round((lat - prevLat) * 1e5));
    result += encodeValue(Math.round((lon - prevLon) * 1e5));
    prevLat = lat;
    prevLon = lon;
  }
  return result;
}

function encodeValue(value: number): string {
  value = value < 0 ? ~(value << 1) : value << 1;
  let s = "";
  while (value >= 0x20) {
    s += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }
  s += String.fromCharCode(value + 63);
  return s;
}

export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let lat = 0;
  let lon = 0;
  let i = 0;

  while (i < encoded.length) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlon = (result & 1) ? ~(result >> 1) : result >> 1;
    lon += dlon;

    points.push([lat / 1e5, lon / 1e5]);
  }
  return points;
}

/** 將 polyline 解碼後轉成 SVG path (viewBox 0 0 200 120) */
export function polylineToSvgPath(
  encoded: string,
  viewBox = VIEWBOX
): string {
  const points = decodePolyline(encoded);
  if (points.length < 2) return "";

  const lats = points.map((p) => p[0]);
  const lons = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latRange = maxLat - minLat || 0.0001;
  const lonRange = maxLon - minLon || 0.0001;
  const w = viewBox.width - viewBox.padding * 2;
  const h = viewBox.height - viewBox.padding * 2;

  const toXY = (lat: number, lon: number): [number, number] => {
    const x = viewBox.padding + ((lon - minLon) / lonRange) * w;
    const y = viewBox.height - viewBox.padding - ((lat - minLat) / latRange) * h;
    return [x, y];
  };

  const start = toXY(points[0]![0], points[0]![1]);
  const parts = [`M ${start[0].toFixed(2)} ${start[1].toFixed(2)}`];
  for (let i = 1; i < points.length; i++) {
    const pt = points[i]!;
    const xy = toXY(pt[0], pt[1]);
    parts.push(`L ${xy[0].toFixed(2)} ${xy[1].toFixed(2)}`);
  }
  return parts.join(" ");
}

/** 判斷是否為 polyline 編碼（非 SVG path） */
export function isPolylineEncoded(str: string): boolean {
  return (
    str.length > 0 &&
    !str.trimStart().startsWith("M ") &&
    !str.trimStart().startsWith("m ") &&
    /^[\x20-\x7e]+$/.test(str)
  );
}

/** 取得可用於 SVG 的 path：支援 polyline 或既有 SVG path */
export function getSvgPath(pathData: string): string {
  return isPolylineEncoded(pathData)
    ? polylineToSvgPath(pathData)
    : pathData;
}
