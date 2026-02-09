/**
 * GET /api/strava/stats
 * 回傳當前登入使用者「本月」與「上月」的 Strava 活動彙總，供前端算 trend。
 * 未登入 401；未連結 Strava 回 200 + { totalDistanceKm: 0, lastMonthDistanceKm: 0, ... }。
 */

import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import { getCachedActivitiesFirestore } from "@/lib/background/strava-activities.firestore";
import { isThisMonth, isLastMonth } from "@/constants";

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request);
  if (!auth?.uid) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const activities = await getCachedActivitiesFirestore(auth.uid);
  const thisMonth = activities.filter((a) => isThisMonth(a.start_date_local));
  const lastMonth = activities.filter((a) => isLastMonth(a.start_date_local));

  const totalDistanceKm = thisMonth.reduce((sum, a) => sum + a.distance, 0) / 1000;
  const lastMonthDistanceKm = lastMonth.reduce((sum, a) => sum + a.distance, 0) / 1000;
  const totalElevationM = thisMonth.reduce((sum, a) => sum + a.total_elevation_gain, 0);
  const lastMonthElevationM = lastMonth.reduce((sum, a) => sum + a.total_elevation_gain, 0);
  const totalMovingTimeSec = thisMonth.reduce((sum, a) => sum + a.moving_time, 0);
  const lastMonthMovingTimeSec = lastMonth.reduce((sum, a) => sum + a.moving_time, 0);

  return NextResponse.json({
    totalDistanceKm,
    lastMonthDistanceKm,
    totalElevationM,
    lastMonthElevationM,
    totalMovingTimeSec,
    lastMonthMovingTimeSec,
    activityCount: thisMonth.length,
  });
}
