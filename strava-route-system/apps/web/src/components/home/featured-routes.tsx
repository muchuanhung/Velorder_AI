import { cache } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

/**
 * 未登入入口頁：精選路線的即時判定，點卡片進 /routes 看逐段判定（公開頁，不用登入）。
 * 取不到資料時整區不顯示，入口頁不放錯誤訊息。
 */
export async function FeaturedRoutes() {
  const briefings = await getFeaturedBriefings();
  if (briefings.length === 0) return null;

  return (
    <section aria-label="精選路線即時判定" className="space-y-3">
      <h2 className="text-base font-bold text-foreground lg:text-lg">精選路線・即時判定</h2>
      <ul className="grid gap-3">
        {briefings.map((b) => {
          const chip = CHIP[b.verdict.level];
          // chip 疊在整張卡的連結上方，未判定的 Popover 才點得到
          const chipClass = cn(
            "relative z-10 shrink-0 rounded-md px-2 py-0.5 text-xs font-black tracking-widest",
            chip.className
          );
          return (
            <li
              key={b.id}
              className="group relative flex items-start gap-3 rounded-xl border border-border bg-card/80 p-4 backdrop-blur transition-colors focus-within:border-primary hover:border-primary/60"
            >
              {b.verdict.level === "unknown" ? (
                <UnknownReasons reasons={b.verdict.reasons} className={chipClass}>
                  {chip.word}
                </UnknownReasons>
              ) : (
                <span className={chipClass}>{chip.word}</span>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <Link
                  href={`/routes?route=${encodeURIComponent(b.id)}`}
                  className="font-bold leading-snug outline-none after:absolute after:inset-0 after:rounded-xl group-hover:underline"
                >
                  {b.name}
                </Link>
                <p className="text-sm">{b.verdict.headline}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {b.distanceKm.toFixed(1)} km・爬升 {b.elevationGainM} m
                  {b.periodLabel && `・依 ${b.periodLabel} 預報`}
                </p>
              </div>
              <ChevronRight
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
