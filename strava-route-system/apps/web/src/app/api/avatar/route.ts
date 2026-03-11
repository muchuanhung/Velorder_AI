/**
 * 代理 Google
 */
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = "lh3.googleusercontent.com";

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === ALLOWED_ORIGIN && parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Routecast/1.0" },
      next: { revalidate: 86400 }, // 快取 24 小時
    });
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
