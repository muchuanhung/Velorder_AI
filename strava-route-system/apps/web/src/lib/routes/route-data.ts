// Route Intelligence data models and mock data

export interface RouteSegment {
    district: string;
    districtZh: string;
    county?: string;
    rainProbability: number;
    windSpeed: number;
    temperature: number;
    condition: "clear" | "cloudy" | "rainy" | "stormy";
  }

  export const mockRoutes: Route[] = [
    {
      id: "fengguizui",
      name: "Fengguizui Climb",
      nameZh: "風櫃嘴",
      distance: 22.4,
      elevationGain: 645,
      type: "自行車",
      difficulty: "困難",
      status: "caution",
      verdictMessage:
        "Warning: High rain probability in Tianmu section (60%). Suggest postponing your ride or starting before 7 AM.",
      segments: [
        { district: "Shilin", districtZh: "士林區", rainProbability: 60, windSpeed: 18, temperature: 19, condition: "rainy" },
        { district: "Beitou", districtZh: "北投區", rainProbability: 55, windSpeed: 15, temperature: 18, condition: "cloudy" },
        { district: "Neihu", districtZh: "內湖區", rainProbability: 40, windSpeed: 12, temperature: 21, condition: "cloudy" },
        { district: "Wanli", districtZh: "萬里區", rainProbability: 72, windSpeed: 22, temperature: 17, condition: "rainy" },
      ],
      cctvFeeds: [
        { id: "cctv-fg-1", label: "Yangmingshan Gate", location: "KM 2.1", lastUpdated: "2 min ago", imageSeed: 101, status: "online" },
        { id: "cctv-fg-2", label: "Lengshuikeng", location: "KM 8.4", lastUpdated: "5 min ago", imageSeed: 102, status: "online" },
        { id: "cctv-fg-3", label: "Fengguizui Summit", location: "KM 15.6", lastUpdated: "1 min ago", imageSeed: 103, status: "online" },
        { id: "cctv-fg-4", label: "Wanli Descent", location: "KM 19.8", lastUpdated: "3 min ago", imageSeed: 104, status: "degraded" },
      ],
      gpxPreviewPath:
        "M 10 95 C 25 90, 40 85, 55 70 C 65 60, 72 45, 85 30 C 95 20, 105 15, 115 18 C 125 22, 135 40, 150 55 C 160 65, 170 80, 185 90",
      elevationProfile: [
        [0, 120], [2, 180], [4, 290], [6, 380], [8, 430],
        [10, 490], [12, 540], [14, 590], [16, 645],
        [18, 580], [20, 420], [22.4, 180],
      ],
      estimatedTime: "1h 45m",
      bestTimeToRide: "6:00 - 8:00 AM",
    },
  ];

  export interface CCTVFeed {
    id: string;
    label: string;
    location: string;
    lastUpdated: string;
    imageSeed: number;
    status: "online" | "offline" | "degraded";
    videoUrl?: string;
    township?: string;
  }
  
  export interface Route {
    id: string;
    name: string;
    nameZh: string;
    bbox?: [number, number, number, number];
    distance: number; // km
    elevationGain: number; // m
    type: "自行車" | "跑步" | "健行" | "混合";
    difficulty: "簡單" | "中等" | "困難" | "極難";
    status: "safe" | "caution" | "risky";
    verdictMessage: string;
    segments: RouteSegment[];
    cctvFeeds: CCTVFeed[];
    gpxPreviewPath: string;
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
      case "簡單":
        return "#22c55e";
      case "中等":
        return "#f59e0b";
      case "困難":
        return "#0ea5e9";
      case "極難":
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

/** 依天氣資料動態計算 */
export function computeRouteStatus(segments: RouteSegment[]): {
  status: Route["status"];
  verdictMessage: string;
} {
  if (segments.length === 0) {
    return { status: "safe", verdictMessage: "尚無行政區天氣資料" };
  }

  const avgRain =
    segments.reduce((s, seg) => s + seg.rainProbability, 0) / segments.length;
  const maxWind = Math.max(...segments.map((s) => s.windSpeed));
  const hasStormy = segments.some((s) => s.condition === "stormy");
  const hasRainy = segments.some((s) => s.condition === "rainy");

  // risky: 高降雨、強風、雷雨
  if (avgRain >= 60 || maxWind >= 35 || hasStormy) {
    const reasons: string[] = [];
    if (avgRain >= 60) reasons.push(`平均降雨機率 ${Math.round(avgRain)}%`);
    if (maxWind >= 35) reasons.push(`最大風速 ${maxWind} km/h`);
    if (hasStormy) reasons.push("有雷雨");
    return {
      status: "risky",
      verdictMessage: `不建議出發：${reasons.join("、")}。請改日或避開該時段。`,
    };
  }

  // caution: 中降雨、風速偏高、有雨
  if (avgRain >= 40 || maxWind >= 25 || hasRainy) {
    const reasons: string[] = [];
    if (avgRain >= 40) reasons.push(`降雨機率偏高 ${Math.round(avgRain)}%`);
    if (maxWind >= 25) reasons.push(`風速 ${maxWind} km/h`);
    if (hasRainy) reasons.push("部分路段有雨");
    return {
      status: "caution",
      verdictMessage: `注意：${reasons.join("、")}。建議攜帶雨具或提早出發。`,
    };
  }

  return {
    status: "safe",
    verdictMessage: "天氣狀況良好，適合出發。",
  };
}

/** 降雨時段（來自 CWB rainfall12h） */
export interface RainfallPeriod {
  pop: number;
  label: string;
  endLabel?: string;
}

/**
 * 依各區段 12 小時降雨機率，計算路線最佳騎乘時段
 * 取各時段平均降雨機率最低的時段
 */
export function computeBestTimeToRide(
  segments: (RouteSegment & { rainfall12h?: RainfallPeriod[] })[]
): string {
  const withRainfall = segments.filter((s) => s.rainfall12h && s.rainfall12h.length > 0);
  if (withRainfall.length === 0) return "";

  const len = Math.min(...withRainfall.map((s) => s.rainfall12h!.length));
  if (len === 0) return "";

  let bestIdx = 0;
  let bestAvg = Infinity;
  for (let i = 0; i < len; i++) {
    const avg =
      withRainfall.reduce((s, seg) => s + (seg.rainfall12h![i]?.pop ?? 0), 0) /
      withRainfall.length;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestIdx = i;
    }
  }

  const first = withRainfall[0]!.rainfall12h![bestIdx];
  const end = first?.endLabel ?? "";
  return first?.label && end ? `${first.label} - ${end}` : first?.label ?? "";
}  