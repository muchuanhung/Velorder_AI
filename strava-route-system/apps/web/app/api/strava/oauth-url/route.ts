import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  console.log('OAuth URL request - env check:', {
    hasClientId: Boolean(clientId),
    clientIdLength: clientId?.length || 0,
    hasRedirectUri: Boolean(redirectUri),
    redirectUri
  });

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

  // 驗證 clientId 不是占位符
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

  console.log('Generated OAuth URL:', url.toString().replace(clientId, '***'));

  return NextResponse.json({ oauthUrl: url.toString() });
}

