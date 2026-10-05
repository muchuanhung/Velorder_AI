# 曉行 / Routecast（repo: Velorder_AI）

主程式在 strava-route-system/apps/web（Next.js 16、TypeScript、Firebase Auth、Inngest）。
期中起後端改 FastAPI＋MySQL＋S3，部署在 AWS；前端留 Vercel。

## 工作規則
- 繁體中文回覆，先給結論；要程式就給能跑的碼，不要教學腔。
- 任務完成且驗證指令都跑過後，直接 commit、push 並開 draft PR，不用等我說「commit」；一律在新 branch，不動 main。我會在 PR 裡 review，回饋在對話裡告訴你。
- 只做我指定的那一個任務，不順手重構其他東西。
- 實際技術棧以程式碼為準，不以 README 舊內容為準。
- 不重開命名討論（長期品牌曉行，這學期投影片與 demo 用同一個名字）。
- 不做：導航、團騎位置分享、第二個 component library、Auth 重寫。

## 產品鐵律
- 未判定 ≠ 安全。任何資料缺失、過期、超出預報時段，一律回 unknown，不准判成安全。
- 判定只用規則式邏輯，LLM 不參與判定，只負責把既有判定翻成一句話。
- briefing.ts、road-events.ts、recon-geo.ts 要保持純函式，之後 1:1 移植 Python，
  所以改它們時要同步維護共用的 JSON fixture。

## 驗證指令
cd strava-route-system/apps/web
pnpm test:unit        # 純函式測試，改完必跑
pnpm exec tsc --noEmit
pnpm lint

## 回報格式
完成後列出：動了哪些檔案、跑了哪些指令、貼出測試輸出。測試沒過就直接說沒過，不要改測試或邏輯硬湊。
