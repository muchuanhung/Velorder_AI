"use client";

import { cn } from "@/lib/utils";

/**
 * 「Powered by Strava」標示，符合 Strava API 品牌規範。
 * 必須顯示於呈現跑步里程或地圖的頁面。
 * @see https://strava.github.io/api/v3/guidelines/
 */
export interface PoweredByStravaProps {
  className?: string;
  /** 顯示樣式：compact 僅文字，default 含 logo */
  variant?: "default" | "compact";
}

export function PoweredByStrava({ className, variant = "default" }: PoweredByStravaProps) {
  if (variant === "compact") {
    return (
      <a
        href="https://www.strava.com"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-xs text-muted-foreground hover:text-strava transition-colors",
          className
        )}
      >
        Powered by Strava
      </a>
    );
  }

  return (
    <a
      href="https://www.strava.com"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-strava transition-colors",
        className
      )}
    >
      <StravaLogoMini />
      <span>Powered by Strava</span>
    </a>
  );
}

function StravaLogoMini() {
  const path =
    "M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}
