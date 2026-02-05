// Next.js 16：middleware 已更名為 proxy；保護路由改由各頁面／API 內用 getCurrentUserId / getAuthFromRequest 處理
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALE_PREFIX = "/zh-tw";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith(`${LOCALE_PREFIX}/`) || pathname === LOCALE_PREFIX) {
    const pathWithoutLocale =
      pathname === LOCALE_PREFIX ? "/" : pathname.slice(LOCALE_PREFIX.length);
    const url = request.nextUrl.clone();
    url.pathname = pathWithoutLocale;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?|mp3|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
