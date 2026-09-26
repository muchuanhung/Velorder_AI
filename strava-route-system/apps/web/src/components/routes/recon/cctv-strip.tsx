"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { CctvMarker } from "@/lib/routes/recon-geo";
import { CCTV_STATUS } from "./cctv-viewer";

/** 沿途監視器清單：點選後游標跳到該鏡頭的里程 */
export function CctvStrip({
  markers,
  activeId,
  loading,
  error,
  onSelect,
}: {
  markers: CctvMarker[];
  activeId: string | null;
  loading: boolean;
  error: boolean;
  onSelect: (km: number) => void;
}) {
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 主畫面鏡頭改變時，把對應項目捲進可視範圍
  useEffect(() => {
    if (!activeId) return;
    itemRefs.current.get(activeId)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  if (loading && markers.length === 0) {
    return (
      <div className="flex gap-2 overflow-hidden" aria-label="監視器載入中">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 w-36 shrink-0 animate-pulse rounded-md bg-muted/60" />
        ))}
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{error ? "監視器載入失敗" : "沿途無監視器"}</p>
    );
  }

  return (
    <section aria-labelledby="cctv-strip-title" className="space-y-2">
      <h3 id="cctv-strip-title" className="text-sm font-semibold text-foreground">
        沿途監視器
        <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">{markers.length}</span>
      </h3>
      <div className="max-w-full overflow-x-auto overscroll-x-contain pb-1">
        <div className="flex w-max gap-2">
          {markers.map((m) => {
            const isActive = m.id === activeId;
            const status = CCTV_STATUS[m.status];
            return (
              <button
                key={m.id}
                type="button"
                ref={(el) => {
                  if (el) itemRefs.current.set(m.id, el);
                  else itemRefs.current.delete(m.id);
                }}
                onClick={() => onSelect(m.km)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-36 shrink-0 flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "border-foreground bg-muted/60" : "border-border hover:bg-muted/40"
                )}
              >
                <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                  <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} aria-hidden />
                  {m.km.toFixed(1)} km
                  <span className="sr-only">{status.text}</span>
                </span>
                <span className="w-full truncate text-sm text-foreground">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
