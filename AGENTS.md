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

## PR 規範
- commit 的 author 與 committer 一律用 MuChuan Hung <mu.chuan.hung@gmail.com>，不准以 Claude 身分 commit；PR 的 contributor 不能出現 Claude。
- commit 訊息、PR 標題與內文都不加 AI 署名：不寫 Co-Authored-By: Claude、Claude-Session、「Generated with Claude Code」或 session 連結。
- PR 一律開 draft，內文依序寫：摘要、動了哪些檔案、驗證指令與結果、已知未處理事項。
- 同一個任務的後續修正推到同一個 branch／PR，不另開 PR。
- 上面的身分、署名、branch 前綴由 `.githooks/`（pre-commit、commit-msg、pre-push）強制擋下；SessionStart 會自動設 `core.hooksPath`，本機第一次 clone 後手動跑 `git config core.hooksPath .githooks`。被擋時照訊息修正，不准用 `--no-verify` 繞過。改規則只動 `.githooks/config`。

## 雲端 session（claude.ai/code）
- 不在雲端容器跑 Docker：不啟動 dockerd，不跑 `docker build`、`docker compose`、`docker pull`。容器會重啟，daemon、映像和沒 commit 的進度會一起消失，網路還會遇到 429 和 proxy 憑證問題。
- 後端在雲端只跑不需要 Docker 的檢查：`cd backend && pip install -e ".[dev]" && pytest && ruff check . && ruff format --check .`。
- Docker 和真實 MySQL 的驗證交給 GitHub Actions：先 commit、push，再看 PR 的 CI 結果；紅燈就修好再 push。
- 一個步驟做完就 commit、push，不要累積到最後；容器重啟時才不會丟掉進度。
- 本機（自己的電腦）可以照常用 `docker compose` 驗證。

## 產品鐵律
- 未判定 ≠ 安全。任何資料缺失、過期、超出預報時段，一律回 unknown，不准判成安全。
- 判定只用規則式邏輯，LLM 不參與判定，只負責把既有判定翻成一句話。
- briefing.ts、road-events.ts、recon-geo.ts 要保持純函式，之後 1:1 移植 Python。
  開始移植時再建立共用 JSON fixture；在那之前，改它們只需補 TS 單元測試。

## 驗證指令
cd strava-route-system/apps/web
pnpm test:unit        # 純函式測試，改完必跑
pnpm exec tsc --noEmit
pnpm lint

## 回報格式
完成後列出：動了哪些檔案、跑了哪些指令、貼出測試輸出。測試沒過就直接說沒過，不要改測試或邏輯硬湊。
