"use client";

import { motion } from "framer-motion";
import { Zap, Wind, CloudRain, Radar, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProUpsell() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      className="relative rounded-xl border border-strava/20 bg-gradient-to-br from-strava/5 via-card/60 to-card/40 overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
          <defs>
            <pattern id="pro-dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="400" height="120" fill="url(#pro-dots)" className="text-foreground" />
        </svg>
      </div>

      <div className="relative p-4 flex items-center gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-strava/15 ring-1 ring-strava/25 shrink-0">
          <Zap className="h-6 w-6 text-strava" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-foreground">
              Unlock Pro Intelligence
            </h3>
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
            Get live wind gust forecasts, animated rain radar, and AI-powered route
            timing recommendations.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FeatureChip icon={Wind} label="Live Wind Gusts" />
            <FeatureChip icon={Radar} label="Rain Radar" />
            <FeatureChip icon={CloudRain} label="Hourly Forecast" />
          </div>
        </div>

        {/* CTA */}
        <Button
          size="sm"
          className="bg-strava hover:bg-strava/90 text-primary-foreground shrink-0 font-semibold text-xs px-4"
        >
          Upgrade
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
    </motion.div>
  );
}

function FeatureChip({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/40 rounded-full px-2 py-0.5 ring-1 ring-border/20">
      <Icon className="h-3 w-3 text-strava/70" />
      {label}
    </span>
  );
}