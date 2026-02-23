/**
 * 從 Firebase Storage 取得 GPX 路線列表，每條透過 Nominatim 取得行政區
 */

import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { parseGpxPoints, parseGpxToRoute } from "@/lib/routes/parse-gpx";
import { getSegmentsFromPoints } from "@/lib/routes/geocode-districts";

const ROUTES_FOLDER = "gpx/routes";

export async function GET() {
  try {
    const admin = getFirebaseAdmin();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = admin.storage().bucket(bucketName || undefined);

    const [files] = await bucket.getFiles({ prefix: `${ROUTES_FOLDER}/` });

    const routes = [];
    for (const file of files) {
      if (!file.name.endsWith(".gpx")) continue;
      const routeId = file.name.replace(/\.gpx$/i, "").split("/").pop() ?? "";
      try {
        const [contents] = await file.download();
        const xml = contents.toString("utf-8");
        const { points } = parseGpxPoints(xml);
        let segments: Awaited<ReturnType<typeof getSegmentsFromPoints>> = [];
        try {
          segments = await getSegmentsFromPoints(points);
        } catch (geoErr) {
          console.warn(`GPX ${routeId} 行政區 geocode 失敗:`, geoErr);
        }
        const route = parseGpxToRoute(xml, routeId, segments);
        routes.push(route);
      } catch (err) {
        console.warn(`無法解析 GPX ${routeId}:`, err);
      }
    }

    return NextResponse.json(
      routes.sort((a, b) => a.name.localeCompare(b.name))
    );
  } catch (err) {
    console.error("GPX routes API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "無法載入路線" },
      { status: 500 }
    );
  }
}
