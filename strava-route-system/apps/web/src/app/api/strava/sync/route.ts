/**
 * POST /api/strava/sync
 * 使用當前登入使用者的 Strava token 拉取近期活動、寫入 Firestore，並回傳結果。
 */

import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import { getStravaToken } from "@/lib/background/strava-token-store";
import {
  getStravaTokenFirestore,
  upsertStravaTokenFirestore,
} from "@/lib/background/strava-token-store.firestore";
import { pullRecentActivities } from "@/lib/background/strava-activities";
import { persistActivitiesFirestore } from "@/lib/background/strava-activities.firestore";

/** 前端傳送的當前 Firebase UID，用來與 cookie 比對，避免 cookie 仍為舊帳號時誤回他人資料 */
const HEADER_CLIENT_UID = "x-client-uid";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth?.uid) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const clientUid = request.headers.get(HEADER_CLIENT_UID)?.trim();
    if (clientUid && clientUid !== auth.uid) {
      return NextResponse.json(
        { error: "登入狀態與目前頁面不符，請重新整理頁面後再試" },
        { status: 403 }
      );
    }

    let tokenRecord = await getStravaTokenFirestore(auth.uid);
    if (!tokenRecord) {
      const mem = getStravaToken(auth.uid);
      if (mem) {
        await upsertStravaTokenFirestore({
          userId: mem.userId,
          athleteId: mem.athleteId,
          accessToken: mem.accessToken,
          refreshToken: mem.refreshToken,
          expiresAt: mem.expiresAt,
        });
        tokenRecord = mem;
      }
    }
    if (!tokenRecord) {
      return NextResponse.json(
        { error: "尚未連結 Strava，請先完成授權", needAuth: true },
        { status: 400 }
      );
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (tokenRecord.expiresAt <= nowSec) {
      return NextResponse.json(
        { error: "Strava token 已過期，請重新連結 Strava" },
        { status: 400 }
      );
    }

    const activities = await pullRecentActivities(tokenRecord.accessToken);
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
