"use client";

// 自定義 hook：監聽 Firestore 即時交通/氣象等
// TODO: 使用 Firebase client 訂閱對應 collection，回傳 { data, loading, error }

import { useState, useEffect } from "react";

export function useFirestore<T>(_collection: string, _docId?: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(false);
    // TODO: onSnapshot 訂閱，setData / setError，return unsubscribe
  }, [_collection, _docId]);

  return { data, loading, error };
}
