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
    /** SVG path data for the route preview (viewBox 0 0 200 120) */
    gpxPreviewPath: string;
    /** Elevation profile points [x, elevation] */
    elevationProfile: [number, number][];
    estimatedTime: string;
    bestTimeToRide: string;
  }
  
  export const routes: Route[] = [
    {
      id: "fengguizui",
      name: "Fengguizui Climb",
      nameZh: "風櫃嘴",
      distance: 22.4,
      elevationGain: 645,
      type: "cycling",
      difficulty: "hard",
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
    {
      id: "riverside-loop",
      name: "Taipei Riverside Loop",
      nameZh: "台北河濱環線",
      distance: 35.2,
      elevationGain: 85,
      type: "cycling",
      difficulty: "easy",
      status: "safe",
      verdictMessage:
        "Clear skies along the entire riverside. Ideal conditions for a long ride.",
      segments: [
        { district: "Zhongzheng", districtZh: "中正區", rainProbability: 10, windSpeed: 8, temperature: 24, condition: "clear" },
        { district: "Datong", districtZh: "大同區", rainProbability: 12, windSpeed: 10, temperature: 23, condition: "clear" },
        { district: "Songshan", districtZh: "松山區", rainProbability: 15, windSpeed: 9, temperature: 24, condition: "clear" },
        { district: "Nangang", districtZh: "南港區", rainProbability: 18, windSpeed: 11, temperature: 23, condition: "cloudy" },
      ],
      cctvFeeds: [
        { id: "cctv-rl-1", label: "Guandu Bridge", location: "KM 0.5", lastUpdated: "1 min ago", imageSeed: 201, status: "online" },
        { id: "cctv-rl-2", label: "Daqiaotou Station", location: "KM 12.3", lastUpdated: "4 min ago", imageSeed: 202, status: "online" },
        { id: "cctv-rl-3", label: "Rainbow Bridge", location: "KM 24.6", lastUpdated: "2 min ago", imageSeed: 203, status: "online" },
        { id: "cctv-rl-4", label: "Bitan Trailhead", location: "KM 33.1", lastUpdated: "6 min ago", imageSeed: 204, status: "offline" },
      ],
      gpxPreviewPath:
        "M 15 60 C 30 58, 50 55, 70 57 C 90 60, 110 62, 130 58 C 145 55, 160 57, 175 60 C 185 62, 188 65, 185 68 C 175 72, 155 68, 135 65 C 115 62, 90 65, 60 70 C 40 73, 25 68, 15 65 Z",
      elevationProfile: [
        [0, 15], [5, 18], [10, 22], [15, 20], [20, 25],
        [25, 22], [30, 18], [35.2, 15],
      ],
      estimatedTime: "1h 30m",
      bestTimeToRide: "Any time today",
    },
    {
      id: "wulai-trail",
      name: "Wulai Hot Spring Run",
      nameZh: "烏來溫泉跑",
      distance: 12.8,
      elevationGain: 320,
      type: "running",
      difficulty: "moderate",
      status: "safe",
      verdictMessage:
        "Mild conditions with light cloud cover. Trail surfaces may be damp from overnight moisture.",
      segments: [
        { district: "Xindian", districtZh: "新店區", rainProbability: 20, windSpeed: 6, temperature: 22, condition: "cloudy" },
        { district: "Wulai", districtZh: "烏來區", rainProbability: 28, windSpeed: 8, temperature: 20, condition: "cloudy" },
      ],
      cctvFeeds: [
        { id: "cctv-wu-1", label: "Xindian Bridge", location: "KM 1.2", lastUpdated: "3 min ago", imageSeed: 301, status: "online" },
        { id: "cctv-wu-2", label: "Wulai Falls", location: "KM 9.5", lastUpdated: "2 min ago", imageSeed: 302, status: "online" },
      ],
      gpxPreviewPath:
        "M 20 80 C 35 75, 50 65, 65 50 C 75 40, 85 35, 100 30 C 115 28, 130 35, 145 45 C 155 52, 165 58, 175 55",
      elevationProfile: [
        [0, 80], [2, 120], [4, 180], [6, 240], [8, 290],
        [10, 310], [12.8, 320],
      ],
      estimatedTime: "1h 15m",
      bestTimeToRide: "6:00 - 10:00 AM",
    },
    {
      id: "maokong",
      name: "Maokong Tea Trail",
      nameZh: "貓空茶園步道",
      distance: 8.5,
      elevationGain: 280,
      type: "running",
      difficulty: "moderate",
      status: "risky",
      verdictMessage:
        "Thunderstorm warning in Wenshan district until 3 PM. Trail is likely slippery. Recommend indoor alternatives.",
      segments: [
        { district: "Wenshan", districtZh: "文山區", rainProbability: 85, windSpeed: 25, temperature: 18, condition: "stormy" },
        { district: "Muzha", districtZh: "木柵區", rainProbability: 80, windSpeed: 22, temperature: 19, condition: "stormy" },
      ],
      cctvFeeds: [
        { id: "cctv-mk-1", label: "Taipei Zoo Gate", location: "KM 0.3", lastUpdated: "1 min ago", imageSeed: 401, status: "online" },
        { id: "cctv-mk-2", label: "Maokong Gondola", location: "KM 4.2", lastUpdated: "8 min ago", imageSeed: 402, status: "degraded" },
        { id: "cctv-mk-3", label: "Tea Plantation", location: "KM 7.1", lastUpdated: "12 min ago", imageSeed: 403, status: "offline" },
      ],
      gpxPreviewPath:
        "M 25 85 C 40 78, 55 60, 70 42 C 80 32, 95 25, 110 22 C 120 20, 135 25, 150 30 C 160 34, 170 42, 175 50",
      elevationProfile: [
        [0, 60], [1.5, 110], [3, 170], [4.5, 220], [6, 260], [7.5, 275], [8.5, 280],
      ],
      estimatedTime: "55m",
      bestTimeToRide: "Tomorrow 7 AM",
    },
    {
      id: "bali-coast",
      name: "Bali Left Bank Coast",
      nameZh: "八里左岸海線",
      distance: 18.6,
      elevationGain: 45,
      type: "cycling",
      difficulty: "easy",
      status: "safe",
      verdictMessage:
        "Beautiful clear weather along the coast. Light tailwind from the south. Perfect for sunset ride.",
      segments: [
        { district: "Bali", districtZh: "八里區", rainProbability: 5, windSpeed: 14, temperature: 25, condition: "clear" },
        { district: "Linkou", districtZh: "林口區", rainProbability: 8, windSpeed: 12, temperature: 24, condition: "clear" },
        { district: "Tamsui", districtZh: "淡水區", rainProbability: 10, windSpeed: 16, temperature: 24, condition: "clear" },
      ],
      cctvFeeds: [
        { id: "cctv-bc-1", label: "Bali Ferry Pier", location: "KM 0.8", lastUpdated: "2 min ago", imageSeed: 501, status: "online" },
        { id: "cctv-bc-2", label: "Shihsanhang Museum", location: "KM 8.3", lastUpdated: "1 min ago", imageSeed: 502, status: "online" },
        { id: "cctv-bc-3", label: "Tamsui Fisherman Wharf", location: "KM 16.2", lastUpdated: "4 min ago", imageSeed: 503, status: "online" },
      ],
      gpxPreviewPath:
        "M 15 55 C 30 52, 50 58, 70 54 C 90 50, 110 56, 130 53 C 150 50, 165 54, 180 52",
      elevationProfile: [
        [0, 8], [3, 12], [6, 10], [9, 15], [12, 12], [15, 10], [18.6, 8],
      ],
      estimatedTime: "50m",
      bestTimeToRide: "4:00 - 6:30 PM",
    },
  ];
  
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