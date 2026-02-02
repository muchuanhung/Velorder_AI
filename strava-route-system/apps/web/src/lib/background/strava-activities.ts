const STRAVA_BASE_URL = "https://www.strava.com/api/v3";

export type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date_local: string;
};

const activityStore = new Map<string, StravaActivity[]>();

/**
 * 透過 Strava API 取得近期活動，預設抓取最新 30 筆。
 */
export async function pullRecentActivities(accessToken: string) {
  const response = await fetch(
    `${STRAVA_BASE_URL}/athlete/activities?per_page=30`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Strava 活動抓取失敗：${response.status} ${details}`);
  }

  const payload = (await response.json()) as StravaActivity[];
  return payload;
}

/**
 * 將活動暫存於記憶體，實務上會改成寫入資料庫。
 */
export async function persistActivities(params: {
  userId: string;
  activities: StravaActivity[];
}) {
  activityStore.set(params.userId, params.activities);
  return params.activities.length;
}

export function getCachedActivities(userId: string) {
  return activityStore.get(userId) ?? [];
}
