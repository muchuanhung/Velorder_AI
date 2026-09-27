"use client";

import { CloudRain, Wind, CloudLightning, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Hazard, HazardKind } from "@/lib/routes/recon-geo";

const KIND_ICON: Record<HazardKind, React.ComponentType<{ className?: string }>> = {
  rain: CloudRain,
  wind: Wind,
  storm: CloudLightning,
  climb: TrendingUp,
  descent: TrendingDown,
};

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
        const Icon = KIND_ICON[h.kind];
        const isHere = positionKm >= h.startKm && positionKm <= h.endKm;
        const risky = h.level === "risky";
        return (
          <li key={h.id}>
            <button
              type="button"
              onClick={() => onJump(h.startKm)}
              aria-current={isHere ? "location" : undefined}
              className={cn(
                "grid w-full grid-cols-[4px_4.5rem_1fr] items-center gap-3 py-2.5 pr-2 text-left transition-colors cursor-pointer",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isHere && "bg-muted/60"
              )}
            >
              <span
                className={cn("h-full min-h-6 rounded-full", risky ? "bg-destructive" : "bg-warning")}
                aria-hidden
              />
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {h.startKm.toFixed(1)} km
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <Icon className={cn("h-4 w-4 shrink-0", risky ? "text-destructive" : "text-warning-strong")} />
                <span className={cn("truncate text-sm font-medium", risky ? "text-destructive" : "text-foreground")}>
                  {h.label}
                </span>
                <span className="sr-only">{risky ? "危險" : "注意"}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 第 2 層：天氣示警（決定判定），依里程排序；點擊跳到該處。
 * 陡坡是路線特性，另列在下方、不影響判定，與 Dashboard 一致。
 */
export function HazardList({
  hazards,
  traits = [],
  positionKm,
  onJump,
}: {
  hazards: Hazard[];
  traits?: Hazard[];
  positionKm: number;
  onJump: (km: number) => void;
}) {
  return (
    <section aria-labelledby="hazard-list-title" className="space-y-2">
      <h3 id="hazard-list-title" className="text-sm font-semibold text-foreground">
        沿途示警
        {hazards.length > 0 && (
          <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">{hazards.length}</span>
        )}
      </h3>

      {hazards.length === 0 ? (
        <p className="text-sm text-muted-foreground">沿途沒有天氣示警</p>
      ) : (
        <HazardRows hazards={hazards} positionKm={positionKm} onJump={onJump} />
      )}

      {traits.length > 0 && (
        <div className="space-y-2 pt-3">
          <h4 className="text-sm font-semibold text-foreground">
            路線特性
            <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">{traits.length} 段陡坡</span>
          </h4>
          <p className="text-xs text-muted-foreground">陡坡不隨天氣變化，不列入今日判讀。</p>
          <HazardRows hazards={traits} positionKm={positionKm} onJump={onJump} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">路況事件（事故、施工）資料尚未接入</p>
    </section>
  );
}
