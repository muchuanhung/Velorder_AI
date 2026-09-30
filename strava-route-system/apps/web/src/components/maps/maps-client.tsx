"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useLocation } from "@/contexts/LocationContext";
import {
  getCurrentLocationFromInfo,
  getTaiwanTownships,
  getViewBoxForFocus,
  type District,
} from "@/lib/maps/map-data";
import { MapCanvas } from "./map-canvas";
import { ControlPanel, FocusedWeather, MobileControlBar, RainLegend } from "./control-panel";

const ZOOM_MIN = 100;
const ZOOM_MAX = 300;
const ZOOM_STEP = 15;
const ZOOM_DEFAULT = 250;

/** 降雨地圖：各鄉鎮未來 12 小時降雨機率（中央氣象署），可定位與縮放 */
export function MapsClient() {
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [countyRainfall, setCountyRainfall] = useState<Record<string, number> | null>(null);
  const [rainError, setRainError] = useState(false);

  const { location, status, requestLocation } = useLocation();
  const locateToastIdRef = useRef<string | number | null>(null);
  const locating = status === "requesting";

  // 手動定位完成後關閉提示
  useEffect(() => {
    if (!locating && locateToastIdRef.current != null) {
      toast.dismiss(locateToastIdRef.current);
      locateToastIdRef.current = null;
    }
  }, [locating]);

  const handleLocate = () => {
    setZoom(ZOOM_DEFAULT);
    setSelectedDistrict(null);
    locateToastIdRef.current = toast.loading("正在取得位置…");
    requestLocation();
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather/cwb/all-counties")
      .then((res) => {
        if (!res.ok) throw new Error(`降雨資料 ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data === "object" && !("error" in data)) setCountyRainfall(data as Record<string, number>);
        else setRainError(true);
      })
      .catch(() => {
        if (!cancelled) setRainError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 進入地圖頁時取得最新位置（使用者曾拒絕則略過）
  useEffect(() => {
    try {
      if (window.localStorage.getItem("location_denied")) return;
      requestLocation();
    } catch {
      // localStorage 不可用時略過
    }
  }, [requestLocation]);

  const currentLocation = useMemo(() => getCurrentLocationFromInfo(location), [location]);
  const districts = useMemo(() => {
    const lngLat =
      location?.longitude != null && location?.latitude != null
        ? ([location.longitude, location.latitude] as [number, number])
        : undefined;
    return getTaiwanTownships(currentLocation, lngLat, countyRainfall ?? undefined);
  }, [currentLocation, location?.longitude, location?.latitude, countyRainfall]);

  const focusedDistrict = selectedDistrict ?? districts.find((d) => d.isCurrentDistrict) ?? districts[0];
  const viewBox = focusedDistrict ? getViewBoxForFocus(focusedDistrict.center, zoom) : "0 0 100 90";

  return (
    <div className="relative size-full">
      <h1 className="sr-only">降雨地圖</h1>
      <MapCanvas
        districts={districts}
        onDistrictSelect={setSelectedDistrict}
        selectedDistrict={selectedDistrict}
        viewBox={viewBox}
      />

      {rainError && (
        <p
          role="status"
          className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm"
        >
          降雨資料暫時取不到，地圖以灰色顯示
        </p>
      )}

      <ControlPanel focusedDistrict={focusedDistrict} />

      {/* 桌機：縮放與定位 */}
      <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <MapButton label="放大" onClick={() => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX))}>
            <Plus className="size-4" aria-hidden />
          </MapButton>
          <p className="border-y border-border py-1 text-center font-mono text-xs text-muted-foreground">{zoom}%</p>
          <MapButton label="縮小" onClick={() => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN))}>
            <Minus className="size-4" aria-hidden />
          </MapButton>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <MapButton label="定位到目前位置" onClick={handleLocate} disabled={locating}>
            {locating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LocateFixed className="size-4" aria-hidden />}
          </MapButton>
        </div>
      </div>

      {/* 手機：底部精簡列＋抽屜 */}
      <MobileControlBar
        focusedDistrict={focusedDistrict}
        onExpand={() => setDrawerOpen(true)}
        onLocate={handleLocate}
        locating={locating}
      />
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[70vh] border-border bg-card">
          <DrawerHeader className="sr-only">
            <DrawerTitle>鄉鎮天氣</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto px-4 pb-6 pt-2">
            {focusedDistrict && <FocusedWeather district={focusedDistrict} />}
            <div className="border-t border-border pt-4">
              <RainLegend />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function MapButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-10 place-items-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
    >
      {children}
    </button>
  );
}
