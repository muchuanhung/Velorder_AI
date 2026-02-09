/**
 * GET /api/strava/activities
 * 回傳當前登入使用者已同步的活動列表（依 start_date_local 降序，預設 limit 20）。
 * 未登入 401。
 */

import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import { getCachedActivitiesFirestore } from "@/lib/background/strava-activities.firestore";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request);
  if (!auth?.uid) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );

  const all = await getCachedActivitiesFirestore(auth.uid);
  const activities = all.slice(0, limit);

  return NextResponse.json({ activities });
}
