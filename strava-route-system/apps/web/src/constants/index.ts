export type AthleteFieldKey =
  | "name"
  | "username"
  | "city"
  | "country"
  | "premium";

export type AthleteField = {
  key: AthleteFieldKey;
  label: string;
  optional?: boolean;
  formatter?: (value: unknown) => string;
};

export type AthleteState = {
  id: string;
  name: string;
  username: string;
  city: string;
  country: string;
  premium: boolean;
  profile: string;
};

export const athleteFields: AthleteField[] = [
  {
    key: "name",
    label: "姓名"
  },
  {
    key: "username",
    label: "使用者名稱",
    optional: true,
    formatter: (value) => (value ? String(value) : "未設定")
  },
  {
    key: "city",
    label: "城市",
    optional: true,
    formatter: (value) => (value ? String(value) : "未設定")
  },
  {
    key: "country",
    label: "國家",
    optional: true,
    formatter: (value) => (value ? String(value) : "未設定")
  },
  {
    key: "premium",
    label: "Premium",
    formatter: (value) => (value ? "是" : "否")
  }
];

export type ActivityFieldKey = "name" | "distance" | "moving_time";

export type ActivityField = {
  key: ActivityFieldKey;
  label: string;
  formatter?: (value: unknown) => string;
};

export type ActivityState = {
  id: number | string;
  name: string;
  distance: number | null;
  moving_time: number | null;
};

export const activityFields: ActivityField[] = [
  {
    key: "name",
    label: "名稱"
  },
  {
    key: "distance",
    label: "距離",
    formatter: (value) => {
      const distance =
        typeof value === "number"
          ? value
          : value == null
          ? null
          : Number(value);
      if (distance == null || Number.isNaN(distance)) {
        return "未提供";
      }
      return `${(distance / 1000).toFixed(2)} km`;
    }
  },
  {
    key: "moving_time",
    label: "移動時間",
    formatter: (value) => {
      const seconds =
        typeof value === "number"
          ? value
          : value == null
          ? null
          : Number(value);
      if (seconds == null || Number.isNaN(seconds)) {
        return "未提供";
      }
      return `${Math.round(seconds / 60)} 分鐘`;
    }
  }
];

export function mapSearchParamsToAthlete(
  userId: string,
  searchParams: Record<string, string | string[] | undefined>
): AthleteState {
  const getString = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };

  return {
    id: userId,
    name: getString("athlete_name") || "未知使用者",
    username: getString("athlete_username"),
    city: getString("athlete_city"),
    country: getString("athlete_country"),
    premium: getString("athlete_premium") === "true",
    profile: getString("athlete_profile")
  };
}

export function getInitials(
  displayName: string | null,
  email: string | null
): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function getMonthRange(
  year: number,
  month: number
): { after: number; before: number } {
  const after = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  const before = Math.floor(
    new Date(year, month, 0, 23, 59, 59, 999).getTime() / 1000
  );
  return { after, before };
}

/** 回傳某個 (year, month) 的 YYYY-MM 字串，month 為 1–12 */
function toYYYYMM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getLastMonthYearMonth(): { year: number; month: number } {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** 判斷是否為「當前日曆月」。Strava start_date_local 如 "2026-02-08T16:24:59Z"，取前 7 字元 YYYY-MM 比對 */
export function isThisMonth(isoDateLocal: string): boolean {
  const now = new Date();
  const yyyyMm = isoDateLocal.slice(0, 7);
  return yyyyMm === toYYYYMM(now.getFullYear(), now.getMonth() + 1);
}

/** 判斷是否為「上一個日曆月」。同上，只比對 YYYY-MM */
export function isLastMonth(isoDateLocal: string): boolean {
  const { year, month } = getLastMonthYearMonth();
  return isoDateLocal.slice(0, 7) === toYYYYMM(year, month);
}

/** ISO 日期字串轉成相對顯示：Today/Yesterday + 時間，或 Short Date */
export function formatActivityDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = d.toDateString();
  if (dateStr === today)
    return `Today, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  if (dateStr === yesterday.toDateString())
    return `Yesterday, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** 公尺轉成距離顯示字串（km），≥1000 km 顯示為 "X.Xk km" */
export function formatActivityDistance(meters: number): string {
  const km = meters / 1000;
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`;
}
