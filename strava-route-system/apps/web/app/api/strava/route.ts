import { exchangeStravaToken, getStravaAthlete } from '@repo/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 從 query string 取得 code 和 state
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // 如果沒有 code，可能是直接訪問這個路由，重定向到首頁
    if (!code) {
      console.log('No code in callback, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('Strava callback received', {
      hasCode: Boolean(code),
      state
    });

    // 交換 token
    const tokenData = await exchangeStravaToken(code);

    console.log('✅ Strava token exchange completed', {
      expiresAt: new Date(tokenData.expires_at * 1000).toISOString(),
      hasRefreshToken: Boolean(tokenData.refresh_token),
      accessTokenLength: tokenData.access_token.length
    });

    // 取得 Strava 使用者資料
    const athlete = await getStravaAthlete(tokenData.access_token);

    console.log('✅ Strava 授權成功！使用者資料：', {
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

    // TODO: 儲存 token 到資料庫（暫時跳過，先測試授權流程）
    // try {
    //   const saveResponse = await fetch(
    //     new URL('/api/strava/token', request.url),
    //     {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify({
    //         accessToken: tokenData.access_token,
    //         refreshToken: tokenData.refresh_token,
    //         expiresAt: tokenData.expires_at,
    //         athleteId: athlete.id
    //       })
    //     }
    //   );
    //   if (saveResponse.ok) {
    //     console.log('✅ Strava token saved successfully');
    //   }
    // } catch (error) {
    //   console.error('Error saving token:', error);
    // }

    // 將使用者資料編碼到 URL 參數中（用於前端顯示）
    const redirectUrl = new URL('/?success=strava_connected', request.url);
    redirectUrl.searchParams.set('athlete_id', athlete.id.toString());
    redirectUrl.searchParams.set('athlete_name', `${athlete.firstname} ${athlete.lastname}`);
    redirectUrl.searchParams.set('athlete_username', athlete.username || '');
    redirectUrl.searchParams.set('athlete_city', athlete.city || '');
    redirectUrl.searchParams.set('athlete_country', athlete.country || '');
    redirectUrl.searchParams.set('athlete_premium', athlete.premium ? 'true' : 'false');
    redirectUrl.searchParams.set('athlete_profile', athlete.profile || '');
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Strava callback error', error);
    return NextResponse.redirect(
      new URL(
        `/?error=${error instanceof Error ? error.message : 'unknown'}`,
        request.url
      )
    );
  }
}

