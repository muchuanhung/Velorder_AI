"use client";

import React from "react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { dot: "h-2 w-2", gap: "gap-1" },
  md: { dot: "h-4 w-4", gap: "gap-2" },
  lg: { dot: "h-8 w-8", gap: "gap-4" },
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizeMap;
  className?: string;
  dotClassName?: string;
}

const Spinner = React.memo(function Spinner({
  size = "md",
  className,
  dotClassName = "bg-primary/80",
}: SpinnerProps) {
  const { dot, gap } = sizeMap[size];
  const dotClass = cn("loading-animate flex-shrink-0 rounded-full", dot, dotClassName);
  return (
    <div className={cn("inline-flex items-center", gap, className)}>
      <div className={cn(dotClass, "loading-animate-delay-1")} />
      <div className={cn(dotClass, "loading-animate-delay-2")} />
      <div className={dotClass} />
    </div>
  );
});

export default Spinner;
