/**
 * Strava 功能開關：審核期間可設為 false 關閉連動，避免使用者遇到 403。
 * 設定 NEXT_PUBLIC_STRAVA_ENABLED=false 即可
 */
export const STRAVA_ENABLED =
  process.env.NEXT_PUBLIC_STRAVA_ENABLED !== "false";

export const STRAVA_DISABLED_MESSAGE =
  "Strava 目前審核額度中，敬請期待";
