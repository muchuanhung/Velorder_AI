"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Construction,
  Clock,
  MapPin,
  ShieldAlert,
  ChevronRight,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  tdxIncidents,
  clusterIncidents,
  isCluster,
  type Incident,
  type Cluster,
} from "@/lib/maps/map-data";

interface IncidentMarkersProps {
  visible: boolean;
  zoom: number;
}

/**
 * Cluster radius scales inversely with zoom: at 100% zoom we use a moderate
 * grouping radius; zooming in shrinks it so markers separate, zooming out
 * grows it so more markers merge.
 */
function getClusterRadius(zoom: number): number {
  if (zoom >= 140) return 0; // fully zoomed in => no clustering
  if (zoom >= 120) return 4;
  if (zoom >= 100) return 8;
  if (zoom >= 80) return 14;
  return 20;
}

export function IncidentMarkers({ visible, zoom }: IncidentMarkersProps) {
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(
    null
  );

  const radius = getClusterRadius(zoom);
  const items = useMemo(
    () => clusterIncidents(tdxIncidents, radius),
    [radius]
  );

  // When an expanded cluster is no longer in the items (because zoom changed),
  // reset expanded state
  const expandedCluster = useMemo(() => {
    if (!expandedClusterId) return null;
    const found = items.find(
      (item) => isCluster(item) && item.id === expandedClusterId
    );
    return found && isCluster(found) ? found : null;
  }, [items, expandedClusterId]);

  const handleClusterClick = useCallback((clusterId: string) => {
    setExpandedClusterId((prev) =>
      prev === clusterId ? null : clusterId
    );
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[5]">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          if (isCluster(item)) {
            return (
              <ClusterBubble
                key={item.id}
                cluster={item}
                index={index}
                expanded={expandedCluster?.id === item.id}
                onToggle={handleClusterClick}
              />
            );
          }
          return (
            <IncidentPin
              key={item.id}
              incident={item}
              index={index}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// --- Cluster bubble ---

function ClusterBubble({
  cluster,
  index,
  expanded,
  onToggle,
}: {
  cluster: Cluster;
  index: number;
  expanded: boolean;
  onToggle: (id: string) => void;
}) {
  const count = cluster.incidents.length;
  const accidentCount = cluster.incidents.filter(
    (i) => i.type === "accident"
  ).length;
  const constructionCount = count - accidentCount;

  const severityRing = {
    low: "ring-[#fbbf24]/40",
    medium: "ring-strava/40",
    high: "ring-red-500/40",
  }[cluster.maxSeverity];

  const severityGlow = {
    low: "shadow-[#fbbf24]/15",
    medium: "shadow-strava/15",
    high: "shadow-red-500/20",
  }[cluster.maxSeverity];

  // Size based on count
  const size = count <= 3 ? 40 : count <= 5 ? 48 : 54;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        type: "spring",
        stiffness: 260,
        damping: 24,
      }}
      className="absolute pointer-events-auto"
      style={{
        left: `${cluster.position[0]}%`,
        top: `${cluster.position[1]}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <Popover
        open={expanded}
        onOpenChange={(open) => {
          if (!open) onToggle(cluster.id);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => onToggle(cluster.id)}
            className="relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            aria-label={`Cluster of ${count} incidents`}
          >
            {/* Outer pulse */}
            <span
              className={`absolute inset-[-6px] rounded-full animate-ping opacity-20 ${
                cluster.hasAccident ? "bg-red-500" : "bg-[#fbbf24]"
              }`}
              style={{ animationDuration: "3s" }}
            />

            {/* Cluster body */}
            <div
              className={`relative flex items-center justify-center rounded-full ring-2 ${severityRing} shadow-xl ${severityGlow} transition-transform duration-200 group-hover:scale-110`}
              style={{
                width: size,
                height: size,
                background:
                  "radial-gradient(circle at 35% 35%, rgba(30, 41, 59, 0.95), rgba(12, 18, 32, 0.98))",
              }}
            >
              {/* Count */}
              <span className="text-sm font-bold text-foreground tabular-nums">
                {count}
              </span>

              {/* Mini type indicators */}
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                {accidentCount > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
                {constructionCount > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />
                )}
              </div>
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="right"
          align="start"
          sideOffset={14}
          className="w-80 bg-[#0c1220]/95 backdrop-blur-2xl border-border/40 p-0 shadow-2xl shadow-black/50"
        >
          <div className="p-3.5 space-y-3">
            {/* Cluster header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/40 ring-1 ring-border/20 text-foreground font-bold text-sm tabular-nums">
                  {count}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Incident Cluster
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {accidentCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 bg-red-500/10 border-red-500/30 text-red-400"
                      >
                        {accidentCount} accident{accidentCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {constructionCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24]"
                      >
                        {constructionCount} construction
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggle(cluster.id)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <Separator className="bg-border/20" />

            {/* Incident list */}
            <ScrollArea className="max-h-56">
              <div className="space-y-1.5 pr-2">
                {cluster.incidents.map((incident) => (
                  <ClusterIncidentRow
                    key={incident.id}
                    incident={incident}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}

function ClusterIncidentRow({ incident }: { incident: Incident }) {
  const isAccident = incident.type === "accident";
  const [showDetail, setShowDetail] = useState(false);

  const severityConfig = {
    low: {
      badge: "bg-[#fbbf24]/15 border-[#fbbf24]/30 text-[#fbbf24]",
      label: "Low",
    },
    medium: {
      badge: "bg-strava/15 border-strava/30 text-strava",
      label: "Medium",
    },
    high: {
      badge: "bg-destructive/15 border-destructive/30 text-destructive",
      label: "High",
    },
  };

  return (
    <div className="rounded-lg bg-secondary/20 ring-1 ring-border/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setShowDetail((p) => !p)}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-secondary/30 transition-colors cursor-pointer"
      >
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
            isAccident
              ? "bg-red-500/10 text-red-400"
              : "bg-[#fbbf24]/10 text-[#fbbf24]"
          }`}
        >
          {isAccident ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <Construction className="h-3 w-3" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {incident.title}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {incident.location}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-[9px] px-1.5 py-0 h-4 shrink-0 ${severityConfig[incident.severity].badge}`}
        >
          {severityConfig[incident.severity].label}
        </Badge>
        <ChevronRight
          className={`h-3 w-3 text-muted-foreground/50 shrink-0 transition-transform ${showDetail ? "rotate-90" : ""}`}
        />
      </button>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 space-y-2 border-t border-border/10 pt-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {incident.description}
              </p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {incident.expectedClearance}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {incident.location}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Individual incident pin ---

function IncidentPin({
  incident,
  index,
}: {
  incident: Incident;
  index: number;
}) {
  const isAccident = incident.type === "accident";

  const severityConfig = {
    low: {
      badge: "bg-[#fbbf24]/15 border-[#fbbf24]/30 text-[#fbbf24]",
      label: "Low",
    },
    medium: {
      badge: "bg-strava/15 border-strava/30 text-strava",
      label: "Medium",
    },
    high: {
      badge: "bg-destructive/15 border-destructive/30 text-destructive",
      label: "High",
    },
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.06,
        type: "spring",
        stiffness: 300,
        damping: 22,
      }}
      className="absolute pointer-events-auto"
      style={{
        left: `${incident.position[0]}%`,
        top: `${incident.position[1]}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            aria-label={`${incident.type}: ${incident.title}`}
          >
            {/* Animated pulse ring */}
            <span
              className={`absolute inset-[-4px] rounded-full animate-ping ${
                isAccident ? "bg-red-500/25" : "bg-[#fbbf24]/25"
              }`}
              style={{ animationDuration: "2.5s" }}
            />

            {/* Marker body */}
            <div
              className={`relative flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] shadow-lg transition-transform duration-200 group-hover:scale-110 ${
                isAccident
                  ? "bg-red-500/90 border-red-400/80 shadow-red-500/25"
                  : "bg-[#fbbf24]/90 border-[#eab308]/80 shadow-[#fbbf24]/25"
              }`}
            >
              {isAccident ? (
                <AlertTriangle className="h-3.5 w-3.5 text-[#070b14]" />
              ) : (
                <Construction className="h-3.5 w-3.5 text-[#070b14]" />
              )}
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="right"
          align="center"
          sideOffset={12}
          className="w-72 bg-[#0c1220]/95 backdrop-blur-2xl border-border/40 p-0 shadow-2xl shadow-black/50"
        >
          <div className="p-3.5 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-2.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isAccident
                    ? "bg-red-500/10 ring-1 ring-red-500/20 text-red-400"
                    : "bg-[#fbbf24]/10 ring-1 ring-[#fbbf24]/20 text-[#fbbf24]"
                }`}
              >
                {isAccident ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <Construction className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 h-4 ${severityConfig[incident.severity].badge}`}
                  >
                    {severityConfig[incident.severity].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 border-border/40 text-muted-foreground"
                  >
                    {isAccident ? "Accident" : "Construction"}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-foreground leading-tight">
                  {incident.title}
                </h4>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {incident.description}
            </p>

            <Separator className="bg-border/20" />

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-snug">
                  {incident.location}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span className="text-muted-foreground">
                  Est. clearance:{" "}
                  <span className="text-foreground font-medium">
                    {incident.expectedClearance}
                  </span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-0.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-[11px] border-border/40 text-muted-foreground hover:text-foreground bg-transparent"
              >
                Suggest Route
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-[11px] bg-strava text-primary-foreground hover:bg-strava/90"
              >
                Navigate Around
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}