"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import {
  Camera,
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
  Construction,
  CornerUpRight,
  RefreshCw,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Mountain,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CCTVFeed, Route } from "@/lib/routes/route-data";
import { cn } from "@/lib/utils";
import { decodePolyline, isPolylineEncoded } from "@/lib/routes/polyline";

const BLOCKED_IFRAME_DOMAINS = ["atis.ntpc.gov.tw", "tw.live"];
const RATE_LIMITED_IFRAME_DOMAINS = ["hls.bote.gov.taipei"];
const ROUTE_CCTV_MAX_DIST_KM = 2.0;

function isBlockedByCSP(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return BLOCKED_IFRAME_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function hasWhiteBorderInEmbed(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return RATE_LIMITED_IFRAME_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeLatLon(lat?: number, lon?: number): { lat: number; lon: number } | null {
  if (lat == null || lon == null) return null;
  // 台灣常見範圍：緯度約 21-26.5，經度約 120-122.5（容忍一點）
  const latLooksLon = lat >= 110 && lat <= 140;
  const lonLooksLat = lon >= 15 && lon <= 40;
  if (latLooksLon && lonLooksLat) {
    return { lat: lon, lon: lat };
  }
  return { lat, lon };
}

/**
 * 將 CCTV 的座標映射到 route polyline 的累積公里數。
 * 做法：先找最近的 polyline 點，再在相鄰少數線段做投影插值。
 */
function mapLatLonToKm(
  lat: number,
  lon: number,
  points: [number, number][],
  cumulativeKm: number[]
): { km: number; distKm: number } | null {
  if (points.length < 2) return null;
  if (points.length !== cumulativeKm.length) return null;

  // 可靠但稍重：對整條 polyline 的每個線段做投影，取距離最小的那段
  // 這可以避免「後段彎曲時只看附近窗口會投錯里程」的問題。
  const Rm = 6371000; // meters
  let bestKm: number | null = null;
  let bestDistKm = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const [aLat, aLon] = points[i]!;
    const [bLat, bLon] = points[i + 1]!;

    const refLat = (aLat + bLat) / 2;
    const refLon = (aLon + bLon) / 2;
    const refLatRad = (refLat * Math.PI) / 180;

    const ax = (aLon - refLon) * Math.cos(refLatRad) * Rm;
    const ay = (aLat - refLat) * Rm;
    const bx = (bLon - refLon) * Math.cos(refLatRad) * Rm;
    const by = (bLat - refLat) * Rm;

    const px = (lon - refLon) * Math.cos(refLatRad) * Rm;
    const py = (lat - refLat) * Rm;

    const vx = bx - ax;
    const vy = by - ay;
    const vLen2 = vx * vx + vy * vy;
    if (vLen2 === 0) continue;

    const wx = px - ax;
    const wy = py - ay;
    const tRaw = (wx * vx + wy * vy) / vLen2;
    const t = Math.max(0, Math.min(1, tRaw));

    const closestX = ax + t * vx;
    const closestY = ay + t * vy;
    const distMeters = Math.hypot(px - closestX, py - closestY);
    const distKm = distMeters / 1000;

    if (distKm < bestDistKm) {
      const segKm = (cumulativeKm[i + 1] ?? 0) - (cumulativeKm[i] ?? 0);
      bestKm = (cumulativeKm[i] ?? 0) + t * segKm;
      bestDistKm = distKm;
    }
  }

  if (bestKm == null) return null;
  return { km: bestKm, distKm: bestDistKm };
}

export type RouteStage = {
  id: string;
  km: number;
  name: string;
  cctv?: { id: string; imageSeed: number; status: string };
  event?: {
    description: string;
    type: "accident" | "construction" | "closure" | "turn";
    severity: "low" | "medium" | "high";
  };
  rainProbability: number;
  temperature: number;
  windSpeed: number;
};

/** 單一路線上的 CCTV 錨點（供縮圖列與主畫面同步） */
export type CctvMarker = {
  id: string;
  km: number;
  name: string;
  location?: string;
  videoUrl?: string;
  lat?: number;
  lon?: number;
  /** CCTV 座標投影到 route polyline 的最短距離（km），用來排除離路很遠的鏡頭 */
  distToRouteKm?: number;
  imageSeed: number;
  status: "online" | "offline" | "degraded";
  lastUpdated?: string;
};

interface ReconViewProps {
  route: Route;
  /** 來自 useRouteCCTV 的即時清單；優先於 route.cctvFeeds */
  cctvFeeds?: CCTVFeed[];
  cctvLoading?: boolean;
}

/** 從 elevationProfile + segments 衍生 stages（GPX Route 無 stages 時使用） */
function deriveStages(route: Route): RouteStage[] {
  const ep = route.elevationProfile ?? [];
  const segs = route.segments ?? [];
  if (ep.length === 0) return [];
  const totalKm = route.distance ?? (ep[ep.length - 1]?.[0] ?? 0);
  const sampleKm = [0, totalKm * 0.25, totalKm * 0.5, totalKm * 0.75, totalKm].filter(
    (k, i, arr) => arr.indexOf(k) === i
  );
  return sampleKm.map((km, i) => {
    const seg = segs[Math.min(i, segs.length - 1)] ?? segs[0];
    return {
      id: `stage-${i}`,
      km,
      name: seg?.districtZh ?? `路段 ${i + 1}`,
      rainProbability: seg?.rainProbability ?? 0,
      temperature: seg?.temperature ?? 0,
      windSpeed: seg?.windSpeed ?? 0,
    };
  });
}

function buildCctvMarkers(
  route: Route,
  feeds: CCTVFeed[],
  routePolyline?: { points: [number, number][]; cumulativeKm: number[] }
): CctvMarker[] {
  const ep = route.elevationProfile ?? [];
  const totalKm =
    route.distance ?? (ep.length > 0 ? ep[ep.length - 1]![0] : 0);

  if (feeds.length > 0) {
    const n = feeds.length;
    const getDefaultKm = (i: number) =>
      n === 1 ? totalKm / 2 : (totalKm * (i + 1)) / (n + 1);

    const markers = feeds
      .map((feed, i) => {
        const defaultKm = getDefaultKm(i);
        const normalized = normalizeLatLon(feed.lat, feed.lon);
        const mapped =
          routePolyline && feed.lat != null && feed.lon != null
            ? mapLatLonToKm(
                normalized?.lat ?? feed.lat,
                normalized?.lon ?? feed.lon,
                routePolyline.points,
                routePolyline.cumulativeKm
              )
            : null;

        return {
          id: feed.id,
          km: mapped?.km ?? defaultKm,
          distToRouteKm: mapped?.distKm,
          name: feed.label || feed.location,
          location: feed.location || feed.label || undefined,
          videoUrl: feed.videoUrl,
          lat: normalized?.lat,
          lon: normalized?.lon,
          imageSeed: feed.imageSeed,
          status: feed.status,
          lastUpdated: feed.lastUpdated,
        } satisfies CctvMarker;
      })
      .sort((a, b) => a.km - b.km);

    return markers;
  }

  const routeStages = (route as Route & { stages?: RouteStage[] }).stages ?? deriveStages(route);
  return routeStages.map((s, i) => ({
    id: `stage-${s.id}-${i}`,
    km: s.km,
    name: s.name,
    location: s.name,
    videoUrl: undefined,
    imageSeed: s.cctv?.imageSeed ?? (s.id.charCodeAt(0) * 17 + i * 31) % 1000,
    status: (s.cctv?.status as CctvMarker["status"]) ?? "online",
    lastUpdated: undefined,
  }));
}

interface ChartDataPoint {
  km: number;
  elevation: number;
  stage?: RouteStage;
}

export function ReconView({
  route,
  cctvFeeds: cctvFeedsProp,
  cctvLoading = false,
}: ReconViewProps) {
  const [routePositionKm, setRoutePositionKm] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const thumbRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const prevActiveMarkerId = useRef<string | null>(null);
  const didAutoInitRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  const routePolylineKm = useMemo(() => {
    const encoded = route.gpxPreviewPath;
    if (!encoded || !isPolylineEncoded(encoded)) return null;
    try {
      const points = decodePolyline(encoded);
      if (points.length < 2) return null;

      // 優先使用 route.elevationProfile 的 km 序列做對齊（避免 polyline 座標四捨五入造成 km 漂移）
      const profileKm = route.elevationProfile.map(([km]) => km);
      if (profileKm.length === points.length) {
        return { points, cumulativeKm: profileKm };
      }

      // 如果 elevationProfile 長度跟 polyline 不一致（例如 GPX 無 ele 時的降採樣），才回退用 haversine 累加
      const cumulativeKm: number[] = [0];
      let sum = 0;
      for (let i = 1; i < points.length; i++) {
        const [lat1, lon1] = points[i - 1]!;
        const [lat2, lon2] = points[i]!;
        sum += haversineKm(lat1, lon1, lat2, lon2);
        cumulativeKm.push(sum);
      }

      return { points, cumulativeKm };
    } catch {
      return null;
    }
  }, [route.gpxPreviewPath, route.elevationProfile]);

  const cctvMarkers = useMemo(() => {
    const feeds = cctvFeedsProp ?? route.cctvFeeds ?? [];
    return buildCctvMarkers(route, feeds, routePolylineKm ?? undefined);
  }, [route, cctvFeedsProp, routePolylineKm]);

  const initialMarker = useMemo(() => {
    if (cctvMarkers.length === 0) return null;

    // 若靜態補充的期望鏡頭存在，優先用它當初始化依據（避免剛好被同區其他近鏡頭搶走）
    const preferred =
      cctvMarkers.find((m) => m.id.includes("bot236")) ??
      cctvMarkers.find((m) => m.name.includes("至善路口")) ??
      null;
    if (preferred) return preferred;

    const startPoint = routePolylineKm?.points[0];
    if (!startPoint) return cctvMarkers[0] ?? null;
    const [startLat, startLon] = startPoint;

    // 只要有 lat/lon，就用「距離 GPX 起點最近」來當初始化依據
    const startBest = cctvMarkers[0]!;
    return cctvMarkers.reduce((best, curr) => {
      if (best.lat == null || best.lon == null) return curr;
      if (curr.lat == null || curr.lon == null) return best;
      const dBest = haversineKm(startLat, startLon, best.lat, best.lon);
      const dCurr = haversineKm(startLat, startLon, curr.lat, curr.lon);
      return dCurr < dBest ? curr : best;
    }, startBest);
  }, [cctvMarkers, routePolylineKm]);

  const stages = (route as Route & { stages?: RouteStage[] }).stages ?? deriveStages(route);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const ep = route.elevationProfile ?? [];
    return ep.map(([km, elevation]) => {
      const nearestStage =
        stages.length > 0
          ? stages.reduce((prev, curr) =>
              Math.abs(curr.km - km) < Math.abs(prev.km - km) ? curr : prev
            )
          : undefined;
      return { km, elevation, stage: nearestStage };
    });
  }, [route, stages]);

  const currentKm = routePositionKm;

  const activeMarker = useMemo(() => {
    if (cctvMarkers.length === 0) return null;
    const onRoute = cctvMarkers.filter(
      (m) => m.distToRouteKm != null && m.distToRouteKm <= ROUTE_CCTV_MAX_DIST_KM
    );
    const pool = onRoute.length > 0 ? onRoute : cctvMarkers;
    return pool.reduce((prev, curr) =>
      Math.abs(curr.km - currentKm) < Math.abs(prev.km - currentKm) ? curr : prev
    );
  }, [cctvMarkers, currentKm]);

  useEffect(() => {
    prevActiveMarkerId.current = null;
    didAutoInitRef.current = false;
    hasUserInteractedRef.current = false;
  }, [route.id]);

  useEffect(() => {
    if (didAutoInitRef.current) return;
    if (hasUserInteractedRef.current) return;
    if (initialMarker == null) return;
    didAutoInitRef.current = true;
    // 初次載入時讓游標與主畫面 CCTV 對齊：對齊最接近起點（min km）的那台。
    setRoutePositionKm(initialMarker.km);
  }, [initialMarker]);

  useEffect(() => {
    const id = activeMarker?.id;
    if (!id || id === prevActiveMarkerId.current) return;
    prevActiveMarkerId.current = id;
    const el = thumbRefs.current.get(id);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeMarker?.id]);

  const currentStage = useMemo(() => {
    if (stages.length === 0) {
      return { id: "start", km: 0, name: "起點", rainProbability: 0, temperature: 0, windSpeed: 0 } as RouteStage;
    }
    return stages.reduce((prev, curr) =>
      Math.abs(curr.km - currentKm) < Math.abs(prev.km - currentKm) ? curr : prev
    );
  }, [stages, currentKm]);

  const currentElevation = useMemo(() => {
    if (chartData.length === 0) return 0;
    const point = chartData.reduce((prev, curr) =>
      Math.abs(curr.km - currentKm) < Math.abs(prev.km - currentKm) ? curr : prev
    );
    return point?.elevation ?? 0;
  }, [chartData, currentKm]);

  const peakElevation = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((d) => d.elevation));
  }, [chartData]);

  const upcomingAlerts = useMemo(() => {
    return stages
      .filter((s) => s.km > currentKm && s.event)
      .slice(0, 4)
      .map((s) => ({
        km: s.km,
        name: s.name,
        event: s.event!,
      }));
  }, [stages, currentKm]);

  const sharpTurns = useMemo(() => {
    const turns: { km: number; type: string }[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const prevPt = chartData[i - 1];
      const currPt = chartData[i];
      if (!prevPt || !currPt) continue;
      const prevElev = prevPt.elevation;
      const currElev = currPt.elevation;
      const diff = Math.abs(currElev - prevElev);
      if (diff > 60 && currPt.km > currentKm) {
        turns.push({
          km: currPt.km,
          type: currElev > prevElev ? "Steep climb ahead" : "Sharp descent",
        });
      }
    }
    return turns.slice(0, 3);
  }, [chartData, currentKm]);

  const handleChartScrub = useCallback(
    (state: { activePayload?: Array<{ payload: ChartDataPoint }> }) => {
      const p = state?.activePayload?.[0]?.payload;
      if (p) {
        hasUserInteractedRef.current = true;
        setRoutePositionKm(p.km);
      }
    },
    []
  );

  const handleThumbRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) thumbRefs.current.set(id, el);
    else thumbRefs.current.delete(id);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  const gradientId = `elevationGradient-${route.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full min-w-0 max-w-full space-y-4"
    >
      {/* Header */}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-strava/10">
            <Mountain className="h-4 w-4 text-strava" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">道路即時狀況</h3>
            <p className="text-[10px] text-muted-foreground">
              互動式高度圖拖曳與即時 CCTV 畫面
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] border-strava/30 text-strava">
          <MapPin className="h-3 w-3 mr-1" />
            {currentKm.toFixed(1)} 公里
        </Badge>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          {/* Glass：主畫面 + 高程圖 + CCTV 縮圖列（勿在外層 overflow-hidden，會裁切 Recharts 座標與曲線） */}
          <div className="min-w-0 rounded-xl border border-border/30 bg-card/30 shadow-sm backdrop-blur-xl">
            <div className="overflow-hidden rounded-t-xl">
              <CCTVDisplay
                marker={activeMarker}
                stage={currentStage}
                km={currentKm}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                className="rounded-none border-0 border-b border-border/25 bg-transparent"
              />
            </div>

            <div className="border-b border-border/25 bg-card/20">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-strava" />
                  <h4 className="text-sm font-medium text-foreground">高度</h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-strava" />
                    目前高度: {currentElevation.toFixed(1)}m
                  </span>
                  <span>最高點: {peakElevation.toFixed(1)}m</span>
                </div>
              </div>

              <div className="min-w-0 overflow-visible px-2 pb-3 sm:px-4">
                <div className="h-52 w-full min-w-0 max-w-full sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 12, right: 14, left: 4, bottom: 18 }}
                      onMouseMove={handleChartScrub}
                      {...({
                        onTouchMove: handleChartScrub,
                      } as Record<string, unknown>)}
                    >
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FC4C02" stopOpacity={0.6} />
                          <stop offset="50%" stopColor="#FC4C02" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#FC4C02" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="km"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => `${v.toFixed(0)}km`}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => `${v.toFixed(0)}m`}
                        width={45}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: "#FC4C02", strokeWidth: 1, strokeDasharray: "4 4" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="elevation"
                        stroke="#FC4C02"
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                      />
                      <ReferenceLine
                        x={routePositionKm}
                        stroke="#FC4C02"
                        strokeWidth={2}
                        strokeDasharray="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2 pb-1">
                  拖曳／滑動高度圖或點選下方 CCTV 縮圖以同步位置
                </p>
              </div>
            </div>

            <CCTVThumbnailStrip
              markers={cctvMarkers}
              activeMarkerId={activeMarker?.id ?? null}
              loading={cctvLoading}
              onSelectKm={(km) => {
                hasUserInteractedRef.current = true;
                setRoutePositionKm(km);
              }}
              onThumbRef={handleThumbRef}
            />
          </div>

          <WeatherStats stage={currentStage} km={currentKm} />
        </div>

        {/* Glassmorphism Sidebar - Upcoming Alerts */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-border/30 bg-card/30 backdrop-blur-xl">
          <div className="px-4 py-3 border-b border-border/30 bg-amber-500/5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-medium text-foreground">Upcoming Alerts</h4>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Road conditions ahead
            </p>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="p-3 space-y-2">
              {/* Sharp turns */}
              {sharpTurns.map((turn, i) => (
                <AlertCard
                  key={`turn-${i}`}
                  km={turn.km}
                  title={turn.type}
                  type="turn"
                  severity="low"
                />
              ))}

              {/* Road events */}
              {upcomingAlerts.map((alert) => (
                <AlertCard
                  key={alert.km}
                  km={alert.km}
                  title={alert.name}
                  description={alert.event.description}
                  type={alert.event.type}
                  severity={alert.event.severity}
                />
              ))}

              {/* Empty state */}
              {sharpTurns.length === 0 && upcomingAlerts.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-success/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clear road ahead
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    No alerts in your path
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
}

/** 縮圖用迷你 CCTV 畫面（與主畫面相同種子邏輯） */
function CctvMiniPreview({ marker }: { marker: CctvMarker }) {
  const s = marker.imageSeed;
  const hue1 = (s * 37) % 360;
  const hue2 = (s * 73 + 120) % 360;
  const gid = `mini-${marker.id}`;
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <radialGradient id={gid} cx="50%" cy="40%">
          <stop offset="0%" stopColor={`hsl(${hue1}, 35%, 22%)`} />
          <stop offset="100%" stopColor={`hsl(${hue2}, 25%, 10%)`} />
        </radialGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#${gid})`} />
      <line
        x1="0"
        y1={56 + (s % 8)}
        x2="160"
        y2={52 + (s % 6)}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="22"
      />
      <line
        x1="0"
        y1={56 + (s % 8)}
        x2="160"
        y2={52 + (s % 6)}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        strokeDasharray="6,4"
      />
    </svg>
  );
}

function CCTVThumbnailStrip({
  markers,
  activeMarkerId,
  loading,
  onSelectKm,
  onThumbRef,
}: {
  markers: CctvMarker[];
  activeMarkerId: string | null;
  loading: boolean;
  onSelectKm: (km: number) => void;
  onThumbRef: (id: string, el: HTMLButtonElement | null) => void;
}) {
  if (loading && markers.length === 0) {
    return (
      <div className="rounded-b-xl border-t border-border/25 bg-card/20 px-5 pb-5 pt-3 sm:px-7">
        <p className="text-[10px] text-muted-foreground">CCTV 路線</p>
        <div className="mt-2 flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-[6.5rem] shrink-0 animate-pulse rounded-lg bg-muted/40 sm:h-[4.5rem] sm:w-28" />
          ))}
        </div>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="rounded-b-xl border-t border-border/25 bg-card/20 px-5 py-4 sm:px-7">
        <p className="text-[10px] text-muted-foreground text-center">此路線尚無 CCTV 錨點</p>
      </div>
    );
  }

  return (
    <div className="rounded-b-xl border-t border-border/25 bg-card/20">
      <p className="px-5 pt-3 text-[10px] font-medium text-muted-foreground sm:px-7">
        沿路 CCTV（點選同步高程游標）
      </p>
      <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch] px-5 pb-5 pt-2 sm:px-8 sm:pb-6 sm:pt-3">
        <div className="flex w-max gap-3 pb-1">
          {markers.map((m) => {
            const isActive = m.id === activeMarkerId;
            return (
              <button
                key={m.id}
                type="button"
                ref={(el) => onThumbRef(m.id, el)}
                onClick={() => onSelectKm(m.km)}
                className={cn(
                  "relative shrink-0 snap-center overflow-hidden rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strava/50",
                  isActive
                    ? "ring-2 ring-[#FC4C02] ring-offset-2 ring-offset-background/80"
                    : "ring-1 ring-border/40 hover:ring-border/60"
                )}
              >
                <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-background/85 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-foreground shadow-sm backdrop-blur-sm">
                  {m.km.toFixed(1)}km
                </span>
                <div className="relative h-16 w-[6.5rem] bg-[#0a1020] sm:h-[4.5rem] sm:w-28">
                  <CctvMiniPreview marker={m} />
                  <div
                    className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.06)_2px,rgba(0,0,0,0.06)_4px)]"
                    aria-hidden
                  />
                </div>
                <span className="sr-only">
                  CCTV {m.name} {m.location ? `(${m.location})` : ""} {m.km.toFixed(1)} 公里
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CCTVDisplay({
  marker,
  stage,
  km,
  isRefreshing,
  onRefresh,
  className,
}: {
  marker: CctvMarker | null;
  stage: RouteStage;
  km: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  className?: string;
}) {
  const hasCctv = !!marker;
  const status = marker?.status;
  const statusText = status === "online" ? "連線" : "離線";
  const videoUrl = marker?.videoUrl;
  const showIframe = !!videoUrl && !isBlockedByCSP(videoUrl);
  const needsScaleFix = hasWhiteBorderInEmbed(videoUrl);
  const cameraLocation = marker?.location ?? marker?.name;
  const cameraTitle = marker
    ? marker.location
      ? `${marker.name} - ${marker.location}`
      : marker.name
    : stage.name;

  const statusColor =
    status === "online"
      ? "#22c55e"
      : status === "degraded"
        ? "#f59e0b"
        : status === "offline"
          ? "#ef4444"
          : "#6b7280";

  const StatusIcon =
    status === "online"
      ? CheckCircle2
      : status === "degraded"
        ? AlertTriangle
        : AlertCircle;

  const visualKey = marker?.id ?? "no-feed";
  const hue1 = marker ? (marker.imageSeed * 37) % 360 : 200;
  const hue2 = marker ? (marker.imageSeed * 73 + 120) % 360 : 220;
  const seed = marker?.imageSeed ?? 100;

  return (
    <div className={cn("rounded-xl border border-border/40 bg-card/40 overflow-hidden", className)}>
      <Dialog>
        <div className="relative min-h-56 h-56 sm:min-h-64 sm:h-64 bg-[#0a1020] overflow-hidden group">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={visualKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0"
            >
              {marker ? (
                <>
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 640 256"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <radialGradient id={`recon-grad-${marker.id}`} cx="50%" cy="40%">
                        <stop offset="0%" stopColor={`hsl(${hue1}, 35%, 22%)`} />
                        <stop offset="100%" stopColor={`hsl(${hue2}, 25%, 10%)`} />
                      </radialGradient>
                    </defs>
                    <rect width="640" height="256" fill={`url(#recon-grad-${marker.id})`} />
                    <line
                      x1="0"
                      y1={160 + (seed % 20)}
                      x2="640"
                      y2={150 + (seed % 15)}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="80"
                    />
                    <line
                      x1="0"
                      y1={160 + (seed % 20)}
                      x2="640"
                      y2={150 + (seed % 15)}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="3"
                      strokeDasharray="30,20"
                    />
                    <path
                      d={`M 0 ${100 - (seed % 30)} 
                      L ${100 + (seed % 50)} ${60 + (seed % 20)} 
                      L ${200 + (seed % 40)} ${90 - (seed % 25)} 
                      L ${320} ${50 + (seed % 30)} 
                      L ${420 + (seed % 50)} ${80 - (seed % 20)} 
                      L ${540} ${60 + (seed % 25)} 
                      L 640 ${90 - (seed % 20)} 
                      L 640 120 L 0 120 Z`}
                      fill="rgba(255,255,255,0.03)"
                    />
                  </svg>
                  {showIframe && (
                    <iframe
                      src={videoUrl!}
                      title={marker?.name ?? ""}
                      className={`absolute inset-0 w-full h-full border-0 bg-[#0a1020] origin-center ${
                        needsScaleFix ? "scale-[1.5]" : ""
                      }`}
                      allow="autoplay; fullscreen"
                    />
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_2px,rgba(0,0,0,0.05)_4px)]"
                    aria-hidden
                  />
                </>
              ) : (
                <div className="absolute inset-0 bg-[#0a1020]" aria-hidden />
              )}
            </motion.div>
          </AnimatePresence>

          {marker?.videoUrl && isBlockedByCSP(marker.videoUrl) && (
            <a
              href={marker.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-[6] flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label={`在新分頁開啟 ${marker.name} 即時影像`}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/90 text-xs font-medium text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
                此影像因安全政策無法嵌入
              </span>
            </a>
          )}

          {isRefreshing && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1, repeat: 1 }}
            />
          )}

          <div className="absolute top-3 left-3 z-10 max-w-[min(100%,14rem)] bg-background/60 backdrop-blur-md rounded-lg px-3 py-2 border border-border/30">
            <p className="text-[10px] text-muted-foreground">目前路段</p>
            <p className="text-sm font-semibold text-foreground truncate">{stage.name}</p>
            {marker && (
              <p className="text-[10px] text-muted-foreground/90 truncate mt-0.5">
                {cameraLocation}
              </p>
            )}
          </div>

          <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center justify-end gap-2">
            <div
              className={cn(
                "flex items-center gap-1 bg-background/60 backdrop-blur-md rounded-lg px-2 py-1 border",
                status === "online" && "border-emerald-500/25",
                status === "degraded" && "border-amber-500/25",
                (status === "offline" || !status) && "border-border/30"
              )}
            >
              <StatusIcon className="h-3 w-3" style={{ color: statusColor }} />
              <span className="text-[10px] font-medium" style={{ color: statusColor }}>
                {hasCctv ? statusText : "無訊號"}
              </span>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="h-7 w-7 p-0 bg-background/60 backdrop-blur-md border border-border/30"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2">
            <Badge className="bg-strava/90 text-white text-xs px-2 py-0.5 border-0">
              <MapPin className="h-3 w-3 mr-1" />
              {km.toFixed(1)} 公里
            </Badge>
          </div>

          <DialogTrigger asChild>
            <button
              type="button"
              className="absolute bottom-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm border border-border/30 text-muted-foreground hover:text-foreground hover:bg-background/70 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="放大 CCTV"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </DialogTrigger>

          {hasCctv && status === "offline" && (
            <div className="absolute inset-0 z-[7] bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center px-4">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive font-medium">訊號中斷</p>
              </div>
            </div>
          )}

          {!hasCctv && (
            <div className="absolute inset-0 z-[6] bg-background/40 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center px-4">
                <Camera className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">此位置無 CCTV</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">請拖曳高程圖或選擇下方縮圖</p>
              </div>
            </div>
          )}
        </div>

        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Camera className="h-5 w-5 text-strava" />
              {cameraTitle} — KM {km.toFixed(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="relative h-96 bg-[#0a1020] rounded-lg overflow-hidden">
            {marker ? (
              <>
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 960 384"
                  preserveAspectRatio="none"
                >
                <defs>
                  <radialGradient id={`recon-grad-lg-${marker.id}`} cx="50%" cy="40%">
                    <stop offset="0%" stopColor={`hsl(${hue1}, 35%, 22%)`} />
                    <stop offset="100%" stopColor={`hsl(${hue2}, 25%, 10%)`} />
                  </radialGradient>
                </defs>
                <rect width="960" height="384" fill={`url(#recon-grad-lg-${marker.id})`} />
                <line
                  x1="0"
                  y1={220 + (seed % 25)}
                  x2="960"
                  y2={210 + (seed % 20)}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="120"
                />
                <line
                  x1="0"
                  y1={220 + (seed % 25)}
                  x2="960"
                  y2={210 + (seed % 20)}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="4"
                  strokeDasharray="40,30"
                />
              </svg>
              {showIframe && (
                <iframe
                  src={videoUrl!}
                  title={marker?.name ?? ""}
                  className={`absolute inset-0 w-full h-full border-0 bg-[#0a1020] origin-center ${
                    needsScaleFix ? "scale-[1.5]" : ""
                  }`}
                  allow="autoplay; fullscreen"
                />
              )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                無可用畫面
              </div>
            )}
            {marker?.videoUrl && isBlockedByCSP(marker.videoUrl) && (
              <a
                href={marker.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50"
              >
                <p className="text-sm text-foreground/90">此影像因安全政策無法嵌入</p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-strava text-white text-sm font-medium hover:bg-strava/90 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                  在新分頁開啟即時影像
                </span>
              </a>
            )}
            <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3">
              <Badge className="bg-strava text-white">KM {km.toFixed(1)}</Badge>
              <span className="text-sm text-foreground font-medium">{stage.name}</span>
              {marker?.lastUpdated && (
                <span className="text-xs text-muted-foreground">更新 {marker.lastUpdated}</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WeatherStats({ stage, km }: { stage: RouteStage; km: number }) {
  const rainColor =
    stage.rainProbability >= 60
      ? "#ef4444"
      : stage.rainProbability >= 35
        ? "#f59e0b"
        : "#22c55e";

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">
          {km.toFixed(1)} 公里 — 天氣狀況
        </h4>
        <Badge variant="outline" className="text-[10px] border-border/40">
          {stage.name}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Temperature */}
        <div className="rounded-lg bg-secondary/30 p-3 text-center">
          <Thermometer className="h-5 w-5 mx-auto mb-1.5 text-strava" />
          <p className="text-lg font-bold text-foreground tabular-nums">
            {stage.temperature}°C
          </p>
          <p className="text-[10px] text-muted-foreground">Temperature</p>
        </div>

        {/* Wind */}
        <div className="rounded-lg bg-secondary/30 p-3 text-center">
          <Wind
            className="h-5 w-5 mx-auto mb-1.5"
            style={{ color: stage.windSpeed >= 20 ? "#f59e0b" : "#a78bfa" }}
          />
          <p className="text-lg font-bold text-foreground tabular-nums">
            {stage.windSpeed}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">km/h</span>
          </p>
          <p className="text-[10px] text-muted-foreground">Wind Speed</p>
        </div>

        {/* Rain */}
        <div className="rounded-lg bg-secondary/30 p-3 text-center">
          <CloudRain className="h-5 w-5 mx-auto mb-1.5" style={{ color: rainColor }} />
          <p className="text-lg font-bold tabular-nums" style={{ color: rainColor }}>
            {stage.rainProbability}%
          </p>
          <p className="text-[10px] text-muted-foreground">Rain Chance</p>
        </div>
      </div>
    </div>
  );
}

function AlertCard({
  km,
  title,
  description,
  type,
  severity,
}: {
  km: number;
  title: string;
  description?: string;
  type: "accident" | "construction" | "closure" | "turn";
  severity: "low" | "medium" | "high";
}) {
  const severityColor =
    severity === "high"
      ? "#ef4444"
      : severity === "medium"
        ? "#f59e0b"
        : "#22c55e";

  const Icon =
    type === "accident"
      ? AlertTriangle
      : type === "construction"
        ? Construction
        : type === "turn"
          ? CornerUpRight
          : AlertCircle;

  return (
    <div
      className="rounded-lg border p-2.5 transition-colors hover:bg-secondary/30"
      style={{
        borderColor: `${severityColor}25`,
        backgroundColor: `${severityColor}05`,
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${severityColor}15` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: severityColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-strava">{km.toFixed(1)} 公里</span>
            <span
              className="text-[9px] px-1 py-0.5 rounded capitalize"
              style={{
                backgroundColor: `${severityColor}20`,
                color: severityColor,
              }}
            >
              {type}
            </span>
          </div>
          <p className="text-xs font-medium text-foreground truncate mt-0.5">{title}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-lg p-2 shadow-xl">
      <p className="text-xs font-bold text-strava">{data.km.toFixed(1)} 公里</p>
      <p className="text-[11px] text-foreground">{data.elevation.toFixed(1)}m 高度</p>
      {data.stage && (
        <p className="text-[10px] text-muted-foreground truncate max-w-32">
          {data.stage.name}
        </p>
      )}
    </div>
  );
}