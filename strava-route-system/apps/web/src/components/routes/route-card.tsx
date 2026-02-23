"use client";

import { motion } from "framer-motion";
import { Mountain, Route as RouteIcon, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Route } from "@/lib/routes/route-data";
import { getStatusColor, getDifficultyColor } from "@/lib/routes/route-data";
import { ROUTE_TYPE_ICONS } from "@/constants";

interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  onSelect: (id: string) => void;
  index: number;
}

export function RouteCard({ route, isSelected, onSelect, index }: RouteCardProps) {
  const statusColor = getStatusColor(route.status);
  const diffColor = getDifficultyColor(route.difficulty);
  const TypeIcon = ROUTE_TYPE_ICONS[route.type];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      onClick={() => onSelect(route.id)}
      className={cn(
        "w-full text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer group",
        "border",
        isSelected
          ? "bg-strava/8 border-strava/30 ring-1 ring-strava/20"
          : "bg-card/40 border-border/40 hover:bg-card/70 hover:border-border/60"
      )}
    >
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 mb-0.5">
            <TypeIcon className="h-3.5 w-3.5 text-strava shrink-0 mt-0.5" />
            <span className="text-sm font-semibold text-foreground break-words min-w-0">
              {route.name}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">{route.nameZh}</span>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 text-[10px] px-2 py-0.5 font-semibold capitalize border-0"
          style={{
            color: statusColor,
            backgroundColor: `${statusColor}15`,
          }}
        >
          <span
            className="mr-1.5 h-1.5 w-1.5 rounded-full inline-block"
            style={{ backgroundColor: statusColor }}
          />
          {route.status}
        </Badge>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2.5">
        <span className="flex items-center gap-1">
          <RouteIcon className="h-3 w-3" />
          {route.distance} km
        </span>
        <span className="flex items-center gap-1">
          <Mountain className="h-3 w-3" />
          {route.elevationGain}m
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {route.estimatedTime}
        </span>
      </div>

      {/* Difficulty + arrow */}
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 capitalize border-0"
          style={{
            color: diffColor,
            backgroundColor: `${diffColor}12`,
          }}
        >
          {route.difficulty}
        </Badge>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-all",
            isSelected
              ? "text-strava translate-x-0"
              : "text-muted-foreground/40 -translate-x-1 group-hover:translate-x-0 group-hover:text-muted-foreground"
          )}
        />
      </div>
    </motion.button>
  );
}