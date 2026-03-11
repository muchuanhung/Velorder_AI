import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/global.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://strava-sync-alpha.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Routecast - Route Weather & Traffic",
  description: "運動路線 - 天氣與路況，即時預警，安全出行",
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
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="routecast-theme">
          <TooltipProvider>
            <AuthProvider>
              <LocationProvider>
                <PwaProvider>{children}</PwaProvider>
              </LocationProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
