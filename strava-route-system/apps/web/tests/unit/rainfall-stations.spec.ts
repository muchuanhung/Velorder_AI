import { test, expect } from "@playwright/test";
import { parseRainfallStations, summarizeRainfall } from "@/lib/cwb/rainfall-stations";

/** 現行 O-A0002 格式的單一測站 */
function station(county: string, lat: number, lon: number, past1hr: number | string) {
  return {
    StationName: "測站",
    StationId: "C0X000",
    GeoInfo: {
      CountyName: county,
      Coordinates: [
        { CoordinateName: "TWD67", StationLatitude: lat - 0.002, StationLongitude: lon - 0.008 },
        { CoordinateName: "WGS84", StationLatitude: lat, StationLongitude: lon },
      ],
    },
    RainfallElement: { Now: { Precipitation: 0 }, Past1hr: { Precipitation: past1hr } },
  };
}

// 士林（路線旁）小雨、木柵（約 13 km 外）大雨、新北市站不屬於臺北市
const RAW = {
  records: {
    Station: [
      station("臺北市", 25.09, 121.52, 0.5),
      station("臺北市", 24.99, 121.57, 12),
      station("新北市", 25.09, 121.52, 30),
      station("臺北市", 25.1, 121.53, -998),
    ],
  },
};
const ROUTE_POINTS = [{ lat: 25.1, lon: 121.52 }];

test.describe("parseRainfallStations", () => {
  test("讀 GeoInfo.CountyName、WGS84 座標、Past1hr；台／臺皆可；負值缺值排除", () => {
    const stations = parseRainfallStations(RAW, "台北市");
    expect(stations).toEqual([
      { mmPerHr: 0.5, lat: 25.09, lon: 121.52 },
      { mmPerHr: 12, lat: 24.99, lon: 121.57 },
    ]);
  });

  test("相容舊版平面欄位；T 為雨跡記 0、X 為故障排除", () => {
    const legacy = {
      records: {
        Station: [
          { CountyName: "臺北市", StationLatitude: "25.0", StationLongitude: "121.5", Rain: "T" },
          { CountyName: "臺北市", Rain: "X" },
        ],
      },
    };
    expect(parseRainfallStations(legacy, "臺北市")).toEqual([{ mmPerHr: 0, lat: 25, lon: 121.5 }]);
  });
});

test.describe("summarizeRainfall", () => {
  const stations = parseRainfallStations(RAW, "臺北市");

  test("有路線座標時只取 3 km 內的測站，不被縣市另一端的大雨影響", () => {
    expect(summarizeRainfall(stations, ROUTE_POINTS)).toEqual({ mmPerHr: 0.5, scope: "nearby", stationCount: 1 });
  });

  test("附近沒有測站時退回縣市最大值，scope 明確標為 county", () => {
    expect(summarizeRainfall(stations, [{ lat: 25.3, lon: 121.9 }])).toEqual({
      mmPerHr: 12,
      scope: "county",
      stationCount: 2,
    });
  });

  test("沒有座標時為縣市最大值；沒有測站時為 none", () => {
    expect(summarizeRainfall(stations).scope).toBe("county");
    expect(summarizeRainfall([], ROUTE_POINTS)).toEqual({ mmPerHr: null, scope: "none", stationCount: 0 });
  });
});
