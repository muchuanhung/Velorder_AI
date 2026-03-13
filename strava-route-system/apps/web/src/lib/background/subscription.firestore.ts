/**
 * Pro 訂閱狀態持久化到 Firestore
 * Collection: subscriptions，doc id = userId（Firebase UID）
 */

import { getFirestoreAdmin } from "@/lib/firebase/admin";

const COLLECTION = "subscriptions";

export type SubscriptionRecord = {
  userId: string;
  status: "active" | "canceled" | "past_due";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  priceId?: string;
  currentPeriodEnd?: number;
  updatedAt: number;
};

/** 移除 undefined 欄位，Firestore 不接受 undefined */
function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
}

export async function upsertSubscriptionFirestore(
  userId: string,
  data: Omit<SubscriptionRecord, "userId" | "updatedAt">
): Promise<void> {
  const db = getFirestoreAdmin();
  const doc = omitUndefined({
    userId,
    ...data,
    updatedAt: Date.now(),
  });
  await db.collection(COLLECTION).doc(userId).set(doc, { merge: true });
}

export async function getSubscriptionFirestore(
  userId: string
): Promise<SubscriptionRecord | null> {
  const db = getFirestoreAdmin();
  const snap = await db.collection(COLLECTION).doc(userId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  return {
    userId: snap.id,
    status: (data.status as SubscriptionRecord["status"]) ?? "active",
    stripeCustomerId: data.stripeCustomerId as string | undefined,
    stripeSubscriptionId: data.stripeSubscriptionId as string | undefined,
    priceId: data.priceId as string | undefined,
    currentPeriodEnd: data.currentPeriodEnd as number | undefined,
    updatedAt: (data.updatedAt as number) ?? Date.now(),
  };
}

/** 是否為有效 Pro 訂閱 */
export function isActiveSubscription(sub: SubscriptionRecord | null): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd * 1000 < Date.now()) {
    return false;
  }
  return true;
}
