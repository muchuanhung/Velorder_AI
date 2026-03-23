// Route Intelligence data models

export interface RouteSegment {
  district: string;
  districtZh: string;
  county?: string;
  rainProbability: number;
  windSpeed: number;
  temperature: number;
  condition: "clear" | "cloudy" | "rainy" | "stormy";
  /** 路段標籤，如「文山區 → 深坑區」 */
  segmentLabel?: string;
  /** 該路段 GPX 軌跡的 bbox，供 CCTV 查詢使用 */
  segmentBbox?: [number, number, number, number];
}

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
    type: "自行車" | "跑步" | "健行" | "雪巴運動" | "混合";
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
 * 依各區段降雨機率，計算建議出發時間
 * 取平均降雨機率最低時段的起始時間
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
  return first?.label ?? "";
}  