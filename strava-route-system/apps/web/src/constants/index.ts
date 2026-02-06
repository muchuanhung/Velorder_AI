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
