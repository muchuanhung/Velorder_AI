/**
 * Geohash encode（供 Firestore GeoQuery 使用）
 *
 * ## 原理
 * Geohash 將 (lat, lon) 編碼成字串，相鄰座標會有相同前綴，適合做「附近查詢」。
 * 做法：交替對經度、緯度做二分法，每次比較中點決定 0 或 1，每 5 bits 轉成一個 Base32 字元。
 *
 * ## 流程
 * 1. 初始化：lat ∈ [-90, 90]、lon ∈ [-180, 180]
 * 2. 偶數輪：切 lon 區間，lon > mid → 1，否則 0
 * 3. 奇數輪：切 lat 區間，lat > mid → 1，否則 0
 * 4. 累積 5 bits 後，用 BASE32 對照表輸出一個字元
 * 5. 重複直到 hash 長度達 precision
 *
 * ## Precision 對應精度（約）
 * - 5: ~4.9km × 4.9km
 * - 6: ~1.2km × 0.6km
 * - 7: ~150m × 150m（CCTV 用此）
 *
 * ## 用途
 * Firestore 存 geohash 後，可用 range query（geohash >= prefix AND <= prefix~）做 bbox 查詢。
 */

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function encodeGeohash(lat: number, lon: number, precision = 6): string {
  let idx = 0;
  let bit = 0;
  let even = true;
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;
  let hash = "";

  while (hash.length < precision) {
    if (even) {
      const mid = (lonMin + lonMax) / 2;
      if (lon > mid) {
        idx = (idx << 1) + 1;
        lonMin = mid;
      } else {
        idx <<= 1;
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat > mid) {
        idx = (idx << 1) + 1;
        latMin = mid;
      } else {
        idx <<= 1;
        latMax = mid;
      }
    }
    even = !even;
    bit++;
    if (bit === 5) {
      hash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }
  return hash;
}
