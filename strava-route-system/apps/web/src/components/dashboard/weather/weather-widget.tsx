"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronUp, CloudRain, Navigation, Locate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { WeatherHero, getConditionIcon } from "./weather-hero";
import { RainfallChart } from "./rainfall-chart";
import { MetricsGrid } from "./metrics-grid";
import { SYNC_STATUS_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";
import { useLocation } from "@/contexts/LocationContext";
import { useWeather } from "@/contexts/WeatherContext";
import { WeatherProvider } from "@/contexts/WeatherContext";
import type { RainfallDataPoint } from "./rainfall-chart";

type WeatherDetailsProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
  locationName: string | null;
  locationStatus: "idle" | "requesting" | "granted" | "denied" | "error";
  onRequestLocation: () => void;
};

function WeatherDetails({ onRefresh, isRefreshing, locationName, locationStatus, onRequestLocation }: WeatherDetailsProps) {
  const [mounted, setMounted] = useState(false);
  const { data, loading, error } = useWeather();
  useEffect(() => setMounted(true), []);

  const rainfallData: RainfallDataPoint[] = data?.rainfall12h?.length
    ? data.rainfall12h.map((r, i) => ({
        hour: i === 0 ? "Now" : `${i}h`,
        precipitation: r.pop,
        label: r.label,
      }))
    : [];

  const peakPop = rainfallData.length ? Math.max(...rainfallData.map((d) => d.precipitation)) : 0;

  const weatherStatus = isRefreshing || loading ? "running" : error && !data ? "error" : data ? "completed" : "idle";
  const config = SYNC_STATUS_CONFIG[weatherStatus];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-strava" />
          {!mounted && (
            <span className="text-sm text-muted-foreground">---</span>
          )}
          {mounted && locationStatus === "requesting" && (
            <span className="text-sm text-muted-foreground">取得位置中...</span>
          )}
          {mounted && locationStatus === "granted" && locationName && (
            <>
              <span className="text-sm font-medium text-foreground">{locationName}</span>
              <Badge
                variant="outline"
                className="border-border text-muted-foreground text-xs px-1.5 py-0"
              >
                <Navigation className="h-3 w-3 mr-1" />
                GPS
              </Badge>
            </>
          )}
          {mounted && (locationStatus === "idle" || locationStatus === "denied" || locationStatus === "error") && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-7 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              onClick={onRequestLocation}
            >
              <Locate className="h-3.5 w-3.5" />
              {locationStatus === "idle" ? "啟用位置" : "重試"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || loading}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary transition-colors hover:text-foreground disabled:opacity-50",
            config.color
          )}
          title="重新整理天氣"
        >
          {config.icon}
          <span className="sr-only">Refresh weather</span>
        </button>
      </div>

      {/* Hero section */}
      {loading && !data && (
        <div className="text-sm text-muted-foreground py-4">載入天氣中...</div>
      )}
      {error && !data && (
        <div className="text-sm text-destructive py-4">{error}</div>
      )}
      {data && (
        <>
          <WeatherHero
            temperature={data.temperature}
            condition={data.condition}
            feelsLike={data.feelsLike}
            verdict={data.verdict}
            verdictType={data.verdictType}
          />

          <Separator className="bg-border/50" />

          {/* Rainfall chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CloudRain className="h-3.5 w-3.5 text-[#60a5fa]" />
                <span className="text-xs font-medium text-muted-foreground">
                  未來12小時降雨機率
                </span>
              </div>
              {peakPop > 0 && (
                <span className="text-xs text-muted-foreground">{peakPop}% 最高</span>
              )}
            </div>
            <RainfallChart data={rainfallData} />
          </div>

          <Separator className="bg-border/50" />

          {/* Metrics grid */}
          <MetricsGrid
            windKmh={data.windSpeedKmh}
            humidity={data.humidity}
            uvIndex={data.uvIndex}
            uvLevel={data.uvLevel}
            sunset={data.sunset}
          />
        </>
      )}
      {!loading && !data && !error && (
        <div className="text-sm text-muted-foreground py-4">
          啟用位置後顯示天氣預報
        </div>
      )}
    </div>
  );
}

/** Desktop: expanded glassmorphism card */
function DesktopCard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { location, status, requestLocation } = useLocation();
  const { refetch } = useWeather();

  function handleRefresh() {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="hidden lg:block"
    >
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 shadow-2xl shadow-background/50">
        <WeatherDetails
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          locationName={location?.displayName ?? null}
          locationStatus={status}
          onRequestLocation={requestLocation}
        />
      </div>
    </motion.div>
  );
}

/** Mobile: collapsed sticky bar + drawer bottom sheet */
function MobileBar() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { location, status, requestLocation } = useLocation();
  const { data, refetch } = useWeather();

  function handleRefresh() {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 1500);
  }

  return (
    <div className="lg:hidden">
      <Drawer>
        <DrawerTrigger asChild>
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            type="button"
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl px-4 py-3 shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/40 text-muted-foreground">
                {data?.condition ? getConditionIcon(data.condition, "h-5 w-5") : <CloudRain className="h-5 w-5" />}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">
                  {data?.temperature ?? "—"}
                  {"°C"}
                </span>
                <Separator orientation="vertical" className="h-5 bg-border/50" />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CloudRain className="h-3.5 w-3.5 text-[#60a5fa]" />
                  <span>
                    {data
                      ? Math.max(0, ...(data.rainfall12h?.map((r) => r.pop) ?? [0]))
                      : 0}
                    %
                  </span>
                </div>
                <Separator orientation="vertical" className="h-5 bg-border/50" />
                <span className="text-sm text-strava font-medium">
                  {data?.verdict ?? "—"}
                </span>
              </div>
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </DrawerTrigger>

        <DrawerContent className="bg-card/95 backdrop-blur-xl border-border">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-foreground">
              天氣預報
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <WeatherDetails
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              locationName={location?.displayName ?? null}
              locationStatus={status}
              onRequestLocation={requestLocation}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

const LOCATION_DENIED_KEY = "location_denied";

function LocationAutoRequest() {
  const { requestLocation } = useLocation();
  useEffect(() => {
    try {
      if (window.localStorage.getItem(LOCATION_DENIED_KEY)) return;
    } catch { /* ignore */ }
    requestLocation();
  }, [requestLocation]);
  return null;
}

export function WeatherWidget() {
  const [mounted, setMounted] = useState(false);
  const { location } = useLocation();
  const county = location?.county ?? location?.admin1 ?? null;
  const district = location?.district ?? location?.city ?? null;

  useEffect(() => setMounted(true), []);

  return (
    <>
      <LocationAutoRequest />
      <WeatherProvider county={county} district={district}>
        {mounted ? (
          <>
            <DesktopCard />
            <MobileBar />
          </>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card/60 p-4 animate-pulse">
            <div className="h-12 bg-background/40 rounded" />
          </div>
        )}
      </WeatherProvider>
    </>
  );
}