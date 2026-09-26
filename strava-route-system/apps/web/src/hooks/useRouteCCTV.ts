"use client";

import { useState, useEffect } from "react";
import type { Route } from "@/lib/routes/route-data";
import type { CCTVFeed } from "@/lib/routes/route-data";

export function useRouteCCTV(route: Route | null): {
  feeds: CCTVFeed[];
  loading: boolean;
  /** 抓取失敗；與「沿途真的沒有鏡頭」（feeds 為空、error 為 false）區分 */
  error: boolean;
} {
  const [feeds, setFeeds] = useState<CCTVFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    if (!route?.bbox) {
      setFeeds([]);
      return;
    }
    const [minLon, minLat, maxLon, maxLat] = route.bbox;
    setLoading(true);
    fetch(
      `/api/cctv/near-route?minLon=${minLon}&minLat=${minLat}&maxLon=${maxLon}&maxLat=${maxLat}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`CCTV ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) return data;
        if (data?.error) throw new Error(data.error);
        return data.feeds ?? [];
      })
      .then((f: CCTVFeed[]) => setFeeds(f))
      .catch(() => {
        setFeeds([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [route?.id, route?.bbox]);

  return { feeds, loading, error };
}
