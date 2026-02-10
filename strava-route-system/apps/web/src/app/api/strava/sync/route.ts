/**
 * POST /api/strava/sync
 * 使用當前登入使用者的 Strava token 拉取近期活動、寫入 Firestore，並回傳結果。
 *
 * 1. 從 cookie 取得 auth.uid；未登入 → 401
 * 2. 要求帶 X-Client-UID，且必須 === auth.uid，否則 403
 * 3. 只從 Firestore 讀取該 uid 的 Strava token，沒有 → 200 + needAuth: true
 * 4. token 過期 → 自動用 refresh_token 換新 token，更新 Firestore 後繼續同步；若 refresh 失敗 → 刪除過期 token，回傳 200 + needAuth: true（引導重新授權）
 * 5. 用 token 拉活動、寫入 Firestore，回傳 200 + { success, count, activities }
 */

import { NextResponse } from "next/server";
import { refreshStravaToken } from "@repo/auth";
import { getAuthFromRequest } from "@/lib/auth/server";
import {
  getStravaTokenFirestore,
  deleteStravaTokenFirestore,
  upsertStravaTokenFirestore,
} from "@/lib/background/strava-token-store.firestore";
import { pullRecentActivities } from "@/lib/background/strava-activities";
import { persistActivitiesFirestore } from "@/lib/background/strava-activities.firestore";
import { getLastMonthYearMonth } from "@/constants";

/** 前端傳送的當前 Firebase UID，必須與 cookie 一致，避免 cookie 錯人時誤回他人資料 */
const HEADER_CLIENT_UID = "x-client-uid";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth?.uid) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const clientUid = request.headers.get(HEADER_CLIENT_UID)?.trim();
    if (!clientUid || clientUid !== auth.uid) {
      return NextResponse.json(
        { error: "登入狀態與目前頁面不符，請重新整理頁面後再試" },
        { status: 403 }
      );
    }

    const tokenRecord = await getStravaTokenFirestore(auth.uid);
    if (!tokenRecord) {
      return NextResponse.json(
        { error: "尚未連結 Strava，請先完成授權", needAuth: true }
      );
    }

    let accessToken = tokenRecord.accessToken;
    const nowSec = Math.floor(Date.now() / 1000);
    if (tokenRecord.expiresAt <= nowSec) {
      try {
        const refreshed = await refreshStravaToken(tokenRecord.refreshToken);
        await upsertStravaTokenFirestore({
          userId: auth.uid,
          athleteId: tokenRecord.athleteId,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresAt: refreshed.expires_at,
        });
        accessToken = refreshed.access_token;
      } catch {
        await deleteStravaTokenFirestore(auth.uid);
        return NextResponse.json(
          { error: "Strava 授權已失效，請重新連結", needAuth: true }
        );
      }
    }

    const [thisMonthActivities, lastMonthActivities] = await Promise.all([
      pullRecentActivities(accessToken),
      pullRecentActivities(accessToken, { month: getLastMonthYearMonth() }),
    ]);
    const byId = new Map(thisMonthActivities.map((a) => [a.id, a]));
    lastMonthActivities.forEach((a) => byId.set(a.id, a));
    const activities = Array.from(byId.values());
    const count = await persistActivitiesFirestore({
      userId: auth.uid,
      activities,
    });

    return NextResponse.json({
      success: true,
      count,
      activities,
    });
  } catch (err) {
    console.error("Strava sync 失敗", err);
    const message = err instanceof Error ? err.message : "同步失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
