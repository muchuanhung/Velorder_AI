"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { getRainColor, type District } from "@/lib/maps/map-data";

interface MapCanvasProps {
  districts: District[];
  onDistrictSelect: (district: District | null) => void;
  selectedDistrict: District | null;
  viewBox?: string;
}

/** 以 path 中 M/L 座標平均求中心點 */
function getCentroid(path: string): [number, number] {
  const parts = path.split(/\s+/);
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "M" || parts[i] === "L") {
      const x = Number.parseFloat(parts[i + 1] ?? "");
      const y = Number.parseFloat(parts[i + 2] ?? "");
      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }
  return count > 0 ? [sumX / count, sumY / count] : [50, 50];
}

/** 降雨機率面量圖：日光底圖，沒有資料的鄉鎮為灰色，不當成 0% */
export function MapCanvas({ districts, onDistrictSelect, selectedDistrict, viewBox = "0 0 100 90" }: MapCanvasProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hovered = hoveredId ? districts.find((d) => d.id === hoveredId) : undefined;
  const current = districts.find((d) => d.isCurrentDistrict);

  const handleClick = useCallback(
    (district: District) => onDistrictSelect(selectedDistrict?.id === district.id ? null : district),
    [selectedDistrict, onDistrictSelect]
  );

  return (
    <div className="absolute inset-0 select-none overflow-hidden bg-accent">
      <svg
        viewBox={viewBox}
        className="absolute inset-0 size-full"
        // slice：填滿直式手機與寬螢幕，以焦點鄉鎮為中心裁切，不留大片空白海面
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="台灣各鄉鎮降雨機率地圖"
      >
        {districts.map((d) => {
          const isSelected = selectedDistrict?.id === d.id;
          const isHovered = hoveredId === d.id;
          return (
            <path
              key={d.id}
              d={d.path}
              fill={d.hasRain ? getRainColor(d.rainProbability) : undefined}
              strokeWidth={isSelected ? 2 : isHovered || d.isCurrentDistrict ? 1.5 : 0.5}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              className={cn(
                "cursor-pointer transition-[stroke-width] duration-150",
                !d.hasRain && "fill-muted",
                isSelected ? "stroke-foreground" : isHovered || d.isCurrentDistrict ? "stroke-primary" : "stroke-card"
              )}
              onMouseEnter={() => setHoveredId(d.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleClick(d)}
            />
          );
        })}

        {/* 名稱只標示滑過、選取與目前位置的鄉鎮，避免 368 個標籤擠成一團 */}
        {districts
          .filter((d) => d.id === hoveredId || d.id === selectedDistrict?.id || d.isCurrentDistrict)
          .map((d) => {
            const [cx, cy] = getCentroid(d.path);
            return (
              <text
                key={`label-${d.id}`}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="0.65"
                fontWeight="700"
                className="pointer-events-none fill-foreground stroke-card [paint-order:stroke] [stroke-width:0.35]"
              >
                {d.nameZh}
              </text>
            );
          })}

        {current &&
          (() => {
            const [cx, cy] = getCentroid(current.path);
            return (
              <circle
                cx={cx}
                cy={cy - 1.1}
                r="0.45"
                className="fill-primary stroke-card"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            );
          })()}
      </svg>

      {hovered && <DistrictTooltip district={hovered} />}

      <p className="absolute bottom-3 right-3 text-xs text-muted-foreground">資料：中央氣象署</p>
    </div>
  );
}

function DistrictTooltip({ district }: { district: District }) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 hidden rounded-lg border border-border bg-card px-3 py-2 shadow-md lg:block">
      <div className="flex items-center gap-2">
        <RainSwatch district={district} />
        <span className="text-sm font-bold">{district.nameZh}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {district.hasRain ? `降雨機率 ${district.rainProbability}%` : "無降雨資料"}
        {district.isCurrentDistrict && "・目前位置"}
      </p>
    </div>
  );
}

/** 降雨色塊（SVG，避免 inline style） */
export function RainSwatch({ district, className }: { district: District; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={cn("size-3 shrink-0", className)} aria-hidden>
      <circle
        cx="5"
        cy="5"
        r="4.5"
        fill={district.hasRain ? getRainColor(district.rainProbability) : undefined}
        className={cn("stroke-border", !district.hasRain && "fill-muted")}
        strokeWidth="1"
      />
    </svg>
  );
}
