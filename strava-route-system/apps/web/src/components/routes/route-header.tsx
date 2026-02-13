"use client";

import { motion } from "framer-motion";
import {
  Bike,
  Footprints,
  Mountain,
  Route as RouteIcon,
  Clock,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Route } from "@/lib/routes/route-data";
import { getStatusColor } from "@/lib/routes/route-data";

interface RouteHeaderProps {
  route: Route;
}

export function RouteHeader({ route }: RouteHeaderProps) {
  const statusColor = getStatusColor(route.status);

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
      className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      {/* GPX Map Preview */}
      <div className="relative h-44 bg-[#0a1628] overflow-hidden">
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="route-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#route-grid)" className="text-foreground" />
        </svg>

        {/* Route path visualization */}
        <svg
          viewBox="0 0 200 120"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="route-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FC4C02" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#FC4C02" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FC4C02" stopOpacity="0.2" />
            </linearGradient>
            <filter id="route-blur">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {/* Glow layer */}
          <path
            d={route.gpxPreviewPath}
            fill="none"
            stroke="url(#route-glow)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#route-blur)"
          />
          {/* Main route line */}
          <motion.path
            d={route.gpxPreviewPath}
            fill="none"
            stroke="#FC4C02"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
          {/* Start/end dots */}
          <circle cx="10" cy="95" r="4" fill="#22c55e" opacity="0.9" />
          <circle cx="10" cy="95" r="7" fill="#22c55e" opacity="0.2" />
          <circle cx="175" cy="55" r="4" fill="#FC4C02" opacity="0.9" />
          <circle cx="175" cy="55" r="7" fill="#FC4C02" opacity="0.2" />
        </svg>

        {/* Elevation mini-profile at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-40">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="elev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC4C02" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FC4C02" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#elev-fill)" />
            <polyline points={elevPoints} fill="none" stroke="#FC4C02" strokeWidth="1" opacity="0.6" />
          </svg>
        </div>

        {/* Top badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-0 text-xs font-semibold capitalize px-2.5 py-1 backdrop-blur-sm"
            style={{ color: statusColor, backgroundColor: `${statusColor}20` }}
          >
            <span
              className="mr-1.5 h-2 w-2 rounded-full inline-block animate-pulse"
              style={{ backgroundColor: statusColor }}
            />
            {route.status === "safe" ? "Clear" : route.status === "caution" ? "Caution" : "Risky"}
          </Badge>
        </div>

        {/* Distance label */}
        <div className="absolute top-3 right-3">
          <Badge
            variant="outline"
            className="border-foreground/10 bg-background/30 text-foreground/80 backdrop-blur-sm text-xs px-2 py-1"
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
            {route.type === "cycling" ? (
              <Bike className="h-4 w-4 text-strava" />
            ) : (
              <Footprints className="h-4 w-4 text-strava" />
            )}
            <span className="text-xs font-medium text-foreground capitalize">{route.type}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <StatPill icon={RouteIcon} label="Distance" value={`${route.distance} km`} />
          <StatPill icon={Mountain} label="Elevation" value={`${route.elevationGain}m`} />
          <StatPill icon={Clock} label="Est. Time" value={route.estimatedTime} />
          <StatPill icon={Sun} label="Best Time" value={route.bestTimeToRide} />
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