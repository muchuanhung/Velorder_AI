import type { Hazard } from "@/lib/routes/recon-geo";
import type { RouteBriefing } from "@/lib/dashboard/briefing";
import { LevelBadge } from "./level-badge";
import { ProfileStrip } from "./profile-strip";

const kmRange = (h: Hazard) =>
  h.endKm - h.startKm < 0.1 ? `${h.startKm.toFixed(1)} km` : `${h.startKm.toFixed(1)}–${h.endKm.toFixed(1)} km`;

function HazardList({ hazards }: { hazards: Hazard[] }) {
  return (
    <ul className="divide-y divide-border">
      {hazards.map((h) => (
        <li key={h.id} className="flex items-center gap-3 py-2.5">
          <LevelBadge level={h.level} />
          <span className="min-w-0 flex-1 font-medium">{h.label}</span>
          <span className="shrink-0 font-mono text-sm text-muted-foreground">{kmRange(h)}</span>
        </li>
      ))}
    </ul>
  );
}

const TOP_TRAITS = 3;
// Hazard 沒有保留數值，坡度從標籤（「陡升 12%」）取出
const gradeOf = (h: Hazard) => Number(h.label.match(/\d+/)?.[0] ?? 0);

/** 路線特性：只露出最陡的幾段，其餘收合（原生 details，不需客戶端 JS） */
function GradeTraits({ hazards }: { hazards: Hazard[] }) {
  const ranked = [...hazards].sort((a, b) => gradeOf(b) - gradeOf(a) || a.startKm - b.startKm);
  const top = ranked.slice(0, TOP_TRAITS).sort((a, b) => a.startKm - b.startKm);
  const rest = hazards.filter((h) => !top.includes(h));

  return (
    <div className="space-y-1 border-t border-border pt-4">
      <h3 className="text-sm font-bold">路線特性・{hazards.length} 段陡坡</h3>
      <p className="text-xs text-muted-foreground">陡坡不隨天氣變化，不列入今日判讀。以下為最陡的路段。</p>
      <HazardList hazards={top} />
      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer py-2 text-sm font-medium text-primary">
            <span className="group-open:hidden">顯示其餘 {rest.length} 段</span>
            <span className="hidden group-open:inline">收合</span>
          </summary>
          <HazardList hazards={rest} />
        </details>
      )}
    </div>
  );
}

/** 沿途示警：今日天氣示警在上；陡坡屬路線特性，另列、不影響判讀 */
export function HazardSummary({ briefing }: { briefing: RouteBriefing }) {
  const { weatherHazards, gradeHazards } = briefing;

  return (
    <section aria-labelledby="hazard-title" className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="hazard-title" className="text-lg font-bold">
          沿途示警
        </h2>
        <p className="font-mono text-sm text-muted-foreground">
          {briefing.distanceKm.toFixed(1)} km・爬升 {briefing.elevationGainM} m
        </p>
      </div>

      <ProfileStrip profile={briefing.elevationProfile} distanceKm={briefing.distanceKm} hazards={weatherHazards} />

      {weatherHazards.length > 0 ? (
        <HazardList hazards={weatherHazards} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {briefing.verdict.level === "unknown" ? "沒有天氣資料，無法列出天氣示警。" : "沿途沒有天氣示警。"}
        </p>
      )}

      {gradeHazards.length > 0 && <GradeTraits hazards={gradeHazards} />}
    </section>
  );
}
