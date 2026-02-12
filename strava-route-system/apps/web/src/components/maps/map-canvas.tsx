"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getRainColor,
  getRainOpacity,
  type District
} from "@/lib/maps/map-data";

interface MapCanvasProps {
  districts: District[];
  activeLayer: "rainfall" | "traffic";
  onDistrictSelect: (district: District | null) => void;
  selectedDistrict: District | null;
}

export function MapCanvas({
  districts,
  activeLayer,
  onDistrictSelect,
  selectedDistrict,
}: MapCanvasProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  const handleDistrictClick = useCallback(
    (district: District) => {
      onDistrictSelect(
        selectedDistrict?.id === district.id ? null : district
      );
    },
    [selectedDistrict, onDistrictSelect]
  );

  // Compute centroid of an SVG path by averaging M/L coordinates
  const getCentroid = (path: string): [number, number] => {
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
  };

  return (
    <div className="absolute inset-0 overflow-hidden select-none">
      {/* Deep dark map background */}
      <div className="absolute inset-0 bg-[#070b14]">
        {/* Water texture - subtle ocean */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#070b14] to-[#0d0f1a]" />

        {/* Coordinate grid lines */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <pattern
              id="map-grid-major"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
            <pattern
              id="map-grid-minor"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.25"
                opacity="0.15"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid-minor)" />
          <rect width="100%" height="100%" fill="url(#map-grid-major)" />
        </svg>

        {/* Atmospheric glow around Taiwan landmass */}
        <div className="absolute top-[10%] left-[30%] w-[50%] h-[80%] rounded-full bg-[#1a2744]/30 blur-[100px]" />
        <div className="absolute top-[20%] left-[40%] w-[30%] h-[60%] rounded-full bg-[#0d2147]/20 blur-[60px]" />
      </div>

      {/* SVG Map of Taiwan */}
      <svg
        viewBox="0 0 100 90"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Interactive map of Taiwan districts"
      >
        <defs>
          {/* 3D extrusion glow for current district */}
          <filter id="glow-current" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feFlood floodColor="#FC4C02" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 3D shadow for extruded districts */}
          <filter id="extrude-shadow" x="-20%" y="-10%" width="140%" height="150%">
            <feDropShadow
              dx="0.4"
              dy="0.8"
              stdDeviation="0.6"
              floodColor="#000"
              floodOpacity="0.6"
            />
          </filter>

          {/* Hover highlight glow */}
          <filter id="glow-hover" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feFlood floodColor="#60a5fa" floodOpacity="0.25" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Selected district glow */}
          <filter id="glow-selected" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feFlood floodColor="#87CEEB" floodOpacity="0.35" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sea labels */}
        <text x="15" y="35" fill="#1e3a5f" fontSize="2.5" fontWeight="300" opacity="0.4" className="font-sans">
          Taiwan Strait
        </text>
        <text x="75" y="55" fill="#1e3a5f" fontSize="2" fontWeight="300" opacity="0.35" className="font-sans">
          Pacific Ocean
        </text>

        {/* Render districts in layers: shadows first, then fills, then borders */}
        {/* Shadow layer for 3D extrusion */}
        {districts.map((district) => {
          if (!district.isCurrentDistrict) return null;
          return (
            <path
              key={`shadow-${district.id}`}
              d={district.path}
              fill="#FC4C02"
              fillOpacity={0.15}
              stroke="none"
              filter="url(#extrude-shadow)"
              style={{ transform: "translateY(0.5px)" }}
            />
          );
        })}

        {/* District fills */}
        {districts.map((district) => {
          const isHovered = hoveredDistrict === district.id;
          const isSelected = selectedDistrict?.id === district.id;
          const isCurrent = district.isCurrentDistrict;
          const showRainfall = activeLayer === "rainfall";

          const fillColor = isCurrent
            ? "#FC4C02"
            : showRainfall
              ? getRainColor(district.rainProbability)
              : "#2a3441";

          const fillOpacity = isCurrent
            ? 0.75
            : showRainfall
              ? getRainOpacity(district.rainProbability)
              : 0.35;

          const strokeColor = isCurrent
            ? "#FC4C02"
            : isSelected
              ? "#87CEEB"
              : isHovered
                ? "#60a5fa"
                : "#1e293b";

          const strokeW = isCurrent ? 0.5 : isSelected ? 0.4 : isHovered ? 0.3 : 0.15;

          const filterVal = isCurrent
            ? "url(#glow-current)"
            : isSelected
              ? "url(#glow-selected)"
              : isHovered
                ? "url(#glow-hover)"
                : undefined;

          // 3D extrusion: lift current district up
          const extrudeY = isCurrent ? -1.5 : isSelected ? -0.6 : isHovered ? -0.3 : 0;

          return (
            <path
              key={district.id}
              d={district.path}
              fill={fillColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeLinejoin="round"
              filter={filterVal}
              className="cursor-pointer"
              style={{
                transform: `translateY(${extrudeY}px)`,
                transition:
                  "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), fill-opacity 0.3s ease, stroke-width 0.2s ease",
              }}
              onMouseEnter={() => setHoveredDistrict(district.id)}
              onMouseLeave={() => setHoveredDistrict(null)}
              onClick={() => handleDistrictClick(district)}
            />
          );
        })}

        {/* District labels - show for hovered, selected, or current */}
        {districts.map((district) => {
          const isHovered = hoveredDistrict === district.id;
          const isSelected = selectedDistrict?.id === district.id;
          const isCurrent = district.isCurrentDistrict;
          if (!isHovered && !isSelected && !isCurrent) return null;

          const [cx, cy] = getCentroid(district.path);
          const extrudeY = isCurrent ? -1.5 : isSelected ? -0.6 : -0.3;

          return (
            <text
              key={`label-${district.id}`}
              x={cx}
              y={cy + extrudeY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none select-none font-sans"
              fontSize="1.5"
              fontWeight="600"
              fill={isCurrent ? "#fff" : "#e2e8f0"}
              opacity={0.95}
            >
              {district.nameZh}
            </text>
          );
        })}

        {/* Current location pulse dot */}
        {(() => {
          const current = districts.find((d) => d.isCurrentDistrict);
          if (!current) return null;
          const [cx, cy] = getCentroid(current.path);
          return (
            <g>
              <circle cx={cx} cy={cy - 1.5} r="1.8" fill="#FC4C02" opacity="0.15">
                <animate
                  attributeName="r"
                  from="1.2"
                  to="3"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.2"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={cx} cy={cy - 1.5} r="0.7" fill="#FC4C02" stroke="#fff" strokeWidth="0.2" />
            </g>
          );
        })()}
      </svg>

      {/* Floating district tooltip */}
      <AnimatePresence>
        {hoveredDistrict && (
          <DistrictTooltip
            district={districts.find((d) => d.id === hoveredDistrict)!}
            activeLayer={activeLayer}
          />
        )}
      </AnimatePresence>

      {/* Compass rose */}
      <div className="absolute top-4 right-4 z-[2] opacity-30 hidden lg:block">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="#475569" strokeWidth="0.5" />
          <text x="20" y="8" textAnchor="middle" fill="#94a3b8" fontSize="5" fontWeight="600">N</text>
          <text x="20" y="36" textAnchor="middle" fill="#475569" fontSize="4">S</text>
          <text x="35" y="22" textAnchor="middle" fill="#475569" fontSize="4">E</text>
          <text x="5" y="22" textAnchor="middle" fill="#475569" fontSize="4">W</text>
          <polygon points="20,10 18.5,16 21.5,16" fill="#FC4C02" opacity="0.8" />
          <polygon points="20,30 18.5,24 21.5,24" fill="#475569" opacity="0.6" />
        </svg>
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-3 right-3 z-[2] text-[10px] text-muted-foreground/30 font-mono">
        StravaSync Maps | CWA | TDX
      </div>

      {/* Coordinate display */}
      <div className="absolute bottom-3 left-3 z-[2] text-[10px] text-muted-foreground/30 font-mono hidden md:block">
        {selectedDistrict
          ? `${selectedDistrict.center[1].toFixed(4)}\u00b0N, ${selectedDistrict.center[0].toFixed(4)}\u00b0E`
          : "25.0330\u00b0N, 121.5654\u00b0E"}
      </div>
    </div>
  );
}

function DistrictTooltip({
  district,
  activeLayer,
}: {
  district: District;
  activeLayer: "rainfall" | "traffic";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed top-4 right-16 lg:right-20 z-20 pointer-events-none"
    >
      <div className="rounded-lg border border-border/50 bg-card/90 backdrop-blur-xl px-3.5 py-2.5 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="h-2.5 w-2.5 rounded-full ring-2 ring-background/50"
            style={{
              backgroundColor: district.isCurrentDistrict
                ? "#FC4C02"
                : getRainColor(district.rainProbability),
            }}
          />
          <span className="text-xs font-semibold text-foreground">
            {district.nameZh}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {district.name}
          </span>
        </div>
        {activeLayer === "rainfall" && (
          <div className="flex items-center gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${district.rainProbability}%`,
                  backgroundColor: getRainColor(district.rainProbability),
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
              {district.rainProbability}% 降雨機率
            </span>
          </div>
        )}
        {district.isCurrentDistrict && (
          <p className="text-[10px] text-strava font-medium mt-1">
            您目前的位置
          </p>
        )}
      </div>
    </motion.div>
  );
}