"use client";

import React from "react"

import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy";

interface WeatherHeroProps {
  temperature: number;
  condition: WeatherCondition;
  description: string;
  feelsLike: number;
  verdict: string;
  verdictType: "good" | "caution" | "bad";
}

const conditionIconMap = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  snowy: CloudSnow,
} as const;

/** 依 condition 回傳對應 icon，可傳入 className 調整大小 */
export function getConditionIcon(
  condition: WeatherCondition,
  className = "h-12 w-12"
): React.ReactNode {
  const Icon = conditionIconMap[condition] ?? Cloud;
  return <Icon className={className} />;
}

const conditionLabels: Record<WeatherCondition, string> = {
  sunny: "晴",
  cloudy: "多雲",
  rainy: "降雨",
  stormy: "雷雨",
  snowy: "降雪",
};

const verdictColors: Record<string, string> = {
  good: "text-strava",
  caution: "text-warning",
  bad: "text-destructive",
};

export function WeatherHero({
  temperature,
  condition,
  description,
  feelsLike,
  verdict,
  verdictType,
}: WeatherHeroProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-bold tracking-tighter text-foreground">
            {temperature}
          </span>
          <span className="text-2xl font-light text-muted-foreground mb-1">
            {"°C"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {conditionLabels[condition]}
          </span>
          <span className={cn("text-sm font-medium", verdictColors[verdictType])}>
            {verdict}
          </span>
        </div>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background/40 text-muted-foreground">
        {getConditionIcon(condition)}
      </div>
    </div>
  );
}