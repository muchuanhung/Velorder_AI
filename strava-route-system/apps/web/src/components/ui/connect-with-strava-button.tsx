"use client";

import { cn } from "@/lib/utils";

/**
 * 官方「Connect with Strava」橙色按鈕，符合 Strava API 品牌規範。
 * 用於 OAuth 授權流程，必須連結至 https://www.strava.com/oauth/authorize
 * @see https://strava.github.io/api/v3/guidelines/
 */
export interface ConnectWithStravaButtonProps {
  href: string;
  className?: string;
  /** 按鈕高度，官方規範 48px @1x */
  height?: number;
}

export function ConnectWithStravaButton({
  href,
  className,
  height = 48,
}: ConnectWithStravaButtonProps) {
  return (
    <a
      href={href}
      className={cn("inline-block shrink-0", className)}
      style={{ height }}
      aria-label="Connect with Strava"
    >
      <img
        src="/connect-with-strava.svg"
        alt="Connect with Strava"
        width={180}
        height={48}
        className="h-full w-auto object-contain object-left"
      />
    </a>
  );
}
