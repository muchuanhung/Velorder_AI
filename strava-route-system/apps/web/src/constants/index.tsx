import { CheckCircle2, Loader2, AlertCircle, Bike, Footprints, Mountain, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Route } from "@/lib/routes/route-data";

export type SyncStatus = "idle" | "running" | "completed" | "error";

export type SyncStatusConfigItem = {
  icon: ReactNode;
  color: string;
  label: string;
};

/** Sync / 同步狀態的 icon 與樣式，供 JobStatusCard、Weather 等複用 */
export const SYNC_STATUS_CONFIG: Record<SyncStatus, SyncStatusConfigItem> = {
  idle: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-muted-foreground",
    label: "Ready",
  },
  running: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: "text-strava",
    label: "Syncing...",
  },
  completed: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-success",
    label: "Synced",
  },
  error: {
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-destructive",
    label: "Error",
  },
};

/** Route 類型的 icon 對應 */
export const ROUTE_TYPE_ICONS: Record<Route["type"], LucideIcon> = {
  自行車: Bike,
  跑步: Footprints,
  健行: Mountain,
  雪巴運動: Trophy,
  混合: Mountain,
};
