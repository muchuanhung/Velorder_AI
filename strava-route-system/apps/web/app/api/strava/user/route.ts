import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 這個 endpoint 用於獲取最近授權的 Strava 使用者資料
// 實際應用中應該從資料庫讀取，這裡暫時用簡單的方式
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: 從資料庫讀取該 userId 的 Strava token 和使用者資料
    // 目前先返回一個提示訊息
    return NextResponse.json({
      message: '請在授權流程中查看使用者資料',
      note: '使用者資料會在授權成功時顯示在頁面上'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

