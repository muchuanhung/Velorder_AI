
import { NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/server";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = typeof body?.token === "string" ? body.token : null;
    if (!idToken) {
      return NextResponse.json({ error: "缺少 token" }, { status: 400 });
    }
    const decoded = await getAuthAdmin().verifyIdToken(idToken);
    const uid = decoded.uid;

    const response = NextResponse.json({ success: true, uid });
    response.cookies.set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (e) {
    console.error("Session 設定失敗", e);
    return NextResponse.json({ error: "無效的 token" }, { status: 401 });
  }
}
