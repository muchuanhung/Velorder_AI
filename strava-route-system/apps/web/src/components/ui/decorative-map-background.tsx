"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DecorativeMapBackgroundProps {
  className?: string;
  gradientClassName?: string;
  showGrid?: boolean;
  showPaths?: boolean;
  showDots?: boolean;
}

const PATHS = [
  {
    d: "M50,200 Q100,100 200,150 T350,200 Q300,300 200,250 T50,200",
    strokeWidth: 2,
    className: "text-primary/20",
    duration: 3,
    delay: 0,
  },
  {
    d: "M100,300 Q150,200 250,250 T400,300",
    strokeWidth: 1.5,
    className: "text-primary/15",
    duration: 2.5,
    delay: 0.5,
  },
  {
    d: "M0,100 Q50,50 150,80 T300,100",
    strokeWidth: 1,
    className: "text-primary/10",
    duration: 2,
    delay: 1,
  },
] as const;

const DOTS = [
  { cx: 200, cy: 150, r: 4, className: "fill-primary", delay: 2 },
  { cx: 250, cy: 250, r: 3, className: "fill-primary/70", delay: 2.3 },
] as const;

export function DecorativeMapBackground({
  className,
  gradientClassName = "bg-gradient-to-br from-primary/20 via-background to-background",
  showGrid = true,
  showPaths = true,
  showDots = true,
}: DecorativeMapBackgroundProps) {
  const id = useId();
  const gridPatternId = `grid-${id.replace(/:/g, "")}`;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className={cn("absolute inset-0", gradientClassName)} />
      {showGrid && (
        <svg
          className="absolute inset-0 h-full w-full opacity-5"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern
              id={gridPatternId}
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill={`url(#${gridPatternId})`} />
        </svg>
      )}
      {showPaths && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          {PATHS.map((path, i) => (
            <motion.path
              key={i}
              d={path.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={path.strokeWidth}
              className={path.className}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: path.duration,
                delay: path.delay,
                ease: "easeInOut",
              }}
            />
          ))}
          {showDots &&
            DOTS.map((dot, i) => (
              <motion.circle
                key={i}
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                className={dot.className}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: dot.delay }}
              />
            ))}
        </svg>
      )}
    </div>
  );
}
