type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: StravaAthlete;
};

export type StravaAthlete = {
  id: number;
  username: string | null;
  resource_state: number;
  firstname: string;
  lastname: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: 'M' | 'F' | null;
  premium: boolean;
  summit: boolean;
  created_at: string;
  updated_at: string;
  badge_type_id: number;
  weight: number | null;
  profile_medium: string;
  profile: string;
  friend: null;
  follower: null;
};

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

export async function exchangeStravaToken(code: string) {
  const clientId = getEnv('STRAVA_CLIENT_ID');
  const clientSecret = getEnv('STRAVA_CLIENT_SECRET');
  const redirectUri = getEnv('STRAVA_REDIRECT_URI');

  // 根據 Strava 文檔，使用 application/x-www-form-urlencoded 格式
  // https://developers.strava.com/docs/getting-started/
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Strava token exchange failed', {
      status: res.status,
      body: errorText
    });
    throw new Error(`Strava token exchange failed with status ${res.status}`);
  }

  const payload = (await res.json()) as StravaTokenResponse;
  
  // 記錄 rate limit 資訊
  const { logRateLimit } = await import('./rate-limit');
  logRateLimit(res.headers, '/oauth/token');
  
  console.log('Strava token exchange success', {
    expiresAt: payload.expires_at,
    hasAthlete: Boolean(payload.athlete)
  });

  return payload;
}

export async function refreshStravaToken(refreshToken: string) {
  const clientId = getEnv('STRAVA_CLIENT_ID');
  const clientSecret = getEnv('STRAVA_CLIENT_SECRET');

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Strava token refresh failed', { status: res.status, body: errorText });
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }

  const payload = (await res.json()) as StravaTokenResponse;
  const { logRateLimit } = await import('./rate-limit');
  logRateLimit(res.headers, '/oauth/token');
  return payload;
}

export async function getStravaAthlete(accessToken: string) {
  const res = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  // 記錄 rate limit 資訊
  const { logRateLimit } = await import('./rate-limit');
  logRateLimit(res.headers, '/athlete');

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch Strava athlete', {
      status: res.status,
      body: errorText
    });
    throw new Error(`Failed to fetch Strava athlete: ${res.status}`);
  }

  const athlete = (await res.json()) as StravaAthlete;
  console.log('Strava athlete fetched successfully', {
    id: athlete.id,
    name: `${athlete.firstname} ${athlete.lastname}`,
    username: athlete.username,
    city: athlete.city,
    country: athlete.country
  });

  return athlete;
}

