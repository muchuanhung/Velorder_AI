import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth/server";
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

/** 已登入直接進今日判讀；未登入看精選路線的即時判定 */
export default async function HomePage() {
  if (await getCurrentUserId()) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:py-16">
      <header className="space-y-3">
        <p className="text-sm font-bold text-primary">曉行</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">現在出發適合嗎？</h1>
        <p className="text-muted-foreground">
          依中央氣象署預報與即時路況，逐段判讀你的自行車路線。資料不足時標「未判定」，不會當成安全。
        </p>
      </header>

      <section aria-labelledby="featured-title" className="space-y-3">
        <h2 id="featured-title" className="text-lg font-bold">
          精選路線・即時判定
        </h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">判讀中…</p>}>
          <FeaturedRoutes />
        </Suspense>
      </section>

      <Link
        href="/login"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-5 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        登入，判讀你自己的路線
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </main>
  );
}

async function FeaturedRoutes() {
  const briefings = await getPublicBriefings(3).catch((e) => {
    console.warn("精選路線判讀失敗:", e instanceof Error ? e.message : e);
    return [];
  });
  if (briefings.length === 0) {
    return <p className="text-sm text-muted-foreground">目前取不到路線資料，請稍後再試。</p>;
  }

  return (
    <ul className="grid gap-3">
      {briefings.map((b) => {
        const chip = CHIP[b.verdict.level];
        const chipClass = cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-black tracking-widest", chip.className);
        return (
          <li key={b.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
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
