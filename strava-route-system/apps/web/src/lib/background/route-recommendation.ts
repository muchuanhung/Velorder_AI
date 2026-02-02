export type RoutePreferences = {
  distance: number;
  elevation: "low" | "medium" | "high";
};

export type RouteRecommendation = {
  id: string;
  startPoint: [number, number];
  path: [number, number][];
  distanceKm: number;
  elevationProfile: "low" | "medium" | "high";
  score: number;
};

const routeCache = new Map<string, RouteRecommendation[]>();

/**
 * 依照偏好產生簡化版候選路線，實務上會呼叫專門的路線引擎。
 */
export async function buildRouteCandidates(params: {
  startPoint: [number, number];
  preferences: RoutePreferences;
}) {
  const { startPoint, preferences } = params;
  const [lat, lng] = startPoint;

  const mockedSegment: [number, number][] = [
    startPoint,
    [lat + 0.02, lng + 0.01],
    [lat + 0.03, lng - 0.02],
    [lat, lng],
  ];

  const scoreBias =
    preferences.elevation === "low"
      ? 0.8
      : preferences.elevation === "medium"
        ? 0.9
        : 1;

  const recommendation: RouteRecommendation = {
    id: `route-${Date.now()}`,
    startPoint,
    path: mockedSegment,
    distanceKm: preferences.distance,
    elevationProfile: preferences.elevation,
    score: Number((Math.random() * 0.2 + scoreBias).toFixed(2)),
  };

  return [recommendation];
}

export async function cacheRouteRecommendation(params: {
  userId: string;
  routes: RouteRecommendation[];
}) {
  routeCache.set(params.userId, params.routes);
  return params.routes.length;
}

export function getCachedRoutes(userId: string) {
  return routeCache.get(userId) ?? [];
}
