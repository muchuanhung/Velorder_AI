"use client";

import { useMemo, useEffect, useState } from "react";
import type { RouteSegment } from "@/lib/routes/route-data";

type CWBWeatherCondition = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy";
type SegmentCondition = RouteSegment["condition"];

/** CWB condition → RouteSegment condition */
function mapCondition(c: CWBWeatherCondition): SegmentCondition {
  if (c === "sunny") return "clear";
  if (c === "snowy") return "cloudy";
  return c as SegmentCondition;
}

export interface SegmentWeather {
  rainProbability: number;
  windSpeed: number;
  temperature: number;
  condition: SegmentCondition;
}

type WeatherMap = Map<string, SegmentWeather>;

export function useSegmentsWeather(segments: RouteSegment[]): {
  weatherMap: WeatherMap;
  loading: boolean;
  error: string | null;
} {
  const [weatherMap, setWeatherMap] = useState<WeatherMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keyedSegments = useMemo(() => {
    const map = new Map<string, { county: string; district: string }>();
    for (const s of segments) {
      if (s.county && s.districtZh) {
        const key = `${s.county}|${s.districtZh}`;
        if (!map.has(key)) map.set(key, { county: s.county, district: s.districtZh });
      }
    }
    return Array.from(map.entries());
  }, [segments]);

  const depString = useMemo(
    () => keyedSegments.map(([k]) => k).join(","),
    [keyedSegments]
  );

  useEffect(() => {
    if (keyedSegments.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      const map = new Map<string, SegmentWeather>();
      const promises = keyedSegments.map(async ([key, { county, district }]) => {
        const params = new URLSearchParams({ county, district });
        const res = await fetch(`/api/weather/cwb?${params}`);
        const data = (await res.json()) as {
          error?: string;
          temperature: number;
          windSpeedKmh: number;
          condition: CWBWeatherCondition;
          rainfall12h?: Array<{ pop: number }>;
        };
        if (!res.ok || data.error) throw new Error(data.error ?? `CWB ${res.status}`);
        const pop = data.rainfall12h?.[0]?.pop ?? 0;
        return {
          key,
          weather: {
            rainProbability: pop,
            windSpeed: data.windSpeedKmh ?? 0,
            temperature: data.temperature ?? 0,
            condition: mapCondition(data.condition),
          },
        };
      });

      try {
        const results = await Promise.allSettled(promises);
        for (const r of results) {
          if (cancelled) return;
          if (r.status === "fulfilled") {
            map.set(r.value.key, r.value.weather);
          }
        }
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          setError(`${failed.length} 個行政區天氣取得失敗`);
        }
        setWeatherMap(new Map(map));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "天氣取得失敗");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [depString]);

  return { weatherMap, loading, error };
}
