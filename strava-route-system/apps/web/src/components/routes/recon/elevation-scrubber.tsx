"use client";

import { useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import type { ChartDataPoint, Hazard, RouteStage } from "@/lib/routes/recon-geo";
import { rainLevel, windLevel } from "@/lib/routes/recon-geo";

// 非警示資訊一律低飽和；只有危險色帶用警示色
const LINE_COLOR = "var(--muted-foreground)";
const CURSOR_COLOR = "var(--foreground)";
const HAZARD_FILL = { risky: "var(--destructive)", caution: "var(--warning)" } as const;

function levelClass(level: "caution" | "risky" | null): string {
  if (level === "risky") return "text-destructive font-semibold";
  if (level === "caution") return "text-foreground font-semibold";
  return "text-foreground";
}

/** 第 3 層：可拖曳的高程圖；游標處的海拔與天氣直接顯示在圖上方 */
export function ElevationScrubber({
  data,
  hazards,
  positionKm,
  totalKm,
  elevation,
  peakElevation,
  stage,
  onScrub,
}: {
  data: ChartDataPoint[];
  hazards: Hazard[];
  positionKm: number;
  totalKm: number;
  elevation: number;
  peakElevation: number;
  stage: RouteStage | null;
  onScrub: (km: number) => void;
}) {
  const handleScrub = useCallback(
    (state: { activePayload?: Array<{ payload: ChartDataPoint }> }) => {
      const p = state?.activePayload?.[0]?.payload;
      if (p) onScrub(p.km);
    },
    [onScrub]
  );

  const hasWeather = stage?.hasWeather ?? false;
  const rain = hasWeather && stage ? rainLevel(stage.rainProbability) : null;
  const wind = hasWeather && stage ? windLevel(stage.windSpeed) : null;
  // 約 100 格，取到 0.1 km
  const step = Math.max(0.1, Math.round(totalKm / 10) / 10);

  return (
    <section aria-label="海拔與位置" className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-mono text-sm tabular-nums">
          <span className="font-semibold text-foreground">{positionKm.toFixed(1)} km</span>
          <span className="text-muted-foreground"> · 海拔 </span>
          <span className="text-foreground">{Math.round(elevation)} m</span>
          {stage && <span className="text-muted-foreground"> · {stage.name}</span>}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">最高 {Math.round(peakElevation)} m</p>
      </div>

      <p className="font-mono text-sm tabular-nums text-muted-foreground">
        {hasWeather && stage ? (
          <>
            <span className="text-foreground">{stage.temperature}°C</span>
            <span> · 風 </span>
            <span className={cn(levelClass(wind))}>{stage.windSpeed} km/h</span>
            <span> · 雨 </span>
            <span className={cn(levelClass(rain))}>{stage.rainProbability}%</span>
          </>
        ) : (
          "此處無天氣資料"
        )}
      </p>

      <div className="h-44 w-full min-w-0 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            onMouseMove={handleScrub}
            onClick={handleScrub}
            {...({ onTouchMove: handleScrub } as Record<string, unknown>)}
          >
            <XAxis
              dataKey="km"
              type="number"
              domain={[0, "dataMax"]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: number) => `${v.toFixed(0)} km`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: number) => `${v.toFixed(0)} m`}
              width={48}
            />
            {hazards.map((h) => (
              <ReferenceArea
                key={h.id}
                x1={h.startKm}
                x2={h.endKm}
                fill={HAZARD_FILL[h.level]}
                fillOpacity={0.18}
                strokeOpacity={0}
                ifOverflow="hidden"
              />
            ))}
            {/* 只為了取得 activePayload，不顯示浮動框 */}
            <Tooltip content={() => null} cursor={false} />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke={LINE_COLOR}
              strokeWidth={1.5}
              fill={LINE_COLOR}
              fillOpacity={0.12}
              isAnimationActive={false}
            />
            <ReferenceLine x={positionKm} stroke={CURSOR_COLOR} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 鍵盤與螢幕閱讀器用：左右鍵移動位置 */}
      <label className="sr-only" htmlFor="recon-position">
        目前位置（km）
      </label>
      <input
        id="recon-position"
        type="range"
        min={0}
        max={totalKm}
        step={step}
        value={positionKm}
        onChange={(e) => onScrub(Number(e.target.value))}
        className="sr-only focus:not-sr-only focus:w-full"
      />
    </section>
  );
}
