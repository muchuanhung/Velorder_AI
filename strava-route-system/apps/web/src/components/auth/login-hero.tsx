"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { DecorativeMapBackground } from "@/components/ui/decorative-map-background";
import { ProductLogo } from "@/components/ui/product-logo";
import { FeatureList } from "@/components/auth/feature-list";

export const loginCopy = {
  brand: "曉行 Dawnline",
  title: "出發前，整條路線一次判定。",
  subtitle: "上傳 GPX，逐公里標出走、慢、停與未判定。缺資料，不說安全。",
};

/** 桌機版左側：品牌標語、功能說明、精選路線即時判定 */
export function LoginHero({ featured }: { featured: ReactNode }) {
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
            <span className="text-2xl font-bold tracking-tight text-foreground">{loginCopy.brand}</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-foreground">{loginCopy.title}</h1>
          <p className="mt-3 text-muted-foreground">{loginCopy.subtitle}</p>
        </motion.div>

        <FeatureList className="mb-10 max-w-xl" />

        {/* 精選路線（取不到資料時整區不顯示） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-xl"
        >
          {featured}
        </motion.div>
      </div>
    </div>
  );
}
