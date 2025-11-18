<img src="https://github.com/user-attachments/assets/71bff9ef-a15e-42be-8c98-64f7fc981cfe" alt="App-icon" width="100" />

## 專案名稱
#  Velorder_AI(Strava + 推薦路線系統（AI 自動推薦跑步 / 騎行路線)

##  🚴‍♂️專案介紹
> Strava Route AI 是一個結合 Strava 活動資料、即時氣象與路況的智慧路線推薦系統。使用者可快速產生個人化的跑步或騎行路線，並在危險天氣或路況變化時收到即時警示。

## 🗂️ 主要分類（模組化說明）
> # 認證與資料整合（Integration）
> 功能：Strava OAuth、資料匯入（活動、路線、segments）、定期同步（webhook / cron）。
> 技術範例：Strava API、OAuth2、Webhook、後端 jobs。

> # 資料庫與 Schema（Storage）
> 功能：使用者 profile、歷史活動、儲存推薦路線（GPX / GeoJSON）、路線評分紀錄、偏好設定。
> 技術範例：PostgreSQL + PostGIS（地理空間查詢）、Prisma schema。

> # 路線推薦引擎（Recommendation Engine）
> 功能：根據使用者偏好（距離、坡度、路面、熱門度）與即時資料（天氣/路況）輸出路線候選、打分、排序。
> 技術範例：route-engine package（A*/Dijkstra、OSRM/GraphHopper、LLM prompt + heuristic scoring）、Python 或 Node.js microservice。

> # 即時資料整合（Real-time Feeds）
> 功能：氣象（CWB 或其他）、交通（TDX）、道路事件（事故/施工）、使用者即時位置上報。
> 技術範例：第三方 API、Convex 或 WebSocket、Inngest for event triggers。

> # 前端展示與互動（Frontend）
> 功能：地圖可視化（GPX/GeoJSON）、路線編輯、偏好設定、活動檢視、即時通知。
> 技術範例：Next.js 16 + TypeScript + Tailwind、Mapbox/Leaflet、React Query。

> # 背景處理與運算（Background / Compute）
> 功能：重運算（route generation、elevation processing）、影片/圖像渲染（如要產生路線快照）、批次同步。
> 技術範例：Cloud Run / Cloud Functions、Inngest、容器化 workers。

> # AI 與提示工程（AI / LLM）
> 功能：自然語言偏好解析（user prompt → structured preferences）、生成路線描述、候選過濾邏輯、可選的 ML 模型做個人化推薦。
> 技術範例：OpenAI / LLM、prompt templates、微調／上下文回饋 loop。

> # 安全與權限（Auth & Ops）
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
