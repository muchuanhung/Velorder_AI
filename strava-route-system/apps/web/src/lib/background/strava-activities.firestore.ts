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
  type?: string;
  average_heartrate?: number | null;
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
    type: data.type as string | undefined,
    average_heartrate: (data.average_heartrate as number | null | undefined) ?? null,
  };
}

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
