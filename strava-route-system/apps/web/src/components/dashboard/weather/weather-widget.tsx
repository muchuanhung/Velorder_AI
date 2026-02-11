"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, RefreshCw, ChevronUp, CloudRain, Navigation, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { WeatherHero } from "./weather-hero";
import { RainfallChart } from "./rainfall-chart";
import { MetricsGrid } from "./metrics-grid";
import { useLocation } from "@/contexts/LocationContext";

type WeatherDetailsProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
  locationName: string | null;
  locationStatus: "idle" | "requesting" | "granted" | "denied" | "error";
  onRequestLocation: () => void;
};

function WeatherDetails({ onRefresh, isRefreshing, locationName, locationStatus, onRequestLocation }: WeatherDetailsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="sr-only">Refresh weather</span>
        </Button>
      </div>

      {/* Hero section */}
      <WeatherHero
        temperature={14}
        condition="cloudy"
        feelsLike={11}
        verdict="Perfect for a 5km run"
        verdictType="good"
      />

      <Separator className="bg-border/50" />

      {/* Rainfall chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CloudRain className="h-3.5 w-3.5 text-[#60a5fa]" />
            <span className="text-xs font-medium text-muted-foreground">
              Precipitation (next 12h)
            </span>
          </div>
          <span className="text-xs text-muted-foreground">45% peak</span>
        </div>
        <RainfallChart />
      </div>

      <Separator className="bg-border/50" />

      {/* Metrics grid */}
      <MetricsGrid />
    </div>
  );
}

/** Desktop: expanded glassmorphism card */
function DesktopCard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { location, status, requestLocation } = useLocation();

  function handleRefresh() {
    setIsRefreshing(true);
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

  function handleRefresh() {
    setIsRefreshing(true);
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
                <CloudRain className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">
                  14{"°C"}
                </span>
                <Separator orientation="vertical" className="h-5 bg-border/50" />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CloudRain className="h-3.5 w-3.5 text-[#60a5fa]" />
                  <span>28%</span>
                </div>
                <Separator orientation="vertical" className="h-5 bg-border/50" />
                <span className="text-sm text-strava font-medium">Good to run</span>
              </div>
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </DrawerTrigger>

        <DrawerContent className="bg-card/95 backdrop-blur-xl border-border">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-foreground">
              Weather & Conditions
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
  }, []);
  return null;
}

export function WeatherWidget() {
  return (
    <>
      <LocationAutoRequest />
      <DesktopCard />
      <MobileBar />
    </>
  );
}