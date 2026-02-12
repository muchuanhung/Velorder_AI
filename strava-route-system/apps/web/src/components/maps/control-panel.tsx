"use client";

import { motion } from "framer-motion";
import {
  CloudRain,
  Car,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Sun,
  Gauge,
  Layers,
  LocateFixed,
  Loader2,
  Radio,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  currentWeather,
  getRainColor,
  type District,
} from "@/lib/maps/map-data";

interface ControlPanelProps {
  districts: District[];
  activeLayer: "rainfall" | "traffic";
  onLayerChange: (layer: "rainfall" | "traffic") => void;
  selectedDistrict: District | null;
  showIncidents: boolean;
  onToggleIncidents: (show: boolean) => void;
}

export function ControlPanel({
  districts,
  activeLayer,
  onLayerChange,
  selectedDistrict,
  showIncidents,
  onToggleIncidents,
}: ControlPanelProps) {
  const focusedDistrict =
    selectedDistrict ||
    districts.find((d) => d.isCurrentDistrict) ||
    districts[0];

  if (!focusedDistrict) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      className="absolute top-20 left-4 z-10 w-[272px] hidden lg:block"
    >
      <div className="rounded-xl border border-border/30 bg-[#0c1220]/85 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden">
        <ScrollArea className="max-h-[calc(100vh-7rem)]">
          <div className="p-4 space-y-4">
            {/* Panel header */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-strava/10 ring-1 ring-strava/20">
                <Layers className="h-3.5 w-3.5 text-strava" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Map Controls
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Layer toggles & live data
                </p>
              </div>
            </div>

            <Separator className="bg-border/20" />

            {/* Layer toggles */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Data Layers
              </p>

              <LayerButton
                active={activeLayer === "rainfall"}
                onClick={() => onLayerChange("rainfall")}
                icon={CloudRain}
                label="CWA Rainfall"
                description="Rain probability by district"
                activeColor="#4169E1"
              />

              <LayerButton
                active={activeLayer === "traffic"}
                onClick={() => onLayerChange("traffic")}
                icon={Car}
                label="TDX Traffic"
                description="Incidents & road status"
                activeColor="#FC4C02"
              />

              {/* Incident markers toggle */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20">
                <div className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Show Incidents
                  </span>
                </div>
                <Switch
                  checked={showIncidents}
                  onCheckedChange={onToggleIncidents}
                />
              </div>
            </div>

            <Separator className="bg-border/20" />

            {/* Live weather */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Live Weather
                </p>
                <Badge
                  variant="outline"
                  className="border-success/40 text-success text-[9px] px-1.5 py-0 h-4"
                >
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-success inline-block animate-pulse" />
                  LIVE
                </Badge>
              </div>

              {/* Focused area */}
              <div className="rounded-lg bg-secondary/30 ring-1 ring-border/20 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full ring-1 ring-background/30"
                    style={{
                      backgroundColor: focusedDistrict.isCurrentDistrict
                        ? "#FC4C02"
                        : getRainColor(focusedDistrict.rainProbability),
                    }}
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {focusedDistrict.nameZh}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {focusedDistrict.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 flex-1 rounded-full bg-background/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${focusedDistrict.rainProbability}%`,
                        backgroundColor: focusedDistrict.isCurrentDistrict
                          ? "#FC4C02"
                          : getRainColor(focusedDistrict.rainProbability),
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums font-medium">
                    {focusedDistrict.rainProbability}% rain
                  </span>
                </div>
              </div>

              {/* Weather metrics grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <WeatherMetric
                  icon={Thermometer}
                  label="Temp"
                  value={`${currentWeather.temperature}\u00b0C`}
                  color="text-strava"
                />
                <WeatherMetric
                  icon={Droplets}
                  label="Humidity"
                  value={`${currentWeather.humidity}%`}
                  color="text-[#60a5fa]"
                />
                <WeatherMetric
                  icon={Wind}
                  label="Wind"
                  value={`${currentWeather.windSpeed} km/h`}
                  color="text-[#a78bfa]"
                />
                <WeatherMetric
                  icon={Eye}
                  label="AQI"
                  value={String(currentWeather.aqi)}
                  color="text-success"
                />
                <WeatherMetric
                  icon={Sun}
                  label="UV Index"
                  value={String(currentWeather.uvIndex)}
                  color="text-warning"
                />
                <WeatherMetric
                  icon={Gauge}
                  label="Rain %"
                  value={`${currentWeather.rainProbability}%`}
                  color="text-[#4169E1]"
                />
              </div>

              <p className="text-[9px] text-muted-foreground/40 text-right font-mono">
                Updated {currentWeather.updatedAt}
              </p>
            </div>

            {/* Rain legend */}
            {activeLayer === "rainfall" && (
              <>
                <Separator className="bg-border/20" />
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Rain Probability
                  </p>
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-[#87CEEB] via-[#4169E1] to-[#0A1E5C] ring-1 ring-border/20" />
                  <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}

/** Mobile control bar - compact version for small screens */
export function MobileControlBar({
  activeLayer,
  onLayerChange,
  showIncidents,
  onToggleIncidents,
  onExpand,
  onLocate,
  locating,
}: {
  activeLayer: "rainfall" | "traffic";
  onLayerChange: (layer: "rainfall" | "traffic") => void;
  showIncidents: boolean;
  onToggleIncidents: (show: boolean) => void;
  onExpand: () => void;
  onLocate?: () => void;
  locating?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="absolute bottom-4 left-4 right-4 z-10 lg:hidden"
    >
      <div className="rounded-xl border border-border/30 bg-[#0c1220]/90 backdrop-blur-2xl shadow-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Layer quick-toggle buttons */}
          <button
            type="button"
            onClick={() => onLayerChange("rainfall")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeLayer === "rainfall"
                ? "bg-[#4169E1]/15 text-[#4169E1] ring-1 ring-[#4169E1]/30"
                : "bg-secondary/30 text-muted-foreground"
            }`}
          >
            <CloudRain className="h-3.5 w-3.5" />
            Rain
          </button>
          <button
            type="button"
            onClick={() => onLayerChange("traffic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeLayer === "traffic"
                ? "bg-strava/10 text-strava ring-1 ring-strava/30"
                : "bg-secondary/30 text-muted-foreground"
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            Traffic
          </button>

          <div className="flex items-center gap-1.5 ml-auto">
            <Radio className="h-3 w-3 text-muted-foreground" />
            <Switch
              checked={showIncidents}
              onCheckedChange={onToggleIncidents}
              className="scale-90"
            />
          </div>

          {onLocate && (
            <button
              type="button"
              onClick={onLocate}
              disabled={locating}
              className="p-1.5 rounded-md bg-secondary/30 text-muted-foreground hover:text-strava hover:text-foreground transition-colors disabled:opacity-70"
              aria-label="定位"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onExpand}
            className="p-1.5 rounded-md bg-secondary/30 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Expand details"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function LayerButton({
  active,
  onClick,
  icon: Icon,
  label,
  description,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  description: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all cursor-pointer ${
        active
          ? "ring-1"
          : "bg-secondary/20 ring-1 ring-transparent hover:bg-secondary/30"
      }`}
      style={
        active
          ? {
              backgroundColor: `${activeColor}12`,
              boxShadow: `inset 0 0 0 1px ${activeColor}30`,
            }
          : undefined
      }
    >
      <Icon
        className="h-4 w-4"
        style={{ color: active ? activeColor : undefined }}
      />
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-medium ${
            active ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        <p className="text-[10px] text-muted-foreground truncate">
          {description}
        </p>
      </div>
      <div
        className="h-2 w-2 rounded-full transition-all"
        style={{
          backgroundColor: active ? activeColor : "var(--muted)",
          boxShadow: active ? `0 0 8px ${activeColor}80` : "none",
        }}
      />
    </button>
  );
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-md bg-background/30 ring-1 ring-border/10 px-2.5 py-2 flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground/70 truncate">{label}</p>
        <p className="text-xs font-semibold text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}