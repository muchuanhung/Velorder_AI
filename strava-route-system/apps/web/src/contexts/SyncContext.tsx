"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type LastSyncStatus = "idle" | "completed" | "error";

type SyncContextValue = {
  syncing: boolean;
  setSyncing: (v: boolean) => void;
  lastSyncCount: number | null;
  setLastSyncCount: (n: number | null) => void;
  lastSyncStatus: LastSyncStatus;
  setLastSyncStatus: (s: LastSyncStatus) => void;
  /** 註冊 sync 完成時的 callback（如：刷新天氣），回傳 unsubscribe */
  onSyncComplete: (cb: () => void) => () => void;
  /** 由 Header 等呼叫，通知 sync 已完成 */
  emitSyncComplete: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<LastSyncStatus>("idle");
  const listenersRef = useRef<Set<() => void>>(new Set());

  const onSyncComplete = useCallback((cb: () => void) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  const emitSyncComplete = useCallback(() => {
    listenersRef.current.forEach((fn) => fn());
  }, []);

  const value = useMemo(
    () => ({
      syncing,
      setSyncing,
      lastSyncCount,
      setLastSyncCount,
      lastSyncStatus,
      setLastSyncStatus,
      onSyncComplete,
      emitSyncComplete,
    }),
    [syncing, lastSyncCount, lastSyncStatus, onSyncComplete, emitSyncComplete]
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync 必須在 SyncProvider 內使用");
  return ctx;
}
