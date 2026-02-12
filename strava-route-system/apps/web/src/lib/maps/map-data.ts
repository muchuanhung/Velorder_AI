// Taiwan district GeoJSON + CWA rain probability + TDX incident mock data

import { getTaiwanTownshipsFromTopojson } from "./taiwan-towns-topojson";

export interface District {
  id: string;
  name: string;
  nameZh: string;
  rainProbability: number; // 0-100
  center: [number, number]; // [lng, lat]
  /** Simplified polygon paths for SVG rendering (percentage-based for the viewport) */
  path: string;
  isCurrentDistrict: boolean;
  /** 鄉鎮區時才有 */
  countyName?: string;
  townName?: string;
}

export interface Incident {
  id: string;
  type: "accident" | "construction";
  title: string;
  description: string;
  location: string;
  expectedClearance: string;
  severity: "low" | "medium" | "high";
  /** Position as percentage of map viewport [x%, y%] */
  position: [number, number];
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  rainProbability: number;
  aqi: number;
  uvIndex: number;
  updatedAt: string;
}

// 22 districts/cities of Taiwan with approximate SVG polygon paths
export const taiwanDistricts: District[] = [
  {
    id: "taipei",
    name: "Taipei City",
    nameZh: "台北市",
    rainProbability: 65,
    center: [121.5654, 25.033],
    path: "M 62.5 12.5 L 65 11 L 67.5 12 L 68 14.5 L 66 16 L 63 15.5 Z",
    isCurrentDistrict: true,
  },
  {
    id: "new-taipei",
    name: "New Taipei City",
    nameZh: "新北市",
    rainProbability: 60,
    center: [121.4628, 25.0118],
    path: "M 58 9 L 63 8 L 69 10 L 70 15 L 68 18 L 64 19 L 59 17 L 57 13 Z",
    isCurrentDistrict: false,
  },
  {
    id: "keelung",
    name: "Keelung City",
    nameZh: "基隆市",
    rainProbability: 72,
    center: [121.7391, 25.1276],
    path: "M 68 8 L 70 7.5 L 71.5 9 L 70.5 10.5 L 68.5 10 Z",
    isCurrentDistrict: false,
  },
  {
    id: "taoyuan",
    name: "Taoyuan City",
    nameZh: "桃園市",
    rainProbability: 45,
    center: [121.3009, 24.9936],
    path: "M 50 14 L 57 12 L 59 16 L 58 20 L 52 19 L 49 17 Z",
    isCurrentDistrict: false,
  },
  {
    id: "hsinchu-city",
    name: "Hsinchu City",
    nameZh: "新竹市",
    rainProbability: 35,
    center: [120.9647, 24.8138],
    path: "M 46 20 L 49 19 L 50 21 L 48 22.5 L 46 22 Z",
    isCurrentDistrict: false,
  },
  {
    id: "hsinchu-county",
    name: "Hsinchu County",
    nameZh: "新竹縣",
    rainProbability: 40,
    center: [121.1252, 24.8392],
    path: "M 49 18 L 55 17 L 57 20 L 55 23 L 50 23 L 48 21 Z",
    isCurrentDistrict: false,
  },
  {
    id: "miaoli",
    name: "Miaoli County",
    nameZh: "苗栗縣",
    rainProbability: 30,
    center: [120.8214, 24.56],
    path: "M 44 23 L 50 22 L 54 24 L 53 28 L 48 29 L 43 27 Z",
    isCurrentDistrict: false,
  },
  {
    id: "taichung",
    name: "Taichung City",
    nameZh: "台中市",
    rainProbability: 25,
    center: [120.6736, 24.1477],
    path: "M 40 28 L 48 27 L 55 29 L 56 34 L 50 37 L 42 35 L 39 32 Z",
    isCurrentDistrict: false,
  },
  {
    id: "changhua",
    name: "Changhua County",
    nameZh: "彰化縣",
    rainProbability: 20,
    center: [120.5161, 24.0518],
    path: "M 36 34 L 42 33 L 44 37 L 41 40 L 36 39 L 35 36 Z",
    isCurrentDistrict: false,
  },
  {
    id: "nantou",
    name: "Nantou County",
    nameZh: "南投縣",
    rainProbability: 55,
    center: [120.6837, 23.9609],
    path: "M 43 34 L 52 33 L 56 36 L 55 42 L 48 44 L 42 41 L 41 37 Z",
    isCurrentDistrict: false,
  },
  {
    id: "yunlin",
    name: "Yunlin County",
    nameZh: "雲林縣",
    rainProbability: 15,
    center: [120.5313, 23.7092],
    path: "M 34 40 L 41 39 L 43 43 L 39 46 L 34 45 L 33 42 Z",
    isCurrentDistrict: false,
  },
  {
    id: "chiayi-city",
    name: "Chiayi City",
    nameZh: "嘉義市",
    rainProbability: 10,
    center: [120.4518, 23.4801],
    path: "M 36 47 L 39 46 L 40 48 L 38 49 L 36 48.5 Z",
    isCurrentDistrict: false,
  },
  {
    id: "chiayi-county",
    name: "Chiayi County",
    nameZh: "嘉義縣",
    rainProbability: 18,
    center: [120.574, 23.4588],
    path: "M 33 45 L 40 44 L 48 46 L 47 51 L 40 53 L 33 50 Z",
    isCurrentDistrict: false,
  },
  {
    id: "tainan",
    name: "Tainan City",
    nameZh: "台南市",
    rainProbability: 8,
    center: [120.2269, 23.0],
    path: "M 30 51 L 38 50 L 42 53 L 41 58 L 35 60 L 29 57 L 28 54 Z",
    isCurrentDistrict: false,
  },
  {
    id: "kaohsiung",
    name: "Kaohsiung City",
    nameZh: "高雄市",
    rainProbability: 12,
    center: [120.3014, 22.627],
    path: "M 33 57 L 42 55 L 50 57 L 52 64 L 46 70 L 38 71 L 32 67 L 31 62 Z",
    isCurrentDistrict: false,
  },
  {
    id: "pingtung",
    name: "Pingtung County",
    nameZh: "屏東縣",
    rainProbability: 22,
    center: [120.5484, 22.5519],
    path: "M 38 68 L 46 67 L 52 70 L 53 77 L 48 83 L 42 84 L 37 80 L 36 74 Z",
    isCurrentDistrict: false,
  },
  {
    id: "yilan",
    name: "Yilan County",
    nameZh: "宜蘭縣",
    rainProbability: 78,
    center: [121.7195, 24.7021],
    path: "M 67 14 L 73 12 L 76 15 L 75 20 L 70 22 L 66 19 Z",
    isCurrentDistrict: false,
  },
  {
    id: "hualien",
    name: "Hualien County",
    nameZh: "花蓮縣",
    rainProbability: 50,
    center: [121.6014, 23.9915],
    path: "M 66 22 L 74 20 L 78 25 L 77 38 L 72 44 L 64 42 L 60 35 L 62 27 Z",
    isCurrentDistrict: false,
  },
  {
    id: "taitung",
    name: "Taitung County",
    nameZh: "台東縣",
    rainProbability: 35,
    center: [121.1466, 22.797],
    path: "M 56 44 L 68 42 L 72 48 L 71 58 L 66 65 L 56 66 L 52 60 L 53 50 Z",
    isCurrentDistrict: false,
  },
  {
    id: "penghu",
    name: "Penghu County",
    nameZh: "澎湖縣",
    rainProbability: 42,
    center: [119.5793, 23.5711],
    path: "M 16 46 L 19 44 L 21 46 L 20 49 L 17 50 L 15 48 Z",
    isCurrentDistrict: false,
  },
  {
    id: "kinmen",
    name: "Kinmen County",
    nameZh: "金門縣",
    rainProbability: 28,
    center: [118.3171, 24.4493],
    path: "M 4 28 L 8 27 L 10 29 L 8 31 L 5 31 Z",
    isCurrentDistrict: false,
  },
  {
    id: "lienchiang",
    name: "Lienchiang County",
    nameZh: "連江縣",
    rainProbability: 55,
    center: [119.9399, 26.1505],
    path: "M 8 4 L 11 3 L 12 5 L 10 6.5 L 8 6 Z",
    isCurrentDistrict: false,
  },
];

/**
 * 從 LocationContext 的 LocationInfo 取得 縣市鄉鎮區 字串
 * 格式如 "台北市大安區"，供 getTaiwanTownships 使用
 */
export function getCurrentLocationFromInfo(info: {
  county?: string;
  city?: string;
  district?: string;
} | null): string {
  if (!info) return "台北市大安區";
  const county = info.county ?? info.city ?? "";
  const district = info.district ?? "";
  const s = county && district ? `${county}${district}` : county || "台北市大安區";
  return s.replace(/\s/g, "");
}

/**
 * 鄉鎮區 (~368)，例如 台北市大安區
 * @param currentLocation 使用者位置，格式 "縣市鄉鎮區" 如 "台北市大安區"
 * @param lngLat 若有經緯度則用 point-in-polygon 找出鄉鎮區，優先於 currentLocation
 */
export function getTaiwanTownships(
  currentLocation = "台北市大安區",
  lngLat?: [number, number]
): District[] {
  const towns = getTaiwanTownshipsFromTopojson(currentLocation, lngLat);
  return towns.map((t) => ({
    id: t.id,
    name: t.name,
    nameZh: t.nameZh,
    rainProbability: t.rainProbability,
    center: t.center,
    path: t.path,
    isCurrentDistrict: t.isCurrentDistrict,
    countyName: t.countyName,
    townName: t.townName,
  }));
}

export const tdxIncidents: Incident[] = [
  {
    id: "inc-001",
    type: "accident",
    title: "Multi-vehicle collision",
    description:
      "3-car collision on National Highway 1 near Taipei interchange. Two lanes blocked, emergency services on scene.",
    location: "National Highway 1, KM 25.3",
    expectedClearance: "14:30 CST",
    severity: "high",
    position: [63, 14],
  },
  {
    id: "inc-002",
    type: "construction",
    title: "Bridge expansion joint repair",
    description:
      "Scheduled maintenance on Zhongzheng Bridge. Right lane closed for joint replacement work.",
    location: "Zhongzheng Bridge, Sec. 2",
    expectedClearance: "18:00 CST",
    severity: "medium",
    position: [58, 17],
  },
  {
    id: "inc-003",
    type: "accident",
    title: "Motorcycle accident",
    description:
      "Single motorcycle accident on Provincial Highway 9 near Yilan. Rider transported to hospital, debris being cleared.",
    location: "Provincial Hwy 9, KM 42",
    expectedClearance: "13:00 CST",
    severity: "medium",
    position: [72, 18],
  },
  {
    id: "inc-004",
    type: "construction",
    title: "Road resurfacing project",
    description:
      "Major resurfacing work on Highway 3 through Miaoli County. Alternating lane closures in effect.",
    location: "Highway 3, KM 110-115",
    expectedClearance: "22:00 CST (daily)",
    severity: "low",
    position: [47, 26],
  },
  {
    id: "inc-005",
    type: "accident",
    title: "Truck rollover",
    description:
      "Cargo truck rollover on National Highway 3 near Taichung. All southbound lanes temporarily closed for crane operations.",
    location: "National Highway 3, KM 175",
    expectedClearance: "16:45 CST",
    severity: "high",
    position: [44, 32],
  },
  {
    id: "inc-006",
    type: "construction",
    title: "Tunnel lighting upgrade",
    description:
      "LED lighting installation in Xueshan Tunnel. Speed reduced to 60 km/h in tunnel section.",
    location: "Xueshan Tunnel, Hwy 5",
    expectedClearance: "Mar 15, 2026",
    severity: "low",
    position: [69, 16],
  },
  {
    id: "inc-007",
    type: "construction",
    title: "Sewer line replacement",
    description:
      "Underground sewer replacement on Kaohsiung Zhonghua Rd. Outer lane closed for excavation work.",
    location: "Zhonghua Rd, Sec. 4, Kaohsiung",
    expectedClearance: "Apr 02, 2026",
    severity: "medium",
    position: [38, 63],
  },
  {
    id: "inc-008",
    type: "accident",
    title: "Bus-scooter collision",
    description:
      "City bus and scooter collision at Tainan Minzu Rd intersection. Minor injuries, traffic officers directing flow.",
    location: "Minzu & Zhongshan Rd, Tainan",
    expectedClearance: "12:15 CST",
    severity: "medium",
    position: [33, 55],
  },
];

export const currentWeather: WeatherData = {
  temperature: 22,
  humidity: 78,
  windSpeed: 12,
  condition: "Partly Cloudy",
  rainProbability: 65,
  aqi: 42,
  uvIndex: 3,
  updatedAt: "12:05 PM CST",
};

/** Returns a color based on rain probability percentage */
export function getRainColor(probability: number): string {
  if (probability <= 20) return "#87CEEB"; // Light SkyBlue
  if (probability <= 40) return "#6BA3D6";
  if (probability <= 60) return "#4169E1"; // RoyalBlue
  if (probability <= 80) return "#2B4B9E";
  return "#0A1E5C"; // Deep Navy
}

/** Returns opacity based on rain probability */
export function getRainOpacity(probability: number): number {
  return 0.25 + (probability / 100) * 0.55;
}

// --- Marker clustering ---

export interface Cluster {
  id: string;
  /** Centroid position [x%, y%] */
  position: [number, number];
  incidents: Incident[];
  /** Highest severity in cluster */
  maxSeverity: "low" | "medium" | "high";
  /** Whether cluster has any accidents */
  hasAccident: boolean;
  /** Whether cluster has any construction */
  hasConstruction: boolean;
}

/**
 * Groups nearby incidents into clusters using a simple grid-based spatial hash.
 * `radius` is in viewport-percentage units; higher zoom = smaller effective radius.
 */
export function clusterIncidents(
  incidents: Incident[],
  radius: number
): (Cluster | Incident)[] {
  if (radius <= 0) return incidents;

  const assigned = new Set<string>();
  const results: (Cluster | Incident)[] = [];

  // Sort by position for deterministic clustering
  const sorted = [...incidents].sort(
    (a, b) => a.position[0] - b.position[0] || a.position[1] - b.position[1]
  );

  for (const incident of sorted) {
    if (assigned.has(incident.id)) continue;

    // Find all unassigned incidents within radius
    const neighbors = sorted.filter((other) => {
      if (assigned.has(other.id)) return false;
      const dx = incident.position[0] - other.position[0];
      const dy = incident.position[1] - other.position[1];
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });

    if (neighbors.length > 1) {
      // Form a cluster
      for (const n of neighbors) assigned.add(n.id);

      const cx =
        neighbors.reduce((sum, n) => sum + n.position[0], 0) /
        neighbors.length;
      const cy =
        neighbors.reduce((sum, n) => sum + n.position[1], 0) /
        neighbors.length;

      const severityOrder = { low: 0, medium: 1, high: 2 } as const;
      const maxSev = neighbors.reduce(
        (max, n) =>
          severityOrder[n.severity] > severityOrder[max]
            ? n.severity
            : max,
        "low" as Incident["severity"]
      );

      results.push({
        id: `cluster-${neighbors.map((n) => n.id).join("-")}`,
        position: [cx, cy],
        incidents: neighbors,
        maxSeverity: maxSev,
        hasAccident: neighbors.some((n) => n.type === "accident"),
        hasConstruction: neighbors.some((n) => n.type === "construction"),
      });
    } else {
      assigned.add(incident.id);
      results.push(incident);
    }
  }

  return results;
}

/** Type guard: check if an item is a Cluster */
export function isCluster(item: Cluster | Incident): item is Cluster {
  return "incidents" in item && Array.isArray((item as Cluster).incidents);
}