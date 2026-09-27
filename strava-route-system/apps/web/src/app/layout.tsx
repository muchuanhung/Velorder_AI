import React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "@/app/globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://strava-sync-alpha.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Routecast｜日光地形路線判讀",
  description: "即時判讀台灣單車路線天氣與風險，出發前做出更好的決定。",
  generator: "v0.app",
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
