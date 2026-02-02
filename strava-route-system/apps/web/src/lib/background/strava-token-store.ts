export type StravaTokenRecord = {
  userId: string;
  athleteId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  updatedAt: number;
};

const tokenStore = new Map<string, StravaTokenRecord>();

/**
 * 儲存或取代使用者的 Strava token。
 */
export function upsertStravaToken(record: Omit<StravaTokenRecord, "updatedAt">) {
  tokenStore.set(record.userId, { ...record, updatedAt: Date.now() });
}

/**
 * 取得單一使用者的 token 記錄。
 */
export function getStravaToken(userId: string) {
  return tokenStore.get(userId);
}

/**
 * 列出所有仍有效的 token，提供 Cron 定期同步使用。
 */
export function listActiveStravaTokens() {
  const now = Date.now();
  return Array.from(tokenStore.values()).filter(
    (record) => record.expiresAt * 1000 > now
  );
}
