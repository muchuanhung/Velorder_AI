"use client";

import { createContext, useContext, useMemo, useState } from "react";

type SyncContextValue = {
  syncing: boolean;
  setSyncing: (v: boolean) => void;
  lastSyncCount: number | null;
  setLastSyncCount: (n: number | null) => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const value = useMemo(
    () => ({ syncing, setSyncing, lastSyncCount, setLastSyncCount }),
    [syncing, lastSyncCount]
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync 必須在 SyncProvider 內使用");
  return ctx;
}
