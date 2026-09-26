"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSync } from "@/contexts/SyncContext";

/**
 * Strava 同步狀態列：
 * - 同步中：只顯示進行中（API 為單次請求，沒有真實進度可顯示）
 * - 完成：顯示筆數，並提供前往路線示警的入口
 * - 失敗由 Header 的 toast 通知，這裡不重複顯示
 */
export function SyncBanner() {
  const { syncing, lastSyncCount, lastSyncStatus } = useSync();
  const [dismissed, setDismissed] = useState(false);

  // 開始新一輪同步時重新顯示
  useEffect(() => {
    if (syncing) setDismissed(false);
  }, [syncing]);

  if (dismissed) return null;
  if (!syncing && lastSyncStatus !== "completed") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3"
    >
      <p className="flex items-center gap-2 text-sm text-foreground">
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
            正在同步 Strava 活動…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
            已同步 {lastSyncCount ?? 0} 筆活動
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        {!syncing && (
          <Button asChild size="sm" variant="ghost">
            <Link href="/routes">
              查看路線示警
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setDismissed(true)}
          aria-label="關閉"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
