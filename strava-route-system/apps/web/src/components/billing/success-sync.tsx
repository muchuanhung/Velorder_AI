"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * 當 URL 有 session_id 時，呼叫 sync-session API 將訂閱寫入 Firestore
 * 作為 webhook 失敗時的 fallback
 */
export function SuccessSync() {
  const searchParams = useSearchParams();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || synced) return;

    fetch("/api/stripe/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success || data.isPro) {
          setSynced(true);
          window.dispatchEvent(new Event("subscription-synced"));
        }
      })
      .catch(() => {});
  }, [searchParams, synced]);

  return null;
}
