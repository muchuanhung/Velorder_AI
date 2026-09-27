/** /lab 實驗頁開關：開發環境預設開啟；正式環境需設 NEXT_PUBLIC_LAB_ENABLED=true */
export function isLabEnabled(): boolean {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- NODE_ENV 由 Next 注入，不影響 turbo 快取
  return process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_LAB_ENABLED === "true";
}
