/**
 * Strava 活動同步到 Firestore（僅 Server 使用）。
 * 路徑：users/{userId}/strava_activities/{activityId}
 */

import { getFirestoreAdmin } from "@/lib/firebase/admin";

export type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date_local: string;
};

const SUBCOLLECTION = "strava_activities";

function toFirestore(activity: StravaActivity) {
  return {
    ...activity,
    syncedAt: Date.now(),
  };
}

function fromFirestore(data: Record<string, unknown>): StravaActivity {
  return {
    id: data.id as number,
    name: data.name as string,
    distance: data.distance as number,
    moving_time: data.moving_time as number,
    total_elevation_gain: data.total_elevation_gain as number,
    start_date_local: data.start_date_local as string,
  };
}

/** 將活動寫入 Firestore（以 activity.id 為 doc id，覆寫同 id） */
export async function persistActivitiesFirestore(params: {
  userId: string;
  activities: StravaActivity[];
}): Promise<number> {
  const db = getFirestoreAdmin();
  const batch = db.batch();
  const ref = db.collection("users").doc(params.userId).collection(SUBCOLLECTION);

  for (const activity of params.activities) {
    batch.set(ref.doc(String(activity.id)), toFirestore(activity), { merge: true });
  }
  await batch.commit();
  return params.activities.length;
}

/** 從 Firestore 讀取該使用者已同步的活動（含當月＋上月，供 stats 比較用） */
export async function getCachedActivitiesFirestore(
  userId: string
): Promise<StravaActivity[]> {
  const db = getFirestoreAdmin();
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection(SUBCOLLECTION)
    .orderBy("start_date_local", "desc")
    .limit(250)
    .get();
  return snap.docs.map((d) => fromFirestore(d.data() as Record<string, unknown>));
}
