import { NextResponse } from "next/server";
import { exchangeStravaToken, getStravaAthlete } from "@repo/auth";
import { getAuthFromRequest } from "@/lib/auth/server";
import { inngest } from "@/inngest/client";
import { upsertStravaToken } from "@/lib/background/strava-token-store";

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
    const state = searchParams.get('state');

    if (!code) {
      console.log('Strava 回呼沒有帶入 code，導回首頁');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('收到 Strava 回呼參數', {
      hasCode: Boolean(code),
      state,
      userId
    });

    const tokenData = await exchangeStravaToken(code);

    console.log('✅ Strava token 交換完成', {
      expiresAt: new Date(tokenData.expires_at * 1000).toISOString(),
      hasRefreshToken: Boolean(tokenData.refresh_token),
      accessTokenLength: tokenData.access_token.length
    });

    const athlete = await getStravaAthlete(tokenData.access_token);

    console.log('✅ Strava 授權成功，使用者資料：', {
      '使用者 ID': athlete.id,
      '姓名': `${athlete.firstname} ${athlete.lastname}`,
      '使用者名稱': athlete.username || '未設定',
      '城市': athlete.city || '未設定',
      '國家': athlete.country || '未設定',
      '性別': athlete.sex || '未設定',
      'Premium': athlete.premium ? '是' : '否',
      '大頭照': athlete.profile,
      '完整資料': athlete
    });

    upsertStravaToken({
      userId,
      athleteId: athlete.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at
    });

    await inngest.send({
      name: 'strava/sync-activities',
      data: {
        userId,
        athleteId: athlete.id,
        accessToken: tokenData.access_token
      }
    });

    // 授權完成後導向 dashboard
    const errorUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(errorUrl);
  } catch (error) {
    console.error('Strava 回呼流程失敗', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    const errorUrl = new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url);
    return NextResponse.redirect(errorUrl);
  }
}
