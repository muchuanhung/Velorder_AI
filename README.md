<img src="https://github.com/user-attachments/assets/71bff9ef-a15e-42be-8c98-64f7fc981cfe" alt="App-icon" width="100" />

## 專案名稱
#  Velorder_AI(Strava + 推薦路線系統（AI 自動推薦跑步 / 騎行路線)

##  🚴‍♂️專案介紹
> Strava Route AI 是一個結合 Strava 活動資料、即時氣象與路況安全示警系統。使用者可以根據危險天氣或路況變化時收到即時警示。

## 🗂️ 主要分類（模組化說明）
### 認證與資料整合（Integration）
> 功能：Strava OAuth、資料匯入（活動、路線、segments）、定期同步（webhook / cron）。
> 技術範例：Strava API、OAuth2、Webhook、後端 jobs。

### 資料庫與 Schema（Storage）
> 功能：使用者 profile、歷史活動、儲存推薦路線（GPX / GeoJSON）、路線評分紀錄、偏好設定。
> 技術範例：PostgreSQL + PostGIS（地理空間查詢）、Prisma schema。

### 即時資料整合（Real-time Feeds）
> 功能：氣象（CWB 或其他）、交通（TDX）、道路事件（事故/施工）、使用者即時位置上報。
> 技術範例：第三方 API、Convex 或 WebSocket、Inngest for event triggers。

### 前端展示與互動（Frontend）
> 功能：地圖可視化（GPX/GeoJSON）、路線編輯、偏好設定、活動檢視、即時通知。
> 技術範例：Next.js 16 + TypeScript + Tailwind、Mapbox/Leaflet、React Query。

### 背景處理與運算（Background / Compute）
> 功能：重運算（route generation、elevation processing）、影片/圖像渲染（如要產生路線快照）、批次同步。
> 技術範例：Cloud Run / Cloud Functions、Inngest、容器化 workers。

### AI 與提示工程（AI / LLM）
> 功能：自然語言偏好解析（user prompt → structured preferences）、生成路線描述、候選過濾邏輯、可選的 ML 模型做個人化推薦。
> 技術範例：OpenAI / LLM、prompt templates、微調／上下文回饋 loop。

### 安全與權限（Auth & Ops）
> 功能：使用者驗證、Strava token 管理、API rate limit、日誌與監控。
> 技術範例：Clerk（或 Auth0）、Redis（token cache）、Cloud Monitoring / Sentry。


## 專案團隊
| 開發人員 | 負責開發範圍 |
| -------- | -------------------------------------- |
| Muchuanhung    | 全端開發 |

## 專案使用技術
| 技術 | 用途 |
|------|------|
| **Next.js 16 + TypeScript + Tailwind v4；Mapbox / react-leafle** | 前端 |
| **tRPC（type-safe）或 Fastify/Nest（REST）** | API Layer |
| **PostgreSQL + PostGIS，Prisma 作為 ORM** | 資料庫 |
| **Convex（live queries）或 WebSocket；React Query 前端 cache** | 即時同步 |
| **Inngest（event-driven）+ Cloud Run workers** | Background jobs |
| **OSRM / GraphHopper 或自訂 A*/Dijkstra + OSM data** | Route Computation |
| **OpenAI（prompt → structured preference）；選擇性使用 ML 模型做個性化** | AI |
| **Clerk（或 Auth0） + Strava OAuth** | Auth |
| **GCS / S3（GPX/快照等大型檔案）** | Storage |
| **GitHub Actions + Turborepo Remote Cache（加速 build）** | CI / CD |

## 📡 事件驅動背景流程（Inngest）

| 事件 | 觸發點 | 處理內容 |
|------|--------|----------|
| `strava/sync-activities` | 使用者完成 `/api/strava` OAuth callback 後即時送出 | 由 `inngest/functions.ts` 呼叫 Strava API 拉取最新活動並暫存，確保授權完馬上開始同步 |
| `route/generate` | `POST /api/routes/generate`（需登入） | 將使用者輸入的起點與偏好排入背景工作，計算候選路線並暫存給 UI 讀取 |
| `strava/sync-all` | Inngest Cron `0 * * * *`（每小時） | 讀取目前有效的 Strava token，批次送出 `strava/sync-activities` 事件確保資料保持新鮮 |

### 建置與執行

1. 於 `strava-route-system/apps/web/.env.local` 設定必要環境變數：
   ```
   STRAVA_CLIENT_ID=xxx
   STRAVA_CLIENT_SECRET=xxx
   STRAVA_REDIRECT_URI=http://localhost:3000/api/strava
   INNGEST_EVENT_KEY=dev-local
   INNGEST_SIGNING_KEY=dev-signing-key
   ```
2. 安裝依賴並啟動 Next.js：`pnpm install && pnpm --filter web dev`
3. 另開終端執行 Inngest Dev Server：`pnpm --filter web inngest:dev`
4. 登入後點擊「連結 Strava」，授權完成會自動送出 `strava/sync-activities`
5. 若要測試路線計算，可對 `/api/routes/generate` 發送 `POST` 請求（body 包含 `startPoint` 與 `preferences`），工作會由 `route/generate` function 背景執行
6. Cron 任務 `strava/sync-all` 預設每小時觸發，可於 Inngest 儀表板手動觸發以驗證批次同步

> 註：目前資料仍暫存於記憶體，實務上可替換為 Prisma/Postgres，以符合雲端部署需求。
