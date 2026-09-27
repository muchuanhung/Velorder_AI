import { test, expect } from "@playwright/test";
import { buildRoutePolylineKm } from "@/lib/routes/recon-geo";
import {
  categoryOf,
  eventHazards,
  groupRouteEvents,
  isActive,
  matchEventsToRoute,
  parseTdxEvent,
  type RoadEvent,
} from "@/lib/routes/road-events";
import { makeRoute } from "../fixtures/route";

const NOW = new Date("2026-09-27T12:00:00+08:00");
// 測試路線往北直走 20 km：lat = 25.05 + km / 111
const latAtKm = (km: number) => 25.05 + km / 111;
const lonOffsetKm = (km: number) => km / (111.32 * Math.cos((25.1 * Math.PI) / 180));

function event(overrides: Partial<RoadEvent> = {}): RoadEvent {
  return {
    id: "e1",
    type: 1,
    subType: 101,
    title: "交通事故",
    description: "",
    lat: latAtKm(5),
    lon: 121.55,
    source: "測試",
    effectiveTime: null,
    expireTime: null,
    updatedTime: null,
    ...overrides,
  };
}

test.describe("parseTdxEvent", () => {
  test("POINT 為「經度 緯度」順序", () => {
    const e = parseTdxEvent({ EventID: "x", EventType: 2, EventSubType: 298, Positions: "POINT(121.464083 25.123769)" });
    expect(e).toMatchObject({ lon: 121.464083, lat: 25.123769, type: 2, subType: 298 });
  });

  test("沒有座標或 ID 的事件略過", () => {
    expect(parseTdxEvent({ EventID: "x", Positions: "" })).toBeNull();
    expect(parseTdxEvent({ Positions: "POINT(121 25)" })).toBeNull();
  });
});

test.describe("isActive", () => {
  test("已到期或尚未生效的事件不算", () => {
    expect(isActive(event({ expireTime: "2026-09-27T11:00:00+08:00" }), NOW)).toBe(false);
    expect(isActive(event({ effectiveTime: "2026-09-28T00:00:00+08:00" }), NOW)).toBe(false);
    expect(isActive(event({ effectiveTime: "2026-09-27T00:00:00+08:00" }), NOW)).toBe(true);
  });
});

test.describe("categoryOf", () => {
  test("依 EventType 分類", () => {
    expect([1, 2, 3, 4, 5, 7, 8, 9].map(categoryOf)).toEqual([
      "accident",
      "construction",
      "congestion",
      "control",
      "disaster",
      "activity",
      "obstacle",
      "other",
    ]);
  });
});

test.describe("matchEventsToRoute", () => {
  const polyline = buildRoutePolylineKm(makeRoute());

  test("路線 150 m 內的事件對應到里程；300 m 外不算", () => {
    const near = event({ id: "near", lon: 121.55 + lonOffsetKm(0.1) });
    const far = event({ id: "far", lon: 121.55 + lonOffsetKm(0.3) });
    const matched = matchEventsToRoute([near, far], polyline, { now: NOW });
    expect(matched.map((e) => e.id)).toEqual(["near"]);
    expect(matched[0]!.km).toBeCloseTo(5, 1);
  });

  test("已到期的事件不對應", () => {
    expect(matchEventsToRoute([event({ expireTime: "2026-09-27T11:00:00+08:00" })], polyline, { now: NOW })).toHaveLength(0);
  });

  test("分級：事故影響判定；施工只列出；例行道路維護收合", () => {
    const matched = matchEventsToRoute(
      [
        event({ id: "acc", type: 1, subType: 101 }),
        event({ id: "work", type: 2, subType: 205, lat: latAtKm(8) }),
        event({ id: "routine", type: 2, subType: 298, lat: latAtKm(12) }),
      ],
      polyline,
      { now: NOW }
    );
    expect(matched.find((e) => e.id === "acc")!.affectsVerdict).toBe(true);
    const { notices, routine } = groupRouteEvents(matched);
    expect(notices.map((e) => e.id)).toEqual(["work"]);
    expect(routine.map((e) => e.id)).toEqual(["routine"]);
  });
});

test.describe("eventHazards", () => {
  test("只有影響判定的事件變成示警，且一律為注意", () => {
    const polyline = buildRoutePolylineKm(makeRoute());
    const matched = matchEventsToRoute(
      [event({ id: "acc" }), event({ id: "work", type: 2, subType: 205, lat: latAtKm(8) })],
      polyline,
      { now: NOW }
    );
    const hazards = eventHazards(matched);
    expect(hazards).toHaveLength(1);
    expect(hazards[0]).toMatchObject({ kind: "event", level: "caution", label: "事故：交通事故" });
  });

  test("災害（淹水等）判為危險", () => {
    const polyline = buildRoutePolylineKm(makeRoute());
    const matched = matchEventsToRoute([event({ id: "flood", type: 5, subType: 509, title: "淹水" })], polyline, {
      now: NOW,
    });
    expect(eventHazards(matched)[0]).toMatchObject({ level: "risky", label: "災害：淹水" });
  });
});
