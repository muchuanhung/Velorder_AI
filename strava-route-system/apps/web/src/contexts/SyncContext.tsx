"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type LastSyncStatus = "idle" | "completed" | "error";

type SyncContextValue = {
  syncing: boolean;
  setSyncing: (v: boolean) => void;
  lastSyncCount: number | null;
  setLastSyncCount: (n: number | null) => void;
  lastSyncStatus: LastSyncStatus;
  setLastSyncStatus: (s: LastSyncStatus) => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<LastSyncStatus>("idle");
  const value = useMemo(
    () => ({ syncing, setSyncing, lastSyncCount, setLastSyncCount, lastSyncStatus, setLastSyncStatus }),
    [syncing, lastSyncCount, lastSyncStatus]
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync 必須在 SyncProvider 內使用");
  return ctx;
}
