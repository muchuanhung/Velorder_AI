"use client";

import React, { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useSync } from "@/contexts/SyncContext";
import { Route, Mountain, Clock } from "lucide-react";
import { SYNC_STATUS_CONFIG, type SyncStatus } from "@/constants";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  highlight?: boolean;
}

function StatCard({ title, value, subtitle, icon, trend, highlight }: StatCardProps) {
  return (
    <Card className={cn(
      "bg-card border-border transition-all hover:border-strava/30",
      highlight && "border-strava/50"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              highlight ? "text-strava" : "text-foreground"
            )}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-strava/10 text-strava" : "bg-secondary text-muted-foreground"
          )}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className={
              trend.value === "—" ? "text-muted-foreground" : trend.positive ? "text-success" : "text-destructive"
            }>
              {trend.value}
            </span>
            <span className="text-muted-foreground">vs. 上個月</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JobStatusCard({ status, syncCount, highlight }: { status: SyncStatus; syncCount: number | null; highlight?: boolean }) {
  const config = SYNC_STATUS_CONFIG[status];
  const subtitle =
    status === "running"
      ? "同步中…"
      : status === "completed" && syncCount != null
        ? `已同步 ${syncCount} 筆活動`
        : status === "error"
          ? "上次同步失敗，請再試一次"
          : "點擊 Sync 開始同步";

  return (
    <Card className={cn(
      "bg-card border-border transition-all hover:border-strava/30",
      highlight && "border-strava/50"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Sync 狀態</p>
            <p className={cn("text-2xl font-bold tracking-tight", config.color)}>
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary",
            config.color
          )}>
            {config.icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type MonthStats = {
  totalDistanceKm: number;
  lastMonthDistanceKm: number;
  totalElevationM: number;
  lastMonthElevationM: number;
  totalMovingTimeSec: number;
  lastMonthMovingTimeSec: number;
  activityCount: number;
};

function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

function formatElevation(m: number): string {
  return `${m.toLocaleString(undefined, { maximumFractionDigits: 0 })} m`;
}

function formatMovingTime(sec: number): string {
  const hrs = sec / 3600;
  if (hrs >= 1000) return `${(hrs / 1000).toFixed(1)}k hrs`;
  return `${hrs.toLocaleString(undefined, { maximumFractionDigits: 1 })} hrs`;
}

export function StatsCards() {
  const [stats, setStats] = useState<MonthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { syncing, lastSyncCount, lastSyncStatus } = useSync();
  const jobStatus: SyncStatus = syncing ? "running" : lastSyncStatus;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/strava/stats", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MonthStats | null) => {
        if (!cancelled && data) setStats(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const prevSyncingRef = useRef(false);
  useEffect(() => {
    const wasSyncing = prevSyncingRef.current;
    prevSyncingRef.current = syncing;
    if (wasSyncing && !syncing && lastSyncStatus === "completed") {
      fetch("/api/strava/stats", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: MonthStats | null) => data && setStats(data));
    }
  }, [syncing, lastSyncStatus]);

  const distanceValue = stats != null ? formatDistance(stats.totalDistanceKm) : (loading ? "—" : "0 km");
  const elevationValue = stats != null ? formatElevation(stats.totalElevationM) : (loading ? "—" : "0 m");
  const movingTimeValue = stats != null ? formatMovingTime(stats.totalMovingTimeSec) : (loading ? "—" : "0 hrs");

  function trendFromPrev(current: number, prev: number): { value: string; positive: boolean } | undefined {
    if (stats == null) return undefined;
    if (prev <= 0) return { value: "—", positive: true };
    const pct = ((current - prev) / prev) * 100;
    return {
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
      positive: pct >= 0,
    };
  }
  const distanceTrend = stats != null ? trendFromPrev(stats.totalDistanceKm, stats.lastMonthDistanceKm) : undefined;
  const elevationTrend = stats != null ? trendFromPrev(stats.totalElevationM, stats.lastMonthElevationM) : undefined;
  const movingTimeTrend = stats != null ? trendFromPrev(stats.totalMovingTimeSec, stats.lastMonthMovingTimeSec) : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="總距離"
        value={distanceValue}
        subtitle="這個月"
        icon={<Route className="h-5 w-5" />}
        trend={distanceTrend}
        highlight
      />
      <StatCard
        title="總爬升高度"
        value={elevationValue}
        subtitle="這個月"
        icon={<Mountain className="h-5 w-5" />}
        trend={elevationTrend}
      />
      <StatCard
        title="總活動時數"
        value={movingTimeValue}
        subtitle="這個月"
        icon={<Clock className="h-5 w-5" />}
        trend={movingTimeTrend}
      />
      <JobStatusCard status={jobStatus} syncCount={lastSyncCount}/>
    </div>
  );
}
