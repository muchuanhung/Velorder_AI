import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import {
  getStravaToken,
  upsertStravaToken,
} from "@/lib/background/strava-token-store";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    const userId = auth?.uid;

    if (!userId) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, refreshToken, expiresAt, athleteId } = body;

    if (!accessToken || !refreshToken || !expiresAt || !athleteId) {
      return NextResponse.json({ error: '欄位不足' }, { status: 400 });
    }

    upsertStravaToken({
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      athleteId
    });

    console.log('✅ Strava token 已儲存', {
      使用者: userId,
      運動員: athleteId,
      到期時間: new Date(expiresAt * 1000).toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('儲存 Strava token 失敗', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    const userId = auth?.uid;

    if (!userId) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const tokenData = getStravaToken(userId);

    if (!tokenData) {
      return NextResponse.json({ error: '找不到 token' }, { status: 404 });
    }

    const isExpired = tokenData.expiresAt * 1000 < Date.now();

    return NextResponse.json({
      ...tokenData,
      isExpired,
      expiresAtISO: new Date(tokenData.expiresAt * 1000).toISOString()
    });
  } catch (error) {
    console.error('讀取 Strava token 失敗', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}
