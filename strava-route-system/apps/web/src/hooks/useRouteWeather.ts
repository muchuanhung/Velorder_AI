"use client";

import { useMemo } from "react";
import type { Route, RouteSegment, RainfallPeriod } from "@/lib/routes/route-data";
import { computeRouteStatus, computeBestTimeToRide } from "@/lib/routes/route-data";
import { useSegmentsWeather } from "@/hooks/useSegmentsWeather";
import { pickRainfallBucketForSegment } from "@/lib/cwb/forecast-eta";

const EMPTY_SEGMENTS: RouteSegment[] = [];

/** loading：抓取中；ready：全部路段有天氣；partial：部分路段失敗；unavailable：完全沒有天氣 */
export type RouteWeatherState = "loading" | "ready" | "partial" | "unavailable";

type WeatheredSegment = RouteSegment & { rainfall12h?: RainfallPeriod[] };

export interface RouteWeather {
  segments: WeatheredSegment[];
  state: RouteWeatherState;
  /** 沒有天氣資料時為 null；不可退回 route.status（GPX 解析時寫死為 safe） */
  status: Route["status"] | null;
  verdictMessage: string;
  bestTimeToRide: string;
  error: string | null;
}

/** 取得路線各行政區 CWB 天氣，合併進 segments 並計算整體狀態 */
export function useRouteWeather(route: Route | null): RouteWeather {
  const segments = route?.segments ?? EMPTY_SEGMENTS;
  const { weatherMap, loading, error } = useSegmentsWeather(segments);

  const enrichedSegments = useMemo<WeatheredSegment[]>(() => {
    // 與 Dashboard 判讀一致：現在出發，各路段降雨機率取其騎經時間所在的預報時段
    const departure = new Date();
    return segments.map((seg) => {
      const key = seg.county && seg.districtZh ? `${seg.county}|${seg.districtZh}` : null;
      const w = key ? weatherMap.get(key) : undefined;
      if (!w) return { ...seg, hasWeather: false };
      const bucket = pickRainfallBucketForSegment(seg.sampleKms, departure, w.rainfall12h ?? []);
      return { ...seg, ...w, rainProbability: bucket?.pop ?? w.rainProbability, hasWeather: true };
    });
  }, [segments, weatherMap]);

  return useMemo(() => {
    const withWeather = enrichedSegments.filter((s) => s.hasWeather);
    const state: RouteWeatherState = loading
      ? "loading"
      : withWeather.length === 0
        ? "unavailable"
        : withWeather.length < enrichedSegments.length
          ? "partial"
          : "ready";

    if (state === "loading" || state === "unavailable") {
      return { segments: enrichedSegments, state, status: null, verdictMessage: "", bestTimeToRide: "", error };
    }
    const { status, verdictMessage } = computeRouteStatus(withWeather);
    return {
      segments: enrichedSegments,
      state,
      status,
      verdictMessage: state === "partial" ? `${verdictMessage}（部分路段無天氣資料）` : verdictMessage,
      bestTimeToRide: computeBestTimeToRide(withWeather),
      error,
    };
  }, [enrichedSegments, loading, error]);
}
