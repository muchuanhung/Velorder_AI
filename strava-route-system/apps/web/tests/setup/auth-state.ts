/** 登入狀態（含 session cookie）存放位置，已被 .gitignore 排除 */
export const AUTH_STATE_PATH = "playwright/.auth/user.json";

export const hasTestAccount = () =>
  Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);

export const NO_ACCOUNT_REASON = "未設定測試帳號（.env.local 的 E2E_USER_EMAIL／E2E_USER_PASSWORD）";
