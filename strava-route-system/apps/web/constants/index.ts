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

