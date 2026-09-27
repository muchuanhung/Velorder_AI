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

/** 沿途示警：只列今天會變動的條件（天氣）；陡坡是路線固定特性，不列入 */
export function HazardSummary({ briefing }: { briefing: RouteBriefing }) {
  const { weatherHazards } = briefing;

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
    </section>
  );
}
