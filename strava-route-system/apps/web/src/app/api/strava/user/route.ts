import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    const userId = auth?.uid;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
