# Strava 同步／授權流程 — 改動說明

本文件說明此 commit 對 Strava 同步與 OAuth 授權流程的調整、修改後的體驗，以及資安與一致性的改善。

---

## 一、改動總覽

| 項目 | 修改前 | 修改後 |
|------|--------|--------|
| **Sync：身分驗證** | 有帶 X-Client-UID 才比對，未帶仍可繼續 | **強制**帶 X-Client-UID，且必須與 cookie 的 uid 一致，否則 403 |
| **Sync：token 來源** | 先查 Firestore，沒有再查 memory | **只查 Firestore**，不讀 memory（刪除 Firestore 後不會再從 memory 拿到舊 token） |
| **Sync：needAuth 回應** | 400 + needAuth | **200** + needAuth（避免被當成一般錯誤） |
| **oauth-url：身分** | 不驗證登入，人人可拿網址 | 必須登入，且 **X-Client-UID 與 cookie 一致** 才回傳授權網址 |
| **oauth-url：Strava 參數** | 無 state、無 approval_prompt | **state=當前 uid**、**approval_prompt=force**（每次都要顯示授權畫面） |
| **OAuth 回呼：state** | 未驗證 | **state 必須等於 session uid**，否則導向 dashboard 並帶錯誤參數 |
| **OAuth 回呼：無 code** | 導回首頁 / | 導向 **/dashboard** |
| **同一 Strava 帳號多人連結** | 可重複連結到不同 app 帳號 | **一 Strava 一 app**；若已連結別人則「改綁」給目前授權者（原擁有者可重新授權取回） |
| **導向 Strava 前** | 直接 `window.location` 跳轉 | **先顯示確認區塊**：提醒使用自己的 Strava 帳號、多人共用瀏覽器資安風險，再按「前往 Strava 授權」才跳轉 |

---

## 二、涉及檔案與修改內容

### 1. `src/app/api/strava/sync/route.ts`

- **強制 X-Client-UID**：`!clientUid || clientUid !== auth.uid` → 403，避免 cookie 是 A 卻回傳 A 的資料給畫面上的 B。
- **只以 Firestore 為準**：移除對 `getStravaToken(auth.uid)`（memory）的備援；無 token 時只回 needAuth，不從 memory 補。
- **needAuth 回 200**：`return NextResponse.json({ error: "…", needAuth: true })`，不再用 400。

### 2. `src/app/api/strava/oauth-url/route.ts`

- **驗證登入與身分**：`getAuthFromRequest(request)`，未登入 401；讀 `X-Client-UID`，未帶或與 `auth.uid` 不符 → 403。
- **Strava URL**：加上 `state=auth.uid`、`approval_prompt=force`。
- **移除**：會輸出 `redirectUri` 等環境設定的 console.log。

### 3. `src/app/api/strava/route.ts`（OAuth 回呼）

- **state 驗證**：`state !== userId` 時導向 `/dashboard?error=授權與登入帳號不符，請用同一帳號重新授權`。
- **無 code**：導向 `/dashboard`，不再導回首頁。
- **同一 Strava 帳號**：`getUserIdByAthleteIdFirestore(athlete.id)` 若已連結別人，則 `deleteStravaTokenFirestore(existingUserId)` 後再寫入目前使用者（改綁）。
- **精簡 log**：移除冗長的成功日誌，保留錯誤處理所需。

### 4. `src/lib/background/strava-token-store.firestore.ts`

- **getUserIdByAthleteIdFirestore(athleteId)**：查詢該 Strava athleteId 目前被哪個 userId 連結。
- **deleteStravaTokenFirestore(userId)**：刪除該使用者的 Strava token（改綁時移除舊連結）。

### 5. `src/components/dashboard/header.tsx`

- **needAuth 一律先處理**：不論 status 為何，只要 `data.needAuth` 就進入授權流程（打 oauth-url、設 `pendingStravaUrl`），**不**更新 lastSyncCount，避免顯示「同步完成 0 筆」。
- **導向前確認**：取得 `oauthUrl` 後不直接跳轉，改為 `setPendingStravaUrl(url)`，畫面上顯示：
  - 文案：請確認使用自己的 Strava 帳號；多人共用瀏覽器時若為他人帳號請勿授權（資安風險），建議先登出 Strava 或使用無痕視窗。
  - 按鈕：「取消」「前往 Strava 授權」；僅在點「前往 Strava 授權」時才 `window.location.href = pendingStravaUrl`。
- **oauth-url 請求**：帶 `headers: { "X-Client-UID": user.uid }`。

---

## 三、修改後的流程體驗

### 3.1 一般同步（已連結 Strava）

1. 使用者點「Sync Now」。
2. 前端送 `POST /api/strava/sync`，帶 cookie 與 `X-Client-UID: user.uid`。
3. 後端驗證 cookie 與 X-Client-UID 一致，從 Firestore 讀取該 uid 的 token，拉活動、寫入、回傳 200 + count。
4. 前端更新 lastSyncCount，SyncBanner 顯示「同步完成！已同步 N 筆活動」。

### 3.2 尚未連結 Strava（needAuth）

1. 使用者點「Sync Now」。
2. 後端發現 Firestore 無該 uid 的 token，回傳 **200** + `needAuth: true`（不回 400）。
3. 前端看到 `data.needAuth`，打 `GET /api/strava/oauth-url`（帶 `X-Client-UID: user.uid`）。
4. 後端確認登入且 X-Client-UID 與 cookie 一致，回傳 Strava 授權 URL（含 state=uid、approval_prompt=force）。
5. 前端**不立刻跳轉**，改為顯示**確認區塊**：
   - 說明須使用自己的 Strava 帳號，若為他人帳號勿授權（資安風險），建議登出或無痕。
   - 使用者可「取消」或「前往 Strava 授權」。
6. 使用者點「前往 Strava 授權」後才 `window.location` 到 Strava；Strava 每次都會顯示授權畫面（approval_prompt=force）。
7. 使用者在 Strava 授權後被導回 `/api/strava?code=...&state=...`；後端驗證 state === session uid，用 code 換 token，檢查同一 Strava 是否已連結別人（改綁邏輯），寫入 Firestore，拉活動，導向 `/dashboard`。

### 3.3 登入與頁面不符（例如 cookie 是 A、畫面上是 B）

- **Sync**：後端發現 `X-Client-UID`（B）≠ cookie（A）→ 403，前端 toast「登入狀態與目前頁面不符，請重新整理頁面後再試」。
- **oauth-url**：同樣 403，不會回傳授權網址，不會導向 Strava。

### 3.4 同一 Strava 被 B 誤連結後，A 取回

- B 曾在 A 沒登出 Strava 時完成授權，該 Strava 會先連結到 B。
- A 之後在 app 點 Sync Now → needAuth → 前往 Strava 授權。
- 回呼時後端發現該 athleteId 已連結 B，執行改綁：刪除 B 的 token，寫入 A 的 token。
- A 取回自己的 Strava 資料；B 下次 sync 會變成 needAuth。

---

## 四、資安與一致性摘要

- **身分一致**：Sync 與 oauth-url 都強制 X-Client-UID 與 cookie 一致，避免「畫面上是 B、結果用 A 的資料」。
- **state 綁定**：授權網址帶 state=uid，回呼驗證 state，降低 session 錯人時誤存 token 的風險。
- **一 Strava 一 app**：同一 Strava 帳號只會連結一個 app 帳號；若被別人先連結，原擁有者重新授權即可改綁取回。
- **導向前提醒**：避免多人共用瀏覽器時誤用他人 Strava 授權，並明確標示資安風險。
- **token 唯一來源**：Sync 只認 Firestore，刪除 Firestore 後不會再從 memory 取得舊 token。

---

## 五、建議的 commit message（繁體中文）

```
修改: Strava 同步與 OAuth 流程 — 身分驗證、needAuth、改綁與導向前確認

- sync：強制 X-Client-UID 與 cookie 一致，僅以 Firestore 為準，needAuth 改回 200
- oauth-url：驗證登入與 X-Client-UID，帶 state=uid、approval_prompt=force，移除 env log
- 回呼：驗證 state、無 code 導向 /dashboard、同一 Strava 改綁給目前授權者
- Firestore：新增 getUserIdByAthleteId、deleteStravaToken
- header：needAuth 不論 status 先處理，導向 Strava 前顯示確認與資安提醒
```
