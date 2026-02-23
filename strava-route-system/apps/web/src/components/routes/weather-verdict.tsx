"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CloudRain,
  Wind,
  Thermometer,
  Sun,
  Cloud,
  CloudLightning,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Route, RouteSegment } from "@/lib/routes/route-data";
import { getStatusColor } from "@/lib/routes/route-data";

interface WeatherVerdictProps {
  route: Route;
}

export function WeatherVerdict({ route }: WeatherVerdictProps) {
  const statusColor = getStatusColor(route.status);
  const hasSegments = route.segments.length > 0;

  const VerdictIcon =
    route.status === "safe"
      ? ShieldCheck
      : route.status === "caution"
        ? AlertTriangle
        : ShieldAlert;

  const avgRain = hasSegments
    ? Math.round(
        route.segments.reduce((s, seg) => s + seg.rainProbability, 0) / route.segments.length
      )
    : 0;
  const maxWind = hasSegments ? Math.max(...route.segments.map((s) => s.windSpeed)) : 0;
  const tempRange = hasSegments
    ? `${Math.min(...route.segments.map((s) => s.temperature))} - ${Math.max(...route.segments.map((s) => s.temperature))}°C`
    : "-";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Verdict alert box */}
      <div
        className="rounded-xl p-4 border"
        style={{
          borderColor: `${statusColor}30`,
          backgroundColor: `${statusColor}08`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: `${statusColor}18` }}
          >
            <VerdictIcon className="h-5 w-5" style={{ color: statusColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Multi-District Weather Verdict
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: statusColor }}>
              {route.verdictMessage}
            </p>
          </div>
        </div>

        <Separator className="my-3 bg-border/20" />

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CloudRain className="h-3.5 w-3.5 text-[#60a5fa]" />
            Avg Rain: <strong className="text-foreground">{avgRain}%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-[#a78bfa]" />
            Max Wind: <strong className="text-foreground">{maxWind} km/h</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-strava" />
            Range: <strong className="text-foreground">{tempRange}</strong>
          </span>
        </div>
      </div>

      {hasSegments && (
      <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-sm font-semibold text-foreground">
            District Weather Breakdown
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Conditions along each segment of your route
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  District
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Rain %
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Wind
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Temp
                </th>
              </tr>
            </thead>
            <tbody>
              {route.segments.map((seg, i) => (
                <SegmentRow key={seg.district} segment={seg} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </motion.div>
  );
}

function SegmentRow({ segment, index }: { segment: RouteSegment; index: number }) {
  const CondIcon = getCondIcon(segment.condition);
  const rainColor =
    segment.rainProbability >= 60
      ? "#ef4444"
      : segment.rainProbability >= 35
        ? "#f59e0b"
        : "#22c55e";

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="border-b border-border/10 last:border-0 hover:bg-secondary/15 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{segment.district}</span>
          <span className="text-[11px] text-muted-foreground">{segment.districtZh}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <CondIcon className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize text-foreground text-xs">{segment.condition}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-12 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${segment.rainProbability}%`, backgroundColor: rainColor }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums" style={{ color: rainColor }}>
            {segment.rainProbability}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-xs text-foreground tabular-nums">{segment.windSpeed} km/h</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-xs text-foreground tabular-nums">{segment.temperature}{"°C"}</span>
      </td>
    </motion.tr>
  );
}

function getCondIcon(condition: RouteSegment["condition"]) {
  switch (condition) {
    case "clear":
      return Sun;
    case "cloudy":
      return Cloud;
    case "rainy":
      return CloudRain;
    case "stormy":
      return CloudLightning;
  }
}