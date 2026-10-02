"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CWBWeatherResponse } from "@/app/api/weather/cwb/route";

type WeatherContextValue = {
  data: CWBWeatherResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const WeatherContext = createContext<WeatherContextValue | null>(null);

type WeatherProviderProps = {
  children: React.ReactNode;
  county: string | null;
  district?: string | null;
  /** 使用者位置；提供時即時雨量只採附近測站 */
  coords?: { lat: number; lon: number } | null;
};

export function WeatherProvider({ children, county, district, coords }: WeatherProviderProps) {
  const lat = coords?.lat;
  const lon = coords?.lon;
  const [data, setData] = useState<CWBWeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(() => {
    if (!county) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ county });
    if (district) params.set("district", district);
    if (lat != null && lon != null) {
      // 小數 2 位（約 1 km）已足以挑選 3 km 內的測站，不必送出精確位置
      params.set("lat", lat.toFixed(2));
      params.set("lon", lon.toFixed(2));
    }
    fetch(`/api/weather/cwb?${params}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setData(json);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [county, district, lat, lon]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      refetch: fetchWeather,
    }),
    [data, loading, error, fetchWeather]
  );

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error("useWeather 必須在 WeatherProvider 內使用");
  return ctx;
}
