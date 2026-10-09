"use client";

import { cn } from "@/lib/utils";
import type { Hazard } from "@/lib/routes/recon-geo";
import { groupRouteEvents, type RouteEvent } from "@/lib/routes/road-events";
import type { RouteEventsState } from "@/hooks/useRouteBriefing";
import { HAZARD_ROW_GRID, HazardRowContent, NoticeRowContent } from "@/components/verdict/hazard-row";

const ROW = cn(
  HAZARD_ROW_GRID,
  "cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
);

function HazardRows({
  hazards,
  positionKm,
  onJump,
}: {
  hazards: Hazard[];
  positionKm: number;
  onJump: (km: number) => void;
}) {
  return (
    <ul className="divide-y divide-border/60 border-y border-border/60">
      {hazards.map((h) => {
        const isHere = positionKm >= h.startKm && positionKm <= h.endKm;
        return (
          <li key={h.id}>
            <button
              type="button"
              onClick={() => onJump(h.startKm)}
              aria-current={isHere ? "location" : undefined}
              className={cn(ROW, isHere && "bg-muted/60")}
            >
              <HazardRowContent hazard={h} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** 不影響判定的路況（施工、壅塞、活動）：中性色，點擊一樣跳到該處 */
function NoticeRows({ events, onJump }: { events: RouteEvent[]; onJump: (km: number) => void }) {
  return (
    <ul className="divide-y divide-border/60 border-y border-border/60">
      {events.map((e) => (
        <li key={e.id}>
          <button type="button" onClick={() => onJump(e.km)} className={ROW}>
            <NoticeRowContent event={e} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function EventsStatus({ state }: { state: RouteEventsState }) {
  if (state.loading) return <p className="text-xs text-muted-foreground">路況事件載入中…</p>;
  if (state.error) return <p className="text-xs text-muted-foreground">路況事件暫時取不到，請稍後再試。</p>;
  return (
    <p className="text-xs text-muted-foreground">
      路況事件：TDX 即時道路事件，約每 10 分鐘更新
      {state.failedCounties.length > 0 && `（${state.failedCounties.join("、")}暫時取不到）`}
    </p>
  );
}

/**
 * 第 2 層：會影響判定的示警（天氣、災害、事故、管制、異常告警），依里程排序；點擊跳到該處。
 * 其下為不影響判定的沿線路況，「其他的施工」收合成一行。
 */
export function HazardList({
  hazards,
  roadEvents,
  positionKm,
  onJump,
}: {
  hazards: Hazard[];
  roadEvents?: RouteEventsState;
  positionKm: number;
  onJump: (km: number) => void;
}) {
  const { notices, routine } = groupRouteEvents(roadEvents?.events ?? []);

  return (
    <section aria-labelledby="hazard-list-title" className="space-y-2">
      <h3 id="hazard-list-title" className="text-sm font-semibold text-foreground">
        沿途示警
        {hazards.length > 0 && (
          <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">{hazards.length}</span>
        )}
      </h3>

      {hazards.length === 0 ? (
        <p className="text-sm text-muted-foreground">沿途沒有示警</p>
      ) : (
        <HazardRows hazards={hazards} positionKm={positionKm} onJump={onJump} />
      )}

      {notices.length > 0 && (
        <div className="space-y-2 pt-3">
          <h4 className="text-sm font-semibold text-foreground">
            沿線路況
            <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">{notices.length}</span>
          </h4>
          <NoticeRows events={notices} onJump={onJump} />
        </div>
      )}

      {routine.length > 0 && (
        <details className="group pt-1">
          <summary className="cursor-pointer py-1.5 text-sm text-muted-foreground">
            沿線 {routine.length} 處其他施工（多為道路維護）
            <span className="ml-1 text-primary group-open:hidden">展開</span>
          </summary>
          <NoticeRows events={routine} onJump={onJump} />
        </details>
      )}

      {roadEvents && <EventsStatus state={roadEvents} />}
    </section>
  );
}
