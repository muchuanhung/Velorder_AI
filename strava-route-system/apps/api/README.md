# Routecast API（FastAPI）

自有後端：Firebase Auth 只負責「誰登入」，會員與 GPX 等業務資料存在自有 MySQL，GPX 檔本體放 S3 相容物件儲存（本機為檔案系統或 MinIO）。不使用 Firestore / Firebase Storage 存業務資料。

## 目錄

```
apps/api/
├── app/
│   ├── main.py              # create_app()、CORS、AppError → {"code","message"}
│   ├── core/                # config（env）、db（engine/session）、security（session JWT）、errors
│   ├── api/deps.py          # DI：settings / db / verifier / storage / current member
│   ├── routers/             # HTTP 層：health、auth（/auth/session、/members/me）、gpx
│   ├── services/            # 業務邏輯：member_service（upsert + 簽 session）、gpx_service
│   ├── models/              # SQLAlchemy：members、routes
│   ├── schemas/             # Pydantic request/response
│   └── integrations/        # firebase_auth（verifier 介面）、storage（local / S3）、gpx_analysis（stub）
├── alembic/versions/        # 0001：members + routes（MySQL 另建 POINT SRID 4326 generated column）
├── tests/                   # pytest，SQLite + 假 verifier + 本機/moto 儲存
├── Dockerfile               # entrypoint 先 alembic upgrade head 再起 uvicorn
└── docker-compose.yml       # mysql 8.4 + minio（啟動時建 bucket）+ api；redis 為選用 profile
```

依賴方向：`routers → services → models / integrations`。router 不碰 SQL，service 不碰 HTTP（丟 `AppError` 子類別，由 `main.py` 轉成狀態碼）。

## 本機執行

### docker compose（MySQL + MinIO + API）

```bash
cd strava-route-system/apps/api
docker compose up --build            # API: http://localhost:8000/docs
docker compose --profile redis up    # 需要 Redis stub 時
```

- 預設 `AUTH_PROVIDER=fake`，不需 Firebase 即可測：`Authorization: Bearer fake:<uid>[:<email>]`
- 改用真的 Firebase：建立 `.env`（參考 `.env.example`），設 `AUTH_PROVIDER=firebase` 與 `FIREBASE_PROJECT_ID`（或 `FIREBASE_SERVICE_ACCOUNT_JSON`）
- MinIO console：http://localhost:9001（帳密見 compose 預設值，只限本機）
- MinIO 映像檔用 `bitnamilegacy/minio:2025.4.22`：Docker Hub 的 `minio/minio`、`minio/mc` 已不再公開提供，quay.io 也需要登入。此為封存版、不再更新，只供本機 mock
- 若 API 容器連不到 `mysql`（`Can't connect ... (timed out)`），先確認主機防火牆沒有擋 Docker bridge 的 FORWARD 流量（例如 legacy iptables 的 `FORWARD` policy 為 `DROP`）
- 容器啟動會自動 `alembic upgrade head`；`RUN_MIGRATIONS=false` 可關閉

### 不用 Docker

```bash
cd strava-route-system/apps/api
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env                 # 預設 STORAGE_BACKEND=local
alembic upgrade head                 # 需要 DATABASE_URL 指向可用的 MySQL
uvicorn app.main:app --reload
```

### 測試與 lint

```bash
pytest                               # 不需要 MySQL / Firebase / AWS
ruff check . && ruff format --check .
alembic check                        # 對 MySQL 檢查 model 與 migration 是否一致
```

CI（`.github/workflows/ci.yml` 的 `api-test`）額外以 MySQL service 跑 migration 升降級與 `alembic check`。

### 快速驗證

```bash
B=http://localhost:8000
TOKEN=$(curl -s -X POST $B/auth/session -H 'Authorization: Bearer fake:uid-demo:demo@example.com' | jq -r .access_token)
curl -s -X POST $B/gpx -H "Authorization: Bearer $TOKEN" -F 'file=@ride.gpx;type=application/gpx+xml'
curl -s $B/gpx -H "Authorization: Bearer $TOKEN"
```

## API

| Method | Path | 說明 |
|--------|------|------|
| GET | `/health` | liveness，不碰外部依賴 |
| GET | `/health/ready` | readiness，`SELECT 1`；失敗回 503 |
| POST | `/auth/session` | Firebase ID token（body `{"id_token"}` 或 `Authorization: Bearer`）→ upsert member → session |
| GET | `/members/me` | 目前會員 |
| POST | `/gpx` | multipart `file`（必填）、`name`（選填）；201 |
| GET | `/gpx?limit=&offset=` | 自己的路線，`created_at` 新到舊 |
| GET | `/gpx/{id}` | 詳細（含 `analysis` placeholder） |
| PATCH | `/gpx/{id}` | `{"name": "..."}`，1–120 字，前後空白會去掉 |
| DELETE | `/gpx/{id}` | 204；先刪 DB row 再刪物件 |
| GET | `/gpx/{id}/segments` | 分段 stub（`status: "stub"`、`placeholder: true`） |

錯誤格式統一為 `{"code": "...", "message": "..."}`；FastAPI 欄位驗證錯誤仍是預設的 `{"detail": [...]}`。

### Session 格式

`POST /auth/session` 回傳：

```json
{
  "access_token": "<HS256 JWT>",
  "token_type": "Bearer",
  "expires_at": "2026-10-09T09:00:00Z",
  "expires_in": 604800,
  "member": { "id": 1, "firebase_uid": "...", "email": "...", "status": "active", "...": "..." }
}
```

JWT claims：`iss=routecast-api`、`aud=routecast-web`、`sub=<members.id>`、`fuid=<firebase uid>`、`typ=session`、`iat`、`exp`、`jti`。之後所有請求帶 `Authorization: Bearer <access_token>`；API 每次會確認 member 存在、`status=active` 且 `fuid` 相符。

- Firebase ID token 只在換 session 時驗一次（含撤銷檢查），不在每個請求打 Firebase
- 無 server 端 session 表：登出 = 前端丟掉 token；會員停用立即生效（每次查 `members.status`）。若需要「單一裝置登出」，下一步是加 `sessions` 表依 `jti` 撤銷
- production 會拒絕 `AUTH_PROVIDER=fake` 與長度不足 32 的 `SESSION_JWT_SECRET`

### GPX 上傳檢查

| 檢查 | 失敗 |
|------|------|
| 副檔名 `.gpx`（不分大小寫） | 415 `invalid_file_type` |
| Content-Type 在 `GPX_ALLOWED_CONTENT_TYPES` | 415 `invalid_content_type` |
| 非空、≤ `GPX_MAX_BYTES`（預設 10 MB） | 422 `empty_file` / 413 `file_too_large` |
| `defusedxml` 解析、根元素 `<gpx>`、至少一個 `trkpt`/`rtept`（擋 XXE、entity 展開） | 422 `invalid_gpx` |
| 每位會員路線數 ≤ `GPX_MAX_ROUTES_PER_MEMBER` | 409 `route_quota_exceeded` |
| 非本人路線 | 一律 404 `route_not_found`（不透露 id 是否存在） |

物件 key：`gpx/members/{member_id}/{route_id}.gpx`，DB 存 key、大小、SHA-256、起點與分析欄位。`parse_gpx` 目前只算點數、起點、軌跡名稱；`distance_m`、`elevation_gain_m`、分段都是 placeholder（`parser_version: "stub-0"`）。

### 資料表

- `members`：`firebase_uid` unique，`email`、`display_name`、`photo_url`、`sign_in_provider`、`status`、`last_login_at`。重複登入只更新 email 與 provider，`display_name`/`photo_url` 已有值時不被 Firebase 覆蓋
- `routes`：UUID 主鍵、`member_id` FK（`ON DELETE CASCADE`）、`(member_id, created_at)` 索引、`analysis_status`（pending/parsed/failed，CHECK constraint）、`analysis` JSON
- MySQL 限定：`start_point POINT SRID 4326`，由 `start_lat/start_lng` 生成（STORED）。因為可能是 NULL，暫不加 SPATIAL INDEX；`alembic/env.py` 已讓 autogenerate 略過此欄

## 之後怎麼接 Next.js（`apps/web`）

建議由 Next server 端代理，token 不落在 JS 可讀的地方：

1. 前端照舊用 Firebase client 登入，拿到 ID token（現在已寫進 `firebase-id-token` cookie）
2. 新增 Next route handler（例如 `/api/session`）：server 端呼叫 `POST {ROUTECAST_API_URL}/auth/session`，把回傳的 `access_token` 寫成 httpOnly cookie（例如 `routecast-session`，`maxAge = expires_in`）
3. 私人路線頁（`/routes/private`）的上傳／列表／改名／刪除改打 Next route handler，由它帶 `Authorization: Bearer <routecast-session>` 轉發到本 API；或在 CORS 允許的前提下由瀏覽器直接呼叫（`CORS_ORIGINS` 已預設 `http://localhost:3000`）
4. 現有公開路線（Firebase Storage `gpx/routes/*.gpx`）與 Strava/CCTV 的 Firestore 資料暫不搬；新的私人 GPX 只走本 API

web 端需要的新環境變數：`ROUTECAST_API_URL=http://localhost:8000`。

## 尚未做

- 真正的距離、爬升計算與 0.5 km 分段（應與 web 的 `src/lib/routes` 邏輯共用規格）
- 分析改成背景工作（`analysis_status` 先 `pending`，worker 再更新）
- 雲端部署（AWS 之後另開 PR）
