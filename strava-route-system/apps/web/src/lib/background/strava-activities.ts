import { getMonthRange } from "@/constants";

const STRAVA_BASE_URL = "https://www.strava.com/api/v3";
const PER_PAGE = 200; // Strava 單次上限

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

const activityStore = new Map<string, StravaActivity[]>();

export type PullActivitiesOptions = {
  month?: { year: number; month: number };
};

export async function pullRecentActivities(
  accessToken: string,
  options: PullActivitiesOptions = {}
): Promise<StravaActivity[]> {
  const now = new Date();
  const { year, month } = options.month ?? { year: now.getFullYear(), month: now.getMonth() + 1 };
  const { after, before } = getMonthRange(year, month);

  const all: StravaActivity[] = [];
  let page = 1;

  while (true) {
    const url = new URL(`${STRAVA_BASE_URL}/athlete/activities`);
    url.searchParams.set("after", String(after));
    url.searchParams.set("before", String(before));
    url.searchParams.set("per_page", String(PER_PAGE));
    url.searchParams.set("page", String(page));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Strava 活動抓取失敗：${response.status} ${details}`);
    }

    const raw = (await response.json()) as Array<Record<string, unknown>>;
    const chunk: StravaActivity[] = raw.map((a) => ({
      id: a.id as number,
      name: (a.name as string) ?? "",
      distance: (a.distance as number) ?? 0,
      moving_time: (a.moving_time as number) ?? 0,
      total_elevation_gain: (a.total_elevation_gain as number) ?? 0,
      start_date_local: (a.start_date_local as string) ?? "",
      type: a.type as string | undefined,
      average_heartrate: (a.average_heartrate as number | null | undefined) ?? null,
    }));
    all.push(...chunk);
    if (chunk.length < PER_PAGE) break;
    page += 1;
  }

  return all;
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
