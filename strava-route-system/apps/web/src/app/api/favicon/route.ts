import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const revalidate = 86400;

export async function GET() {
  try {
    const path = join(process.cwd(), "public", "favicon.ico");
    const buffer = await readFile(path);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/x-icon",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
