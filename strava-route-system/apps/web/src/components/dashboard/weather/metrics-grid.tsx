"use client";

import React from "react"

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

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Metric
        icon={<Wind className="h-4 w-4" />}
        label="Wind"
        value="18"
        unit="km/h"
      />
      <Metric
        icon={<Droplets className="h-4 w-4" />}
        label="Humidity"
        value="62"
        unit="%"
      />
      <Metric
        icon={<Sun className="h-4 w-4" />}
        label="UV Index"
        value="4"
        unit="mod"
      />
      <Metric
        icon={<Sunset className="h-4 w-4" />}
        label="Sunset"
        value="6:48"
        unit="PM"
      />
    </div>
  );
}