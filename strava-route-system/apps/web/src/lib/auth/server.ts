// Server 端：從 Request 取得並驗證 Firebase idToken，回傳 uid

import { getAuthAdmin } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "firebase-id-token";

/**
 * 從 Request 的 cookie 或 Authorization header 取得 uid。
 * 用於 API Routes 與 Server Components（透過 headers()）。
 */
export async function getAuthFromRequest(request: Request): Promise<{
  uid: string;
} | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;

  const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (match?.[1]) {
    token = decodeURIComponent(match[1].trim());
  }
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }
  if (!token) return null;

  try {
    const decoded = await getAuthAdmin().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

/**
 * 供 Server Component 使用：從 Next.js headers() 取得當前使用者 uid。
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1] ? decodeURIComponent(match[1].trim()) : null;
  if (!token) return null;
  try {
    const decoded = await getAuthAdmin().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
