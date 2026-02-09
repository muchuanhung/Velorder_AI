"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSync } from "@/contexts/SyncContext";

const SYNC_PROGRESS_DURATION_MS = 2000;
const SYNC_PROGRESS_TICK_MS = 50;

/**
 * 集中管理 SyncBanner 的顯示與進度動畫：
 * - 開始同步時重置 dismissed，讓 banner 再次顯示
 * - 同步中時進度條 0→100% 循環動畫
 * - 由使用者點擊 Dismiss 按鈕隱藏
 */
function useSyncBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);
  const { syncing, lastSyncCount } = useSync();

  useEffect(() => {
    if (syncing) setDismissed(false);
  }, [syncing]);

  useEffect(() => {
    if (!syncing) {
      setProgress(0);
      return;
    }
    const step = (100 / SYNC_PROGRESS_DURATION_MS) * SYNC_PROGRESS_TICK_MS;
    const t = setInterval(() => {
      setProgress((p) => (p + step >= 100 ? 0 : p + step));
    }, SYNC_PROGRESS_TICK_MS);
    return () => clearInterval(t);
  }, [syncing]);

  return { dismissed, progress, syncing, lastSyncCount, setDismissed };
}

export function SyncBanner() {
  const { dismissed, progress, syncing, lastSyncCount, setDismissed } = useSyncBanner();

  if (dismissed) return null;
  if (!syncing && lastSyncCount === null) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border px-4 py-3",
        syncing
          ? "bg-strava/5 border-strava/20"
          : "bg-success/5 border-success/20"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {syncing ? (
            <RefreshCw className="h-4 w-4 text-strava animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )}
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {syncing ? "正在同步 Strava 活動..." : "同步完成！"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {syncing && (
            <div className="hidden sm:block w-32 shrink-0">
              <Progress value={progress} className="h-2 bg-secondary [&>div]:bg-strava" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile progress bar */}
      {syncing && (
        <div className="mt-3 sm:hidden">
          <Progress value={progress} className="h-2 bg-secondary [&>div]:bg-strava" />
        </div>
      )}
    </div>
  );
}
