import { cache } from "react";
import { getPublicBriefings } from "@/lib/dashboard/get-briefing.server";
import type { VerdictLevel } from "@/lib/routes/recon-geo";
import { UnknownReasons } from "@/components/verdict/unknown-reasons";
import { cn } from "@/lib/utils";

const CHIP: Record<VerdictLevel, { word: string; className: string }> = {
  risky: { word: "危險", className: "bg-destructive text-destructive-foreground" },
  caution: { word: "注意", className: "bg-warning text-warning-foreground" },
  clear: { word: "安全", className: "bg-accent text-primary" },
  unknown: { word: "未判定", className: "bg-muted text-foreground" },
};

/** 桌機 hero 與手機版各渲染一次，同一個 request 只判讀一次 */
const getFeaturedBriefings = cache(() =>
  getPublicBriefings(3).catch((e) => {
    console.warn("精選路線判讀失敗:", e instanceof Error ? e.message : e);
    return [];
  })
);

/** 未登入入口頁：精選路線的即時判定 */
export async function FeaturedRoutes() {
  const briefings = await getFeaturedBriefings();
  if (briefings.length === 0) {
    return <p className="text-sm text-muted-foreground">目前取不到路線資料，請稍後再試。</p>;
  }

  return (
    <ul className="grid gap-3">
      {briefings.map((b) => {
        const chip = CHIP[b.verdict.level];
        const chipClass = cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-black tracking-widest", chip.className);
        return (
          <li key={b.id} className="flex items-start gap-3 rounded-xl border border-border bg-card/80 p-4 backdrop-blur">
            {b.verdict.level === "unknown" ? (
              <UnknownReasons reasons={b.verdict.reasons} className={chipClass}>
                {chip.word}
              </UnknownReasons>
            ) : (
              <span className={chipClass}>{chip.word}</span>
            )}
            <div className="min-w-0 space-y-0.5">
              <p className="font-bold leading-snug">{b.name}</p>
              <p className="text-sm">{b.verdict.headline}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {b.distanceKm.toFixed(1)} km・爬升 {b.elevationGainM} m
                {b.periodLabel && `・依 ${b.periodLabel} 預報`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
