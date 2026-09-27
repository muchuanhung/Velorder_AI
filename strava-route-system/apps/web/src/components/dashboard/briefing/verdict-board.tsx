import { AlertTriangle, HelpCircle, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerdictLevel } from "@/lib/routes/recon-geo";
import type { RouteBriefing } from "@/lib/dashboard/briefing";

/** 判定板的顏色跟著狀態走：危險紅、注意琥珀；安全與未判定用中性底，絕不用品牌綠表示危險 */
const LEVEL: Record<VerdictLevel, { word: string; advice: string; icon: LucideIcon; box: string; muted: string }> = {
  risky: {
    word: "危險",
    advice: "建議改期，或改走替代路線。",
    icon: ShieldAlert,
    box: "bg-destructive text-destructive-foreground",
    muted: "text-destructive-foreground/85",
  },
  caution: {
    word: "注意",
    advice: "可以出發，留意下列路段。",
    icon: AlertTriangle,
    box: "bg-warning text-warning-foreground",
    muted: "text-warning-foreground/85",
  },
  clear: {
    word: "安全",
    advice: "沿途沒有天氣示警，適合出發。",
    icon: ShieldCheck,
    box: "border border-border bg-card text-card-foreground",
    muted: "text-muted-foreground",
  },
  unknown: {
    word: "未判定",
    advice: "目前拿不到這條路線的天氣資料，無法判斷風險。",
    icon: HelpCircle,
    box: "bg-muted text-foreground",
    muted: "text-muted-foreground",
  },
};

export function VerdictBoard({ briefing }: { briefing: RouteBriefing }) {
  const { verdict } = briefing;
  const s = LEVEL[verdict.level];
  const Icon = s.icon;
  const hasHazard = verdict.level === "risky" || verdict.level === "caution";

  return (
    <section
      aria-labelledby="verdict-title"
      className={cn(
        "flex flex-col gap-6 rounded-2xl p-6 shadow-[0_14px_30px_-18px_rgb(31_43_32/0.45)] sm:flex-row sm:items-end sm:justify-between sm:p-8",
        s.box
      )}
    >
      <div className="min-w-0 space-y-3">
        <p className={cn("flex items-center gap-2 text-sm font-semibold", s.muted)}>
          <Icon className="size-5 shrink-0" aria-hidden />
          {briefing.name}
        </p>
        <h2 id="verdict-title" className="text-6xl font-black leading-none tracking-tight sm:text-7xl">
          {s.word}
        </h2>
        {hasHazard ? (
          <>
            <p className="text-lg font-bold sm:text-xl">{verdict.headline}</p>
            <p className={cn("text-sm", s.muted)}>
              {s.advice}
              {verdict.note && `・${verdict.note}`}
            </p>
          </>
        ) : (
          <p className="text-base font-medium sm:text-lg">{s.advice}</p>
        )}
      </div>

      <div className="space-y-2 sm:text-right">
        <dl className="grid grid-cols-3 gap-x-6">
          <Stat label="氣溫" labelClass={s.muted} value={briefing.temperature ? tempRange(briefing.temperature) : "—"} />
          <Stat label="最高降雨" labelClass={s.muted} value={briefing.maxRain != null ? `${briefing.maxRain}%` : "—"} />
          <Stat
            label="最大風速"
            labelClass={s.muted}
            value={briefing.maxWindKmh != null ? `${briefing.maxWindKmh}` : "—"}
            unit="km/h"
          />
        </dl>
        {briefing.periodLabel && <p className={cn("text-xs", s.muted)}>依 {briefing.periodLabel} 預報・中央氣象署</p>}
      </div>
    </section>
  );
}

const tempRange = ({ min, max }: { min: number; max: number }) => (min === max ? `${min}°` : `${min}–${max}°`);

function Stat({ label, labelClass, value, unit }: { label: string; labelClass: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className={cn("text-xs", labelClass)}>{label}</dt>
      <dd className="font-mono text-2xl font-semibold">
        {value}
        {unit && value !== "—" && <span className="ml-0.5 text-xs font-normal">{unit}</span>}
      </dd>
    </div>
  );
}
