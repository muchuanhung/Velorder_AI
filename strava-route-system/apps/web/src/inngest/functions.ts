import { inngest } from "@/inngest/client";
import {
  persistActivities,
  pullRecentActivities,
} from "@/lib/background/strava-activities";
import {
  listActiveStravaTokens,
  type StravaTokenRecord,
} from "@/lib/background/strava-token-store";
import {
  buildRouteCandidates,
  cacheRouteRecommendation,
} from "@/lib/background/route-recommendation";

type StravaSyncEvent = {
  name: "strava/sync-activities";
  data: {
    userId: string;
    athleteId: number;
    accessToken: string;
  };
};

type RouteGenerateEvent = {
  name: "route/generate";
  data: {
    userId: string;
    startPoint: [number, number];
    preferences: {
      distance: number;
      elevation: "low" | "medium" | "high";
    };
  };
};

export const syncActivities = inngest.createFunction(
  { id: "strava-sync-activities" },
  { event: "strava/sync-activities" },
  async ({ event, step }) => {
    const activities = await step.run("fetch-strava", () =>
      pullRecentActivities(event.data.accessToken)
    );

    await step.run("persist-activities", () =>
      persistActivities({
        userId: event.data.userId,
        activities,
      })
    );
  }
);

export const generateRoute = inngest.createFunction(
  { id: "route-generate" },
  { event: "route/generate" },
  async ({ event, step }) => {
    const candidates = await step.run("build-candidates", () =>
      buildRouteCandidates({
        startPoint: event.data.startPoint,
        preferences: event.data.preferences,
      })
    );

    await step.run("cache-recommendation", () =>
      cacheRouteRecommendation({
        userId: event.data.userId,
        routes: candidates,
      })
    );
  }
);

export const syncAllUsers = inngest.createFunction(
  { id: "strava-sync-all", name: "Strava 每小時同步" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const tokens = await step.run("load-active-tokens", () =>
      listActiveStravaTokens()
    );

    await step.run("dispatch-sync", async () => {
      await Promise.all(
        tokens.map((record: StravaTokenRecord) =>
          step.sendEvent({
            name: "strava/sync-activities",
            data: {
              userId: record.userId,
              athleteId: record.athleteId,
              accessToken: record.accessToken,
            },
          } satisfies StravaSyncEvent)
        )
      );
    });
  }
);

export const allInngestFunctions = [syncActivities, generateRoute, syncAllUsers];
