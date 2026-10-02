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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://strava-sync-alpha.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Routecast｜日光地形路線判讀",
  description: "出發前判讀台灣單車、跑步與越野路線的天氣與路況風險。",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Routecast",
    capable: true,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
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
