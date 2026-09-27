"use client";

import { useEffect, useMemo, useState } from "react";
import type { Route } from "@/lib/routes/route-data";
import { buildRoutePolylineKm } from "@/lib/routes/recon-geo";
import { matchEventsToRoute, type RoadEvent, type RouteEvent } from "@/lib/routes/road-events";

export interface RouteEventsState {
  events: RouteEvent[];
  loading: boolean;
  /** 整體抓取失敗 */
  error: boolean;
  /** 部分縣市取不到；與「沿途沒有事件」區分 */
  failedCounties: string[];
}

/** 路線沿途的 TDX 即時路況事件 */
export function useRouteEvents(route: Route | null): RouteEventsState {
  const [raw, setRaw] = useState<RoadEvent[]>([]);
  const [failedCounties, setFailedCounties] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const counties = useMemo(
    () => [...new Set((route?.segments ?? []).map((s) => s.county).filter((c): c is string => !!c))].sort().join(","),
    [route?.segments]
  );

  useEffect(() => {
    // 換路線時先清空，避免載入期間顯示上一條路線的事件
    setRaw([]);
    setFailedCounties([]);
    setError(false);
    if (!counties) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/road-events?counties=${encodeURIComponent(counties)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`路況事件 ${res.status}`);
        return res.json() as Promise<{ events: RoadEvent[]; failed: string[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setRaw(data.events ?? []);
        setFailedCounties(data.failed ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [counties]);

  const polyline = useMemo(() => (route ? buildRoutePolylineKm(route) : null), [route]);
  const events = useMemo(() => matchEventsToRoute(raw, polyline), [raw, polyline]);

  return { events, loading, error, failedCounties };
}
