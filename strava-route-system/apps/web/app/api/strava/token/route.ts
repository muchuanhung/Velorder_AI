import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 儲存 Strava token 的 API
// TODO: 這裡應該連接到資料庫（Prisma）來儲存 token
// 目前先用簡單的記憶體儲存作為範例

type TokenData = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
  createdAt: number;
};

// 臨時記憶體儲存（實際應用中應該使用資料庫）
const tokenStore = new Map<string, TokenData>();

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, refreshToken, expiresAt, athleteId } = body;

    if (!accessToken || !refreshToken || !expiresAt || !athleteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 儲存 token（實際應用中應該使用 Prisma 儲存到資料庫）
    tokenStore.set(userId, {
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      athleteId,
      createdAt: Date.now()
    });

    console.log('✅ Strava token saved for user', {
      userId,
      athleteId,
      expiresAt: new Date(expiresAt * 1000).toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving Strava token', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 取得 token（實際應用中應該從資料庫讀取）
    const tokenData = tokenStore.get(userId);

    if (!tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // 檢查 token 是否過期
    const isExpired = tokenData.expiresAt * 1000 < Date.now();

    return NextResponse.json({
      ...tokenData,
      isExpired,
      expiresAtISO: new Date(tokenData.expiresAt * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error fetching Strava token', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

