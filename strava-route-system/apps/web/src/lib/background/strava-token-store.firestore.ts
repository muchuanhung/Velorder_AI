/**
 * Strava token 持久化到 Firestore（僅 Server 使用）。
 * Collection: strava_tokens，doc id = userId（Firebase UID）。
 */

import { getFirestoreAdmin } from "@/lib/firebase/admin";

const COLLECTION = "strava_tokens";

export type StravaTokenRecord = {
  userId: string;
  athleteId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  updatedAt: number;
};

function toFirestore(record: Omit<StravaTokenRecord, "updatedAt">) {
  return {
    userId: record.userId,
    athleteId: record.athleteId,
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
    expiresAt: record.expiresAt,
    updatedAt: Date.now(),
  };
}

function fromFirestore(data: Record<string, unknown>, userId: string): StravaTokenRecord {
  return {
    userId,
    athleteId: data.athleteId as number,
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string,
    expiresAt: data.expiresAt as number,
    updatedAt: data.updatedAt as number,
  };
}

export async function upsertStravaTokenFirestore(
  record: Omit<StravaTokenRecord, "updatedAt">
): Promise<void> {
  const db = getFirestoreAdmin();
  const doc = toFirestore(record);
  await db.collection(COLLECTION).doc(record.userId).set(doc, { merge: true });
}

export async function getStravaTokenFirestore(userId: string): Promise<StravaTokenRecord | null> {
  const db = getFirestoreAdmin();
  const snap = await db.collection(COLLECTION).doc(userId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  return data ? fromFirestore(data as Record<string, unknown>, userId) : null;
}

/** 列出所有仍有效的 token（給 Cron 同步用） */
export async function listActiveStravaTokensFirestore(): Promise<StravaTokenRecord[]> {
  const db = getFirestoreAdmin();
  const now = Date.now();
  const snap = await db
    .collection(COLLECTION)
    .where("expiresAt", ">", Math.floor(now / 1000))
    .get();
  return snap.docs.map((d) => fromFirestore(d.data() as Record<string, unknown>, d.id));
}
