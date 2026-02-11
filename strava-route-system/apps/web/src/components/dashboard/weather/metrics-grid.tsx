"use client";

import React from "react";

import { Wind, Droplets, Sun, Sunset } from "lucide-react";

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}

function Metric({ icon, label, value, unit }: MetricProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg bg-background/40 p-3">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}

interface MetricsGridProps {
  windKmh?: number;
  humidity?: number;
  uvIndex?: number;
  uvLevel?: string;
  sunset?: string;
}

export function MetricsGrid({
  windKmh = 0,
  humidity = 0,
  uvIndex = 0,
  uvLevel,
  sunset = "—",
}: MetricsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Metric
        icon={<Wind className="h-4 w-4" />}
        label="風速"
        value={String(windKmh)}
        unit="km/h"
      />
      <Metric
        icon={<Droplets className="h-4 w-4" />}
        label="濕度"
        value={String(humidity)}
        unit="%"
      />
      <Metric
        icon={<Sun className="h-4 w-4" />}
        label="紫外線"
        value={String(uvIndex)}
        unit={uvLevel ?? "—"}
      />
      <Metric
        icon={<Sunset className="h-4 w-4" />}
        label="日落"
        value={sunset}
        unit=""
      />
    </div>
  );
}