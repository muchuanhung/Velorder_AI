"use client";

import { useState, useEffect } from "react";
import type { Route } from "@/lib/routes/route-data";
import type { CCTVFeed } from "@/lib/routes/route-data";

export function useRouteCCTV(route: Route | null): {
  feeds: CCTVFeed[];
  loading: boolean;
} {
  const [feeds, setFeeds] = useState<CCTVFeed[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!route?.bbox) {
      setFeeds([]);
      return;
    }
    const [minLon, minLat, maxLon, maxLat] = route.bbox;
    setLoading(true);
    fetch(
      `/api/cctv/near-route?minLon=${minLon}&minLat=${minLat}&maxLon=${maxLon}&maxLat=${maxLat}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) return data;
        if (data?.error) return [];
        return data.feeds ?? [];
      })
      .catch(() => [])
      .then((f: CCTVFeed[]) => setFeeds(f))
      .finally(() => setLoading(false));
  }, [route?.id, route?.bbox]);

  return { feeds, loading };
}
