"use client";

import { useState, useEffect, useCallback } from "react";

/** currentPeriodEnd: Stripe Unix 秒數 */
export function useSubscription() {
  const [isPro, setIsPro] = useState(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(() => {
    fetch("/api/stripe/subscription", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setIsPro(data?.isPro ?? false);
        setCurrentPeriodEnd(data?.currentPeriodEnd ?? null);
      })
      .catch(() => {
        setIsPro(false);
        setCurrentPeriodEnd(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const onFocus = () => fetchStatus();
    const onSynced = () => fetchStatus();
    window.addEventListener("focus", onFocus);
    window.addEventListener("subscription-synced", onSynced);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("subscription-synced", onSynced);
    };
  }, [fetchStatus]);

  return { isPro, currentPeriodEnd, loading, refetch: fetchStatus };
}
