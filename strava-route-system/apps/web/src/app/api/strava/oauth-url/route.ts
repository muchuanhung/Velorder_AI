import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/server';

const HEADER_CLIENT_UID = 'x-client-uid';

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request);
  if (!auth?.uid) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const clientUid = request.headers.get(HEADER_CLIENT_UID)?.trim();
  if (!clientUid || clientUid !== auth.uid) {
    return NextResponse.json(
      { error: '登入狀態與目前頁面不符，請重新整理頁面後再試' },
      { status: 403 }
    );
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error('Missing environment variables:', {
      STRAVA_CLIENT_ID: clientId ? 'set' : 'missing',
      STRAVA_REDIRECT_URI: redirectUri ? 'set' : 'missing'
    });
    return NextResponse.json(
      {
        error: 'Missing STRAVA_CLIENT_ID or STRAVA_REDIRECT_URI',
        details: {
          hasClientId: Boolean(clientId),
          hasRedirectUri: Boolean(redirectUri)
        }
      },
      { status: 500 }
    );
  }

  if (clientId === '12345' || clientId.length < 5) {
    console.error('Invalid STRAVA_CLIENT_ID - appears to be placeholder:', clientId);
    return NextResponse.json(
      {
        error: 'Invalid STRAVA_CLIENT_ID. Please set the correct value in .env.local',
        currentValue: clientId
      },
      { status: 500 }
    );
  }

  const scopes = ['read', 'activity:read_all'];

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(','));
  url.searchParams.set('state', auth.uid);
  url.searchParams.set('approval_prompt', 'force');

  return NextResponse.json({ oauthUrl: url.toString() });
}
