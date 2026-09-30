"use client";

import { ChevronUp, LocateFixed, Loader2 } from "lucide-react";
import { RAIN_STEPS, type District } from "@/lib/maps/map-data";
import { WeatherProvider, useWeather } from "@/contexts/WeatherContext";
import { RainSwatch } from "./map-canvas";

/** 降雨圖例：五段色階＋無資料，文字標註數值，不只靠顏色 */
export function RainLegend() {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-muted-foreground">降雨機率（未來 12 小時）</p>
      <svg viewBox="0 0 120 8" className="h-2.5 w-full" preserveAspectRatio="none" aria-hidden>
        {RAIN_STEPS.map((s, i) => (
          <rect key={s.max} x={i * 24} y="0" width="24" height="8" fill={s.color} />
        ))}
      </svg>
      <div className="flex justify-between font-mono text-xs text-muted-foreground">
        <span>0%</span>
        <span>40%</span>
        <span>80%</span>
        <span>100%</span>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <svg viewBox="0 0 10 10" className="size-3" aria-hidden>
          <rect width="10" height="10" rx="2" className="fill-muted stroke-border" strokeWidth="1" />
        </svg>
        無資料
      </p>
    </div>
  );
}

function FocusedWeatherInner({ district }: { district: District }) {
  const { data, loading, error } = useWeather();
  const rainPop = data?.rainfall12h?.[0]?.pop ?? (district.hasRain ? district.rainProbability : null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <RainSwatch district={district} />
        <h2 className="min-w-0 truncate text-base font-bold">{district.nameZh}</h2>
        {district.isCurrentDistrict && <span className="shrink-0 text-xs text-primary">目前位置</span>}
      </div>
      {loading && !data && <p className="text-sm text-muted-foreground">天氣載入中…</p>}
      {error && !data && <p className="text-sm text-muted-foreground">天氣暫時取不到</p>}
      <dl className="grid grid-cols-3 gap-2">
        <Metric label="降雨" value={rainPop != null ? `${rainPop}%` : "—"} />
        <Metric label="氣溫" value={data ? `${data.temperature}°` : "—"} />
        <Metric label="風速" value={data ? `${data.windSpeedKmh}` : "—"} unit="km/h" />
      </dl>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg bg-muted px-2 py-2 text-center">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-lg font-semibold">
        {value}
        {unit && value !== "—" && <span className="ml-0.5 text-xs font-normal">{unit}</span>}
      </dd>
    </div>
  );
}

/** 選取／目前位置鄉鎮的即時天氣（CWB 鄉鎮預報） */
export function FocusedWeather({ district }: { district: District }) {
  return (
    <WeatherProvider county={district.countyName ?? null} district={district.townName ?? undefined}>
      <FocusedWeatherInner district={district} />
    </WeatherProvider>
  );
}

/** 桌機：左側資訊面板 */
export function ControlPanel({ focusedDistrict }: { focusedDistrict: District | undefined }) {
  if (!focusedDistrict) return null;
  return (
    <aside
      aria-label="地圖資訊"
      className="absolute left-4 top-4 z-10 hidden w-72 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-md lg:block"
    >
      <FocusedWeather district={focusedDistrict} />
      <div className="border-t border-border pt-4">
        <RainLegend />
      </div>
    </aside>
  );
}

/** 手機：地圖底部的精簡列，點開看詳細 */
export function MobileControlBar({
  focusedDistrict,
  onExpand,
  onLocate,
  locating,
}: {
  focusedDistrict: District | undefined;
  onExpand: () => void;
  onLocate: () => void;
  locating: boolean;
}) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-md lg:hidden">
      <button
        type="button"
        onClick={onExpand}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-left"
      >
        {focusedDistrict && <RainSwatch district={focusedDistrict} />}
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{focusedDistrict?.nameZh ?? "選擇鄉鎮"}</span>
        <span className="shrink-0 font-mono text-sm text-muted-foreground">
          {focusedDistrict?.hasRain ? `${focusedDistrict.rainProbability}%` : "—"}
        </span>
        <ChevronUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">查看詳細天氣</span>
      </button>
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        aria-label="定位到目前位置"
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-foreground disabled:opacity-60"
      >
        {locating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LocateFixed className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
