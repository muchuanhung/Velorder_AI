import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  // Playwright 產生的報告與測試結果
  { ignores: ["playwright-report/**", "test-results/**"] },
];
