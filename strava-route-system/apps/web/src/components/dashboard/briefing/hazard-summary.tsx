import type { Hazard } from "@/lib/routes/recon-geo";
import type { RouteBriefing } from "@/lib/dashboard/briefing";
import { CATEGORY_LABEL, groupRouteEvents, type RouteEvent } from "@/lib/routes/road-events";
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

function NoticeList({ events }: { events: RouteEvent[] }) {
  return (
    <ul className="divide-y divide-border text-sm">
      {events.map((e) => (
        <li key={e.id} className="flex items-center gap-3 py-2">
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
            {CATEGORY_LABEL[e.category]}
          </span>
          <span className="min-w-0 flex-1 truncate">{e.description || e.title}</span>
          <span className="shrink-0 font-mono text-muted-foreground">{e.km.toFixed(1)} km</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 沿途示警：影響判定的條件（天氣、災害、事故、管制、異常告警）在上；
 * 施工、壅塞等只列出不影響判定，「其他的施工」收合成一行（原生 details，不需客戶端 JS）。
 * 陡坡是路線固定特性，不列入。
 */
export function HazardSummary({ briefing }: { briefing: RouteBriefing }) {
  const { hazards } = briefing;
  const { notices, routine } = groupRouteEvents(briefing.roadEvents);

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

      <ProfileStrip profile={briefing.elevationProfile} distanceKm={briefing.distanceKm} hazards={hazards} />

      {hazards.length > 0 ? (
        <HazardList hazards={hazards} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {briefing.verdict.level === "unknown" ? "沒有天氣資料，無法判讀。" : "沿途沒有示警。"}
        </p>
      )}

      {notices.length > 0 && (
        <div className="space-y-1 border-t border-border pt-4">
          <h3 className="text-sm font-bold">沿線路況・{notices.length}</h3>
          <p className="text-xs text-muted-foreground">施工、壅塞等不列入今日判讀。</p>
          <NoticeList events={notices} />
        </div>
      )}

      {routine.length > 0 && (
        <details className="group border-t border-border pt-3">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            沿線 {routine.length} 處其他施工（多為道路維護）
            <span className="ml-1 text-primary group-open:hidden">展開</span>
          </summary>
          <NoticeList events={routine} />
        </details>
      )}
    </section>
  );
}
