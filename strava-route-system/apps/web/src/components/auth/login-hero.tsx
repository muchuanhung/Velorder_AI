"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ProductLogo } from "@/components/ui/product-logo";
import { FeatureList } from "@/components/auth/feature-list";

export const loginCopy = {
  brand: "曉行 Dawnline",
  // 一行：手機 360px 也不換行；整合哪些資料交給下方功能說明
  title: "好天氣出發，壞路況繞開",
};

/** 桌機版左側：品牌標語、功能說明、精選路線即時判定（背景由 LoginView 的滿版動畫提供，文字加光暈維持可讀性） */
export function LoginHero({ featured }: { featured: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-12 py-8">
      <div className="w-full max-w-xl [text-shadow:0_0_2px_rgb(244_246_238/0.9),0_0_16px_rgb(244_246_238/0.85),0_0_30px_rgb(244_246_238/0.6)] dark:[text-shadow:0_0_2px_rgb(8_20_12/0.9),0_0_16px_rgb(8_20_12/0.8)]">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="mb-5 flex items-center gap-3">
            <ProductLogo size={48} />
            <span className="text-2xl font-bold tracking-tight text-foreground">{loginCopy.brand}</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-foreground">{loginCopy.title}</h1>
        </motion.div>

        <FeatureList className="mb-8" />

        {/* 精選路線（取不到資料時整區不顯示） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="[text-shadow:none]"
        >
          {featured}
        </motion.div>
      </div>
    </div>
  );
}
