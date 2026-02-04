"use client";

import { useState } from "react";
import { X, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SyncBannerProps {
  syncing?: boolean;
  progress?: number;
}

export function SyncBanner({ syncing = true, progress = 68 }: SyncBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

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
              {syncing
                ? "Syncing historical Strava data..."
                : "Sync complete!"}
            </p>
            <p className="text-xs text-muted-foreground">
              {syncing
                ? `Inngest background job processing • ${progress}% complete`
                : "All activities have been synced successfully"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {syncing && (
            <div className="hidden sm:block w-32">
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
