# TDX CCTV 同步設定與驗證

## 1. 申請 TDX 金鑰

1. 至 [TDX 官網](https://tdx.transportdata.tw/register) 註冊
2. 登入後於 [會員中心](https://tdx.transportdata.tw/user/dataservice/key) 建立 API 金鑰
3. 取得 **Client ID** 與 **Client Secret**

## 2. 環境變數

在 `.env.local` 或部署環境加入：

```
TDX_CLIENT_ID=你的ClientID
TDX_CLIENT_SECRET=你的ClientSecret
```

## 3. Firestore 結構

Collection: `cctv`

| 欄位 | 說明 |
|------|------|
| id | CCTV 唯一識別（TDX CCTVId 或自動產生） |
| lat, lon | 緯度、經度 (WGS84) |
| geohash | 供 GeoQuery 使用（precision 7） |
| videoUrl | 即時影像串流網址 |
| label | 顯示名稱（路名或設備名） |
| county | 縣市 |
| township | 鄉鎮區 |
| syncedAt | 同步時間戳 |

## 4. 手動同步（驗證用）

```bash
curl -X POST http://localhost:3000/api/cctv/sync
```

成功回傳範例：
```json
{"ok":true,"total":150,"written":148,"skipped":2}
```

## 5. 驗證 Firestore

```bash
curl http://localhost:3000/api/cctv/count
```

回傳：`{"count":148}`

或至 Firebase Console → Firestore → 查看 `cctv` collection。

## 6. 排程同步

Inngest 會於 **每天 04:00 UTC**（台灣 12:00）自動執行 `syncTDXCCTV`。

若 TDX CCTV API 路徑有變，請至 [TDX Swagger](https://tdx.transportdata.tw/api-service/swagger) 查最新路徑，並更新 `src/lib/tdx/client.ts` 的 `CCTV_BASE`。

## 7. 開發除錯

### Console 過濾
嵌入的 CCTV iframe 會持續輸出 `Current time` log，造成 Console 洗版。在 Chrome DevTools Console 的 filter 輸入 `-current` 可隱藏這些訊息。
