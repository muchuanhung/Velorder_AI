import { test, expect } from "@playwright/test";
import { getSegmentsFromPoints, SEGMENT_SAMPLE_INTERVAL_KM } from "@/lib/routes/geocode-districts";

/** 往北的直線，每 stepKm 一個點 */
function northLine(totalKm: number, stepKm: number, startLat = 25.0, lon = 121.55) {
  const n = Math.round(totalKm / stepKm);
  return Array.from({ length: n + 1 }, (_, i) => ({ lat: startLat + (i * stepKm) / 111.195, lon }));
}

/** 假行政區：依緯度切三區，北緯 25.03 以南 A、25.06 以南 B、其餘 C */
const bandLookup = (_lon: number, lat: number) => ({
  county: "測試市",
  town: lat < 25.03 ? "A區" : lat < 25.06 ? "B區" : "C區",
});

test.describe("getSegmentsFromPoints（取樣與合併）", () => {
  test("每 0.5 km 取樣（含終點），連續同區合併，sampleKms 遞增", () => {
    const segs = getSegmentsFromPoints(northLine(10.2, 0.1), bandLookup);
    expect(segs.map((s) => s.districtZh)).toEqual(["A區", "B區", "C區"]);
    const all = segs.flatMap((s) => s.sampleKms!);
    expect(all).toHaveLength(Math.floor(10.2 / SEGMENT_SAMPLE_INTERVAL_KM) + 2);
    expect(all[0]).toBe(0);
    expect(all[all.length - 1]).toBeCloseTo(10.2, 3);
    expect([...all].sort((a, b) => a - b)).toEqual(all);
  });

  test("GPX 點很稀疏時沿線段內插取樣，不會漏掉中間經過的行政區", () => {
    // 只有起終點兩個點，中間經過 B 區
    const segs = getSegmentsFromPoints(northLine(10, 10), bandLookup);
    expect(segs.map((s) => s.districtZh)).toEqual(["A區", "B區", "C區"]);
  });

  test("環狀路線回到起始行政區時另成一段", () => {
    const out = northLine(5, 0.1);
    const back = [...out].reverse().slice(1);
    const segs = getSegmentsFromPoints([...out, ...back], bandLookup);
    expect(segs.map((s) => s.districtZh)).toEqual(["A區", "B區", "A區"]);
  });

  test("查不到行政區的取樣點略過；少於兩點回傳空陣列", () => {
    const segs = getSegmentsFromPoints(northLine(10, 0.1), (lon, lat) => (lat < 25.045 ? null : bandLookup(lon, lat)));
    expect(segs.map((s) => s.districtZh)).toEqual(["B區", "C區"]);
    expect(getSegmentsFromPoints([{ lat: 25, lon: 121.5 }])).toEqual([]);
  });
});

test.describe("getSegmentsFromPoints（實際 TopoJSON）", () => {
  test("士林區內往北的短程路線落在台北市士林區", () => {
    const segs = getSegmentsFromPoints(northLine(1, 0.1, 25.09, 121.53));
    expect(segs[0]).toMatchObject({ county: "台北市", districtZh: "士林區" });
  });

  test("沿經線從大安區往北到士林區，依序經過多個行政區且不重複相鄰", () => {
    const segs = getSegmentsFromPoints(northLine(9, 0.2, 25.025, 121.54));
    const names = segs.map((s) => s.districtZh);
    expect(names[0]).toBe("大安區");
    expect(names[names.length - 1]).toBe("士林區");
    expect(names.length).toBeGreaterThanOrEqual(3);
    names.slice(1).forEach((n, i) => expect(n).not.toBe(names[i]));
  });
});
