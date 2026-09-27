"use client";

import { motion } from "framer-motion";
import { Mountain, Route as RouteIcon, Clock, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Route } from "@/lib/routes/route-data";
import { getStatusLabel } from "@/lib/routes/route-data";
import type { RouteWeatherState } from "@/hooks/useRouteWeather";
import { ROUTE_TYPE_ICONS } from "@/constants";
import { getSvgPath } from "@/lib/routes/polyline";
import { cn } from "@/lib/utils";

/** 只有注意／危險用警示色；安全不做大面積綠 */
const STATUS_BADGE: Record<Route["status"], { badge: string; dot: string }> = {
  safe: { badge: "bg-card text-foreground", dot: "bg-success" },
  caution: { badge: "bg-warning text-warning-foreground", dot: "bg-warning-foreground/70" },
  risky: { badge: "bg-destructive text-destructive-foreground", dot: "bg-destructive-foreground" },
};

/** 從 SVG path（M x y L x y …）取出起點與終點座標 */
function pathEndpoints(d: string): { start: [number, number]; end: [number, number] } | null {
  const pts = [...d.matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
  return pts.length >= 2 ? { start: pts[0]!, end: pts[pts.length - 1]! } : null;
}

interface RouteHeaderProps {
  route: Route;
  /** 由天氣計算的狀態；null 代表尚無資料（route.status 為 GPX 寫死值，不使用） */
  statusOverride?: Route["status"] | null;
  weatherState?: RouteWeatherState;
  /** 覆寫路線資料中的建議時段 */
  bestTimeToRide?: string;
}

export function RouteHeader({ route, statusOverride, weatherState, bestTimeToRide }: RouteHeaderProps) {
  const status = statusOverride ?? null;
  const suggestTime = bestTimeToRide ?? route.bestTimeToRide;
  const svgPath = getSvgPath(route.gpxPreviewPath);
  const ends = pathEndpoints(svgPath);
  const TypeIcon = ROUTE_TYPE_ICONS[route.type];

  // Build elevation profile SVG
  const maxElev = Math.max(...route.elevationProfile.map((p) => p[1]));
  const maxDist = route.elevationProfile[route.elevationProfile.length - 1]?.[0] || 0;
  const svgW = 200;
  const svgH = 60;
  const elevPoints = route.elevationProfile
    .map((p) => {
      const x = (p[0] / maxDist) * svgW;
      const y = svgH - (p[1] / (maxElev * 1.15)) * svgH;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPath = `M 0,${svgH} L ${route.elevationProfile
    .map((p) => {
      const x = (p[0] / maxDist) * svgW;
      const y = svgH - (p[1] / (maxElev * 1.15)) * svgH;
      return `${x},${y}`;
    })
    .join(" L ")} L ${svgW},${svgH} Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* 路線預覽：日光主題，顏色全走設計 token（暗色模式自動切換） */}
      <div className="relative h-44 overflow-hidden bg-accent">
        {/* 底部海拔剖面 */}
        <div className="absolute inset-x-0 bottom-0 h-16" aria-hidden>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="size-full" preserveAspectRatio="none">
            <path d={areaPath} className="fill-primary/10" />
            <polyline
              points={elevPoints}
              className="fill-none stroke-primary/40"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* 路線軌跡：底下一層卡片色描邊，讓線條在任何底色上都清楚 */}
        <svg viewBox="0 0 200 120" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <path d={svgPath} className="fill-none stroke-card" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <motion.path
            d={svgPath}
            className="fill-none stroke-primary"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
          {/* 起點與終點：取自實際軌跡 */}
          {ends && (
            <>
              <circle cx={ends.start[0]} cy={ends.start[1]} r={4} className="fill-success stroke-card" strokeWidth={1.5} />
              <circle cx={ends.end[0]} cy={ends.end[1]} r={4} className="fill-primary stroke-card" strokeWidth={1.5} />
            </>
          )}
        </svg>

        {/* Top badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {status ? (
            <Badge
              variant="outline"
              className={cn("border-0 text-xs font-semibold px-2.5 py-1", STATUS_BADGE[status].badge)}
            >
              <span className={cn("mr-1.5 h-2 w-2 rounded-full inline-block", STATUS_BADGE[status].dot)} />
              {getStatusLabel(status)}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-0 text-xs font-semibold px-2.5 py-1 bg-card text-muted-foreground"
            >
              {weatherState === "loading" ? "天氣載入中" : "無天氣資料"}
            </Badge>
          )}
        </div>

        {/* Distance label */}
        <div className="absolute top-3 right-3">
          <Badge
            variant="outline"
            className="border-border bg-card text-muted-foreground text-xs px-2 py-1"
          >
            <RouteIcon className="h-3 w-3 mr-1" />
            {route.distance} km
          </Badge>
        </div>
      </div>

      {/* Route info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground text-balance">{route.name}</h2>
            <p className="text-sm text-muted-foreground">{route.nameZh}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 rounded-lg bg-secondary/40 px-2.5 py-1.5">
            <TypeIcon className="h-4 w-4 text-strava" />
            <span className="text-xs font-medium text-foreground">{route.type}</span>
          </div>
        </div>

        <div className={`grid gap-3 ${suggestTime ? "grid-cols-4" : "grid-cols-3"}`}>
          <StatPill icon={RouteIcon} label="距離" value={`${route.distance} km`} />
          <StatPill icon={Mountain} label="海拔" value={`${route.elevationGain}m`} />
          <StatPill icon={Clock} label="預估時間" value={route.estimatedTime} />
          {suggestTime ? <StatPill icon={Sun} label="建議出發" value={suggestTime} /> : null}
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-secondary/30 ring-1 ring-border/10 p-2.5 text-center">
      <Icon className="h-4 w-4 text-strava mx-auto mb-1" />
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}