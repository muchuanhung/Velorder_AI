"use client";

import React from "react"

import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";

type WeatherCondition = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy";

interface WeatherHeroProps {
  temperature: number;
  condition: WeatherCondition;
  feelsLike: number;
  verdict: string;
  verdictType: "good" | "caution" | "bad";
}

const conditionIcons: Record<WeatherCondition, React.ReactNode> = {
  sunny: <Sun className="h-12 w-12" />,
  cloudy: <Cloud className="h-12 w-12" />,
  rainy: <CloudRain className="h-12 w-12" />,
  stormy: <CloudLightning className="h-12 w-12" />,
  snowy: <CloudSnow className="h-12 w-12" />,
};

const conditionLabels: Record<WeatherCondition, string> = {
  sunny: "Sunny",
  cloudy: "Partly Cloudy",
  rainy: "Light Rain",
  stormy: "Thunderstorms",
  snowy: "Snow",
};

const verdictColors: Record<string, string> = {
  good: "text-strava",
  caution: "text-warning",
  bad: "text-destructive",
};

export function WeatherHero({
  temperature,
  condition,
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
        <p className="text-sm text-muted-foreground">
          {conditionLabels[condition]} · Feels like {feelsLike}{"°"}
        </p>
        <p className={cn("text-sm font-medium mt-1", verdictColors[verdictType])}>
          {verdict}
        </p>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background/40 text-muted-foreground">
        {conditionIcons[condition]}
      </div>
    </div>
  );
}