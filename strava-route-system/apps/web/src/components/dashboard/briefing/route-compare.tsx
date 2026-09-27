import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { RouteBriefing } from "@/lib/dashboard/briefing";

const WORD = { clear: "安全", caution: "注意", risky: "危險", unknown: "未判定" } as const;

/** 替代路線：只有找到「更安全」的路線才出現，點下去即切換判讀 */
export function RouteCompare({ alternative }: { alternative: RouteBriefing }) {
  const { verdict } = alternative;
  return (
    <section aria-labelledby="alt-title" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 id="alt-title" className="text-sm font-bold text-muted-foreground">
        較安全的替代路線
      </h2>
      <Link
        href={`/dashboard?route=${encodeURIComponent(alternative.id)}`}
        className="group mt-3 flex items-center gap-4 rounded-xl outline-offset-4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold group-hover:underline">{alternative.name}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{WORD[verdict.level]}</span>
            {verdict.level === "clear" ? "・沿途沒有天氣示警" : `・${verdict.headline}`}
            <span className="font-mono">・{alternative.distanceKm.toFixed(1)} km</span>
          </p>
        </div>
        <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  );
}
