// Next.js 16：middleware 已更名為 proxy；保護路由改由各頁面／API 內用 getCurrentUserId / getAuthFromRequest 處理
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?|mp3|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
