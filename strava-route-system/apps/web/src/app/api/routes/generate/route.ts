import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import { inngest } from "@/inngest/client";

type GeneratePayload = {
  startPoint: [number, number];
  preferences: {
    distance: number;
    elevation: "low" | "medium" | "high";
  };
};

export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request);
  const userId = auth?.uid;

  if (!userId) {
    return NextResponse.json({ error: "需要登入才能請求路線" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<GeneratePayload>;

  if (
    !body?.startPoint ||
    body.startPoint.length !== 2 ||
    typeof body.startPoint[0] !== "number" ||
    typeof body.startPoint[1] !== "number" ||
    !body.preferences
  ) {
    return NextResponse.json(
      { error: "startPoint 與 preferences 為必填欄位" },
      { status: 400 }
    );
  }

  const preferences = {
    distance: body.preferences.distance ?? 10,
    elevation: body.preferences.elevation ?? "medium",
  } as const;

  await inngest.send({
    name: "route/generate",
    data: {
      userId,
      startPoint: body.startPoint,
      preferences,
    },
  });

  return NextResponse.json({
    queued: true,
    message: "路線計算已排入背景處理",
  });
}
