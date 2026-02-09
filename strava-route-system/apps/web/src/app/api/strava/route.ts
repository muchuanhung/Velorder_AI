/**
 * Strava OAuth 回呼：GET /api/strava?code=xxx&state=uid
 *
 * 改動後邏輯（依序）：
 * 1. 從 cookie 取得目前登入者 userId；未登入 → 導向 /login
 * 2. 沒有 code（例如使用者手動打開此 URL）→ 導向 /dashboard
 * 3. 用 code 向 Strava 換 access_token，取得 athlete 資料
 * 4. 若此 Strava 帳號（athleteId）已連結到「別人」→ 刪除舊連結（改綁給目前授權者）
 * 5. 將 token 寫入 memory + Firestore（以當前 userId 為 key）
 * 6. 拉活動、寫入 Firestore，導向 /dashboard
 */
import { NextResponse } from "next/server";
import { exchangeStravaToken, getStravaAthlete } from "@repo/auth";
import { getAuthFromRequest } from "@/lib/auth/server";
import { upsertStravaToken } from "@/lib/background/strava-token-store";
import {
  deleteStravaTokenFirestore,
  getUserIdByAthleteIdFirestore,
  upsertStravaTokenFirestore,
} from "@/lib/background/strava-token-store.firestore";
import { getLastMonthYearMonth } from "@/constants";
import { pullRecentActivities } from "@/lib/background/strava-activities";
import { persistActivitiesFirestore } from "@/lib/background/strava-activities.firestore";

export async function GET(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    const userId = auth?.uid;

    if (!userId) {
      console.warn('未登入使用者嘗試完成 Strava 授權');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const tokenData = await exchangeStravaToken(code);

    const athlete = await getStravaAthlete(tokenData.access_token);

    const existingUserId = await getUserIdByAthleteIdFirestore(athlete.id);
    if (existingUserId && existingUserId !== userId) {
      await deleteStravaTokenFirestore(existingUserId);
    }

    const tokenRecord = {
      userId,
      athleteId: athlete.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
    };
    upsertStravaToken(tokenRecord);
    await upsertStravaTokenFirestore(tokenRecord);

    // 授權完成後立即同步活動（當月＋上月），再導向 dashboard
    const [thisMonthActivities, lastMonthActivities] = await Promise.all([
      pullRecentActivities(tokenData.access_token),
      pullRecentActivities(tokenData.access_token, { month: getLastMonthYearMonth() }),
    ]);
    const byId = new Map(thisMonthActivities.map((a) => [a.id, a]));
    lastMonthActivities.forEach((a) => byId.set(a.id, a));
    const activities = Array.from(byId.values());
    await persistActivitiesFirestore({ userId, activities });

    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('Strava 回呼流程失敗', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    const errorUrl = new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url);
    return NextResponse.redirect(errorUrl);
  }
}
