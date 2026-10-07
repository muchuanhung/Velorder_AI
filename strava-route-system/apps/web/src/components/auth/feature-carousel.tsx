"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Route, CloudSun, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

const AUTOPLAY_MS = 5000;

/** 功能說明小卡：一次一則，下方圓點切換；自動輪播，使用者點過圓點或偏好減少動態時停止 */
export function FeatureCarousel({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!autoplay || reduceMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % features.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplay, reduceMotion]);

  const feature = features[index] ?? features[0]!;
  const FeatureIcon = feature.icon;

  return (
    <div className={cn("space-y-3", className)} aria-roledescription="carousel" aria-label="功能說明">
      <div className="relative min-h-[4.5rem]" aria-live={autoplay ? "off" : "polite"}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : -12 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <FeatureIcon className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div>
              <h2 className="font-medium text-foreground">{feature.title}</h2>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-1">
        {features.map((f, i) => (
          <button
            key={f.title}
            type="button"
            aria-label={`第 ${i + 1} 則：${f.title}`}
            aria-current={i === index}
            onClick={() => {
              setIndex(i);
              setAutoplay(false);
            }}
            className="flex size-6 items-center justify-center rounded-full"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
