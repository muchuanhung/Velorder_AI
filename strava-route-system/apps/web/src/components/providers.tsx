"use client";

import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * 延遲 ThemeProvider 至 client mount 後，避免 next-themes 造成的 hydration mismatch
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <TooltipProvider>
        <AuthProvider>
          <LocationProvider>
            <PwaProvider>{children}</PwaProvider>
          </LocationProvider>
        </AuthProvider>
      </TooltipProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="routecast-theme"
    >
      <TooltipProvider>
        <AuthProvider>
          <LocationProvider>
            <PwaProvider>{children}</PwaProvider>
          </LocationProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
