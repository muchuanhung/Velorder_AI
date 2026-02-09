/**
 * POST /api/strava/sync
 * 使用當前登入使用者的 Strava token 拉取近期活動、寫入 Firestore，並回傳結果。
 *
 * 1. 從 cookie 取得 auth.uid；未登入 → 401
 * 2. 要求帶 X-Client-UID（前端畫面的 user.uid），且必須 === auth.uid，否則 403
 *    （避免 cookie 仍是舊帳號時，誤把 A 的活動回傳給畫面上的 B）
 * 3. 只從 Firestore 讀取該 uid 的 Strava token（不讀 memory），沒有 → 200 + needAuth: true
 * 4. token 過期 → 400
 * 5. 用 token 拉活動、寫入 Firestore，回傳 200 + { success, count, activities }
 */

import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import { getStravaTokenFirestore } from "@/lib/background/strava-token-store.firestore";
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

    const nowSec = Math.floor(Date.now() / 1000);
    if (tokenRecord.expiresAt <= nowSec) {
      return NextResponse.json(
        { error: "Strava token 已過期，請重新連結 Strava" },
        { status: 400 }
      );
    }

    const [thisMonthActivities, lastMonthActivities] = await Promise.all([
      pullRecentActivities(tokenRecord.accessToken),
      pullRecentActivities(tokenRecord.accessToken, { month: getLastMonthYearMonth() }),
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
