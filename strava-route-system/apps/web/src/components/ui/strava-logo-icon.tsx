import { cn } from "@/lib/utils";

const STRAVA_PATH =
  "M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169";

export interface StravaLogoIconProps {
  className?: string;
  size?: number;
}

export function StravaLogoIcon({ className, size = 24 }: StravaLogoIconProps) {
  return (
    <svg
      className={cn("text-primary", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      aria-hidden
    >
      <path d={STRAVA_PATH} />
    </svg>
  );
}
