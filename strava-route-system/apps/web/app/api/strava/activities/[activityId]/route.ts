import { NextResponse } from "next/server";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

type ActivityParams = {
  activityId: string;
};

export async function GET(
  request: Request,
  context: { params: Promise<ActivityParams> | ActivityParams }
) {
  const { activityId } =
    "then" in context.params ? await context.params : context.params;
  const incomingUrl = new URL(request.url);

  let token = "";
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice("bearer ".length);
  } else {
    token = incomingUrl.searchParams.get("access_token") ?? "";
  }

  if (!token) {
    return NextResponse.json(
      { error: "缺少 Authorization Bearer token" },
      { status: 401 }
    );
  }

  const includeAllEfforts =
    incomingUrl.searchParams.get("include_all_efforts") ?? "false";

  const upstreamUrl = new URL(
    `${STRAVA_API_BASE}/activities/${activityId}`
  );
  upstreamUrl.searchParams.set("include_all_efforts", includeAllEfforts);

  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  const payload = await upstreamResponse.json().catch(() => ({}));

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      {
        error: "Strava API 錯誤",
        status: upstreamResponse.status,
        details: payload
      },
      { status: upstreamResponse.status }
    );
  }

  return NextResponse.json(payload);
}

