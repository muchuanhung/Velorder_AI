"use client";

import type { LucideIcon } from "lucide-react";

interface WeatherMetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}

/** 單一氣象指標（compact 佈局，用於地圖 control panel 等） */
export function WeatherMetric({
  icon: Icon,
  label,
  value,
  color,
}: WeatherMetricProps) {
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
