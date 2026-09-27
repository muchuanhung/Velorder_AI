import { cn } from "@/lib/utils";
import type { HazardLevel } from "@/lib/routes/recon-geo";

const STYLE: Record<HazardLevel, { word: string; className: string }> = {
  risky: { word: "危險", className: "bg-destructive text-destructive-foreground" },
  caution: { word: "注意", className: "bg-warning text-warning-foreground" },
};

/** 示警等級章：狀態色＋文字，不只靠顏色辨識 */
export function LevelBadge({ level, className }: { level: HazardLevel; className?: string }) {
  const s = STYLE[level];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-black tracking-widest",
        s.className,
        className
      )}
    >
      {s.word}
    </span>
  );
}
