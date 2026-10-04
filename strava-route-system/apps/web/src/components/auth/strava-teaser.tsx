"use client";

import { motion } from "framer-motion";
import { Route, CloudSun, HelpCircle } from "lucide-react";
import { DecorativeMapBackground } from "@/components/ui/decorative-map-background";
import { ProductLogo } from "@/components/ui/product-logo";

export const loginHero = {
  brand: "曉行 Dawnline",
  title: "出發前，整條路線一次判定。",
  subtitle: "上傳 GPX，逐公里標出走、慢、停與未判定。缺資料，不說安全。",
};

const features = [
  {
    icon: Route,
    title: "逐公里判定",
    description: "沿 GPX 軌跡逐段標出走、慢、停，一眼看出哪一段要注意。",
  },
  {
    icon: CloudSun,
    title: "天氣與路況一起看",
    description: "交通部中央氣象署鄉鎮預報與雨量，加上 TDX 路況事件。",
  },
  {
    icon: HelpCircle,
    title: "缺資料標未判定",
    description: "資料不足，無法判定，不代表安全。",
  },
];

export function StravaTeaser() {
  return (
    <div className="relative flex h-full flex-col justify-center p-12">
      <DecorativeMapBackground />

      <div className="relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="mb-6 flex items-center gap-3">
            <ProductLogo size={48} />
            <span className="text-2xl font-bold tracking-tight text-foreground">{loginHero.brand}</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-foreground">{loginHero.title}</h1>
          <p className="mt-3 text-muted-foreground">{loginHero.subtitle}</p>
        </motion.div>

        {/* Features */}
        <div className="space-y-4">
          {features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FeatureIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-medium text-foreground">{feature.title}</h2>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
