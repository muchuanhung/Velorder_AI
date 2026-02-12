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
};

export function WeatherProvider({ children, county, district }: WeatherProviderProps) {
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
    fetch(`/api/weather/cwb?${params}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        console.log("[Weather]", json);
        setData(json);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [county, district]);

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
