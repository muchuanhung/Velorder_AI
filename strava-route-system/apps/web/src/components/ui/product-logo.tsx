import { cn } from "@/lib/utils";

export interface ProductLogoProps {
  className?: string;
  size?: number;
}

export function ProductLogo({ className, size = 40 }: ProductLogoProps) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-lg", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/strava-sync.svg"
        alt="StravaSync"
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  );
}
