// Route Intelligence data models and mock data

export interface RouteSegment {
    district: string;
    districtZh: string;
    rainProbability: number;
    windSpeed: number;
    temperature: number;
    condition: "clear" | "cloudy" | "rainy" | "stormy";
  }
  
  export interface CCTVFeed {
    id: string;
    label: string;
    location: string;
    lastUpdated: string;
    /** Placeholder image seed for deterministic "screenshot" */
    imageSeed: number;
    status: "online" | "offline" | "degraded";
  }
  
  export interface Route {
    id: string;
    name: string;
    nameZh: string;
    distance: number; // km
    elevationGain: number; // m
    type: "cycling" | "running" | "mixed";
    difficulty: "easy" | "moderate" | "hard" | "extreme";
    status: "safe" | "caution" | "risky";
    verdictMessage: string;
    segments: RouteSegment[];
    cctvFeeds: CCTVFeed[];
    /** SVG path 或 Mapbox polyline 編碼，viewBox 0 0 200 120 */
    gpxPreviewPath: string;
    /** Elevation profile points [x, elevation] */
    elevationProfile: [number, number][];
    estimatedTime: string;
    bestTimeToRide: string;
  }
  
  export const routes: Route[] = [];
  
  export function getStatusColor(status: Route["status"]): string {
    switch (status) {
      case "safe":
        return "#22c55e";
      case "caution":
        return "#f59e0b";
      case "risky":
        return "#ef4444";
    }
  }
  
  export function getDifficultyColor(d: Route["difficulty"]): string {
    switch (d) {
      case "easy":
        return "#22c55e";
      case "moderate":
        return "#f59e0b";
      case "hard":
        return "#FC4C02";
      case "extreme":
        return "#ef4444";
    }
  }
  
  export function getConditionIcon(c: RouteSegment["condition"]): string {
    switch (c) {
      case "clear":
        return "sun";
      case "cloudy":
        return "cloud";
      case "rainy":
        return "cloud-rain";
      case "stormy":
        return "cloud-lightning";
    }
  }  