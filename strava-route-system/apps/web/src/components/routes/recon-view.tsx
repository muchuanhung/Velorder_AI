"use client";

import { useMemo } from "react";
import type { CCTVFeed, Route } from "@/lib/routes/route-data";
import {
  buildRoutePolylineKm,
  buildCctvMarkers,
  pickInitialMarker,
  deriveStages,
  computeHazards,
  isWeatherHazard,
  summarizeVerdict,
  nearestByKm,
  routeTotalKm,
  stageAtKm,
  type ChartDataPoint,
} from "@/lib/routes/recon-geo";
import { eventHazards } from "@/lib/routes/road-events";
import { useReconPosition } from "@/hooks/useReconPosition";
import type { RouteEventsState } from "@/hooks/useRouteEvents";
import { RouteVerdictBar } from "./recon/route-verdict-bar";
import { HazardList } from "./recon/hazard-list";
import { ElevationScrubber } from "./recon/elevation-scrubber";
import { CctvViewer } from "./recon/cctv-viewer";
import { CctvStrip } from "./recon/cctv-strip";

export type { RouteStage, CctvMarker } from "@/lib/routes/recon-geo";

interface ReconViewProps {
  route: Route;
  /** 來自 useRouteCCTV 的即時清單；優先於 route.cctvFeeds */
  cctvFeeds?: CCTVFeed[];
  cctvLoading?: boolean;
  /** CCTV 抓取失敗，用來區分「載入失敗」與「沿途無監視器」 */
  cctvError?: boolean;
  /** 來自 useRouteEvents 的沿途路況事件 */
  roadEvents?: RouteEventsState;
}

/**
 * 路線偵察畫面。資訊層級依危險度排序：
 * 1 全線判定 → 2 沿途示警 → 3 高程圖（游標處天氣）→ 4 監視器
 */
export function ReconView({
  route,
  cctvFeeds: cctvFeedsProp,
  cctvLoading = false,
  cctvError = false,
  roadEvents,
}: ReconViewProps) {
  const routePolyline = useMemo(() => buildRoutePolylineKm(route), [route]);

  const cctvMarkers = useMemo(
    () => buildCctvMarkers(route, cctvFeedsProp ?? route.cctvFeeds ?? [], routePolyline),
    [route, cctvFeedsProp, routePolyline]
  );
  const initialMarker = useMemo(
    () => pickInitialMarker(cctvMarkers, routePolyline),
    [cctvMarkers, routePolyline]
  );

  const stages = useMemo(() => deriveStages(route), [route]);
  const hazards = useMemo(() => computeHazards(route, stages), [route, stages]);
  // 判定看今天會變動的條件：天氣＋路況事件（災害、事故、管制、異常告警），與 Dashboard 一致；陡坡不列入
  const verdictHazards = useMemo(
    () =>
      [...hazards.filter(isWeatherHazard), ...eventHazards(roadEvents?.events ?? [])].sort(
        (a, b) => a.startKm - b.startKm
      ),
    [hazards, roadEvents?.events]
  );
  const eventsFailed = roadEvents?.error ? null : roadEvents?.failedCounties;
  const verdict = useMemo(
    () => summarizeVerdict(verdictHazards, stages, { eventsFailed }),
    [verdictHazards, stages, eventsFailed]
  );

  const chartData = useMemo<ChartDataPoint[]>(
    () => (route.elevationProfile ?? []).map(([km, elevation]) => ({ km, elevation })),
    [route.elevationProfile]
  );
  const peakElevation = useMemo(
    () => (chartData.length > 0 ? Math.max(...chartData.map((d) => d.elevation)) : 0),
    [chartData]
  );

  const { positionKm, moveTo, activeMarker } = useReconPosition(route.id, cctvMarkers, initialMarker);

  const currentStage = useMemo(() => stageAtKm(stages, positionKm), [stages, positionKm]);
  const currentElevation = useMemo(
    () => nearestByKm(chartData, positionKm)?.elevation ?? 0,
    [chartData, positionKm]
  );

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <RouteVerdictBar verdict={verdict} />

      <HazardList hazards={verdictHazards} roadEvents={roadEvents} positionKm={positionKm} onJump={moveTo} />

      <ElevationScrubber
        data={chartData}
        hazards={verdictHazards}
        positionKm={positionKm}
        totalKm={routeTotalKm(route)}
        elevation={currentElevation}
        peakElevation={peakElevation}
        stage={currentStage}
        onScrub={moveTo}
      />

      <div className="space-y-3">
        <CctvViewer marker={activeMarker} positionKm={positionKm} />
        <CctvStrip
          markers={cctvMarkers}
          activeId={activeMarker?.id ?? null}
          loading={cctvLoading}
          error={cctvError}
          onSelect={moveTo}
        />
      </div>
    </div>
  );
}
