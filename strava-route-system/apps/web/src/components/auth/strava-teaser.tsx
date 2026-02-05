"use client";

import { motion } from "framer-motion";
import { Zap, Activity, MapPin, TrendingUp } from "lucide-react";
import { DecorativeMapBackground } from "@/components/ui/decorative-map-background";
import { StravaLogoIcon } from "@/components/ui/strava-logo-icon";

const teaserConfig = {
  hero: {
    icon: Activity,
    title: "StravaSync",
    subtitle: "您的Strava數據，精彩呈現在您的眼前",
  },
  connectCard: {
    title: "Connect with Strava",
    description: "自動同步您的活動數據",
    badgeText: "透過 Inngest 背景同步處理",
  },
  features: [
    {
      icon: Activity,
      title: "Auto-sync Activities",
      description: "您的跑步、騎行和游泳活動自動同步",
    },
    {
      icon: MapPin,
      title: "GPS Track Visualization",
      description: "GPS軌跡視覺化",
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "表現分析",
    },
    {
      icon: Zap,
      title: "Powered by Inngest",
      description: "可靠的背景同步處理",
    },
  ],
  stats: [
    { value: "2,847", label: "km tracked" },
    { value: "48.2k", label: "elevation (m)" },
    { value: "312", label: "activities" },
  ],
};

export function StravaTeaser() {
  const HeroIcon = teaserConfig.hero.icon;
  return (
    <div className="relative flex h-full flex-col justify-center p-12">
      <DecorativeMapBackground />

      <div className="relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <HeroIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {teaserConfig.hero.title}
            </span>
          </div>
          <p className="text-muted-foreground">{teaserConfig.hero.subtitle}</p>
        </motion.div>

        {/* Connect Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center gap-3">
            <StravaLogoIcon size={32} />
            <div>
              <h3 className="font-semibold text-foreground">
                {teaserConfig.connectCard.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {teaserConfig.connectCard.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>{teaserConfig.connectCard.badgeText}</span>
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-4">
          {teaserConfig.features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FeatureIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          {teaserConfig.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}