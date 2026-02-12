"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  LocateFixed,
  Loader2,
  ZoomIn,
  ZoomOut,
  Layers,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useLocation } from "@/contexts/LocationContext";
import { MapCanvas } from "@/components/maps/map-canvas";
import { ControlPanel, MobileControlBar } from "@/components/maps/control-panel";
import { IncidentMarkers } from "@/components/maps/incident-markers";
import {
  getTaiwanTownships,
  getCurrentLocationFromInfo,
  tdxIncidents,
  currentWeather,
  getRainColor,
  type District,
} from "@/lib/maps/map-data";

export default function MapsPage() {
  const [activeLayer, setActiveLayer] = useState<"rainfall" | "traffic">("rainfall");
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [showIncidents, setShowIncidents] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const { location, status, requestLocation } = useLocation();
  const locateToastIdRef = useRef<string | number | null>(null);

  // 手動點擊定位完成後關閉
  useEffect(() => {
    if (status !== "requesting" && locateToastIdRef.current != null) {
      toast.dismiss(locateToastIdRef.current);
      locateToastIdRef.current = null;
    }
  }, [status]);

  const handleLocate = () => {
    setZoom(100);
    setSelectedDistrict(null);
    locateToastIdRef.current = toast.loading("正在取得位置…");
    requestLocation();
  };

  const currentLocation = useMemo(
    () => getCurrentLocationFromInfo(location),
    [location]
  );

  const districts = useMemo(() => {
    const lngLat =
      location?.longitude != null && location?.latitude != null
        ? ([location.longitude, location.latitude] as [number, number])
        : undefined;
    return getTaiwanTownships(currentLocation, lngLat);
  }, [currentLocation, location?.longitude, location?.latitude]);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // 進入地圖頁時發送定位請求，取得最新位置（若使用者曾拒絕則略過）
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem("location_denied"))
        return;
      requestLocation();
    } catch { /* ignore */ }
  }, [requestLocation]);

  const accidentCount = tdxIncidents.filter((i) => i.type === "accident").length;
  const constructionCount = tdxIncidents.filter((i) => i.type === "construction").length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#070b14] relative">
      {/* Loading / flyTo transition overlay */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 z-[100] bg-[#070b14] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-strava/10 ring-1 ring-strava/20">
                <Activity className="h-6 w-6 text-strava" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Loading...
              </p>
              <div className="w-32 h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full bg-strava rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map canvas */}
      <motion.div
        initial={{ scale: 1.15, opacity: 0 }}
        animate={loaded ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        <MapCanvas
          districts={districts}
          activeLayer={activeLayer}
          onDistrictSelect={setSelectedDistrict}
          selectedDistrict={selectedDistrict}
        />
      </motion.div>

      {/* Incident markers overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="absolute inset-0"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        <IncidentMarkers visible={showIncidents} zoom={zoom} />
      </motion.div>

      {/* Top navigation bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={loaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="absolute top-0 left-0 right-0 z-20"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Return to dashboard */}
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#0c1220]/80 backdrop-blur-xl border-border/30 text-foreground hover:bg-[#0c1220] hover:text-strava gap-2 shadow-lg shadow-black/30"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>

          {/* Center: Page title */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-strava/10 ring-1 ring-strava/20">
              <Activity className="h-4 w-4 text-strava" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-foreground">
                StravaSync Maps
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Taiwan | 氣象、交通事故資訊地圖
              </p>
            </div>
          </div>

          {/* Right: Status badges */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-border/30 bg-[#0c1220]/80 backdrop-blur-xl text-muted-foreground text-[10px] shadow-lg shadow-black/20 hidden sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
              {accidentCount} 交通事故
            </Badge>
            <Badge
              variant="outline"
              className="border-border/30 bg-[#0c1220]/80 backdrop-blur-xl text-muted-foreground text-[10px] shadow-lg shadow-black/20 hidden sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-warning mr-1.5" />
              {constructionCount} 施工中
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Desktop: Control panel */}
      {loaded && (
        <ControlPanel
          districts={districts}
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          selectedDistrict={selectedDistrict}
          showIncidents={showIncidents}
          onToggleIncidents={setShowIncidents}
        />
      )}

      {/* Desktop: Zoom controls */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={loaded ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-1.5 pointer-events-auto"
      >
        <div className="rounded-lg border border-border/30 bg-[#0c1220]/80 backdrop-blur-xl shadow-lg shadow-black/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 15, 160))}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <Separator className="bg-border/20" />
          <div className="flex h-7 items-center justify-center">
            <span className="text-[9px] font-mono text-muted-foreground/60 tabular-nums">
              {zoom}%
            </span>
          </div>
          <Separator className="bg-border/20" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 15, 60))}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-lg border border-border/30 bg-[#0c1220]/80 backdrop-blur-xl shadow-lg shadow-black/30 overflow-hidden">
          <button
            type="button"
            onClick={handleLocate}
            disabled={status === "requesting"}
            className="relative flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-strava hover:bg-secondary/30 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="定位並更新地圖"
          >
            {status === "requesting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Mobile: Bottom control bar */}
      {loaded && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <MobileControlBar
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            showIncidents={showIncidents}
            onToggleIncidents={setShowIncidents}
            onExpand={() => setDrawerOpen(true)}
            onLocate={handleLocate}
            locating={status === "requesting"}
          />
          <DrawerContent className="bg-[#0c1220]/95 backdrop-blur-2xl border-border/30 max-h-[70vh]">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-strava" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Map Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Separator className="bg-border/20" />

              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-4">
                  {/* Weather summary */}
                  <div className="rounded-lg bg-secondary/20 ring-1 ring-border/20 p-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Current Weather
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {currentWeather.temperature}&deg;
                        </p>
                        <p className="text-[10px] text-muted-foreground">Temp</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[#4169E1]">
                          {currentWeather.rainProbability}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Rain</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {currentWeather.windSpeed}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          km/h Wind
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active incidents list */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Active Incidents ({tdxIncidents.length})
                    </p>
                    <div className="space-y-2">
                      {tdxIncidents.slice(0, 4).map((incident) => (
                        <div
                          key={incident.id}
                          className="flex items-start gap-2.5 rounded-lg bg-secondary/20 ring-1 ring-border/10 px-3 py-2"
                        >
                          <div
                            className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                              incident.type === "accident"
                                ? "bg-red-500"
                                : "bg-[#fbbf24]"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {incident.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {incident.location}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rain legend */}
                  {activeLayer === "rainfall" && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                        Rain Probability
                      </p>
                      <div className="h-2.5 rounded-full bg-gradient-to-r from-[#87CEEB] via-[#4169E1] to-[#0A1E5C] ring-1 ring-border/20" />
                      <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Selected district detail bar (bottom-right on desktop) */}
      <AnimatePresence>
        {selectedDistrict && loaded && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-4 right-4 z-10 hidden lg:block"
          >
            <div className="rounded-xl border border-border/30 bg-[#0c1220]/85 backdrop-blur-2xl shadow-2xl shadow-black/40 px-4 py-3 w-64">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full ring-1 ring-background/30"
                    style={{
                      backgroundColor: selectedDistrict.isCurrentDistrict
                        ? "#FC4C02"
                        : getRainColor(selectedDistrict.rainProbability),
                    }}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {selectedDistrict.nameZh}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDistrict(null)}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {selectedDistrict.name}
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-md bg-secondary/30 px-2 py-1.5">
                  <p className="text-base font-bold text-foreground tabular-nums">
                    {selectedDistrict.rainProbability}%
                  </p>
                  <p className="text-[9px] text-muted-foreground">Rain</p>
                </div>
                <div className="rounded-md bg-secondary/30 px-2 py-1.5">
                  <p className="text-base font-bold text-foreground tabular-nums">
                    {currentWeather.temperature}&deg;C
                  </p>
                  <p className="text-[9px] text-muted-foreground">Temp</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1 flex-1 rounded-full bg-background/40 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedDistrict.rainProbability}%`,
                      backgroundColor: getRainColor(
                        selectedDistrict.rainProbability
                      ),
                    }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground/60 font-mono tabular-nums">
                  {selectedDistrict.center[1].toFixed(2)}&deg;N
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}