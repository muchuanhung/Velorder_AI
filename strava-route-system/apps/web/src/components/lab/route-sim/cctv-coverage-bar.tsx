"use client";

import { useId } from "react";
import type { CctvMarker } from "@/lib/routes/recon-geo";

const W = 1000;

/** 沿線監視器覆蓋：有鏡頭的里程段著色，其餘斜線；點鏡頭刻度跳到該處 */
export function CctvCoverageBar({
  markers,
  totalKm,
  coverKm,
  positionKm,
  onSelect,
}: {
  markers: CctvMarker[];
  totalKm: number;
  coverKm: number;
  positionKm: number;
  onSelect: (km: number) => void;
}) {
  const hatchId = useId();
  const x = (km: number) => (Math.max(0, Math.min(totalKm, km)) / totalKm) * W;
  // 相鄰鏡頭的覆蓋區間會重疊，先合併再加總，否則覆蓋率會被高估
  const intervals = markers
    .map((m) => [Math.max(0, m.km - coverKm), Math.min(totalKm, m.km + coverKm)] as const)
    .sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let curEnd = -Infinity;
  for (const [start, end] of intervals) {
    if (end <= curEnd) continue;
    covered += end - Math.max(start, curEnd);
    curEnd = end;
  }

  return (
    <section aria-label="監視器覆蓋" className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">監視器覆蓋</span>
        <span>
          {markers.length === 0
            ? "沿線沒有監視器"
            : `約 ${Math.round(Math.min(1, covered / totalKm) * 100)}% 路段在鏡頭 ${coverKm} km 內`}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} 34`} className="block h-auto w-full" role="group" aria-label="監視器位置，可點選跳到該處">
        <defs>
          <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#EEF0E8" />
            <rect width="3" height="6" fill="#C9CDBF" />
          </pattern>
        </defs>
        <rect x="0" y="4" width={W} height="12" rx="6" fill={`url(#${hatchId})`} />
        {markers.map((m) => (
          <rect key={m.id} x={x(m.km - coverKm)} y="4" width={x(m.km + coverKm) - x(m.km - coverKm)} height="12" fill="#2F5D3E" />
        ))}
        <rect x={x(positionKm) - 1.5} y="0" width="3" height="20" fill="currentColor" className="text-foreground" />
        {markers.map((m) => (
          <g
            key={`t-${m.id}`}
            role="button"
            tabIndex={0}
            aria-label={`跳到 ${m.name}（${m.km.toFixed(1)} km）`}
            className="cursor-pointer outline-none focus-visible:[&>path]:fill-[#2F5D3E]"
            onClick={() => onSelect(m.km)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(m.km);
              }
            }}
          >
            <rect x={x(m.km) - 12} y="18" width="24" height="16" fill="transparent" />
            <path d={`M${x(m.km)} 21 l-7 11 h14 z`} fill="#1F2B20" />
          </g>
        ))}
      </svg>
    </section>
  );
}
