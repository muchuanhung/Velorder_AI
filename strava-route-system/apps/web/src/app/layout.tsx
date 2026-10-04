import React from "react";
import type { Metadata } from "next";
import { Chivo_Mono, Noto_Sans_TC } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import "@/global.css";

// 中文字型檔很大，不預載；由 next/font 自架並依 unicode-range 分段載入
const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-tc",
  display: "swap",
  preload: false,
});
// 里程、海拔等數據用等寬字
const chivoMono = Chivo_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-chivo-mono",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dawnline-tw.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "曉行", template: "%s｜曉行" },
  description: "上傳 GPX，逐公里判定台灣路線的天氣與路況：走、慢、停、未判定。缺資料，不說安全。",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "曉行",
    capable: true,
    statusBarStyle: "default",
  },
  openGraph: {
    title: "曉行 Dawnline｜出發前，整條路線一次判定",
    description: "上傳 GPX，逐公里判定台灣路線的天氣與路況：走、慢、停、未判定。缺資料，不說安全。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={cn(notoSansTC.variable, chivoMono.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
