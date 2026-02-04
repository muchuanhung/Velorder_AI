# 登入頁結構說明

## 撰寫邏輯

### 1. 頁面層 `page.tsx`
- **角色**：登入畫面的「殼」，只負責版面與把表單／預告區擺好。
- **版面**：
  - 左側（lg 以上）：`StravaTeaser`（功能預告 + 裝飾），用 `motion.div` 做淡入。
  - 右側：登入表單區（含手機版 logo、Auth 卡片、可選的 footer）。
- **資料流**：不直接碰 Firebase，只把「要做的動作」用 props 傳給 `AuthForm`（`onGoogleAuth`、`onEmailAuth`、`onForgotPassword`）。真正呼叫 Firebase 的應是這些 handler 的實作（建議在 page 裡用 `useAuth()` 取得 `signIn` 再傳入）。

### 2. 元件職責

| 元件 | 職責 | 建議調整 |
|------|------|----------|
| **AuthForm** | 表單 UI、模式切換（登入/註冊/忘記密碼）、送出時呼叫傳入的 callback | 保持純 UI，不 import Firebase；由 page 傳入真實或 mock 的 handler。 |
| **StravaTeaser** | 左側預告區：文案 + 裝飾 SVG/動畫 | 可保持無狀態；若需 RWD 再抽成 `LoginLayout` 包左右欄。 |

### 3. 目前缺口
- **Google 登入**：page 的 `handleGoogleAuth` 是 mock（setTimeout）。應改為使用 `useAuth().signIn`，才會真的走 Firebase。
- **已登入狀態**：未檢查 `user`，已登入時可選擇導向 `/dashboard` 或顯示「已登入」。
- **Email/密碼**：目前後端只有 Google 登入；Email 表單可保留當 UI 預留，或先隱藏直到有 Firebase Email 後端。

### 4. 建議資料流（接上 Auth 後）

```
layout (AuthProvider)
  └─ login/page
       ├─ useAuth() → { signIn, signOut, user, loading }
       ├─ 若 user 存在 → redirect('/dashboard') 或顯示已登入
       ├─ onGoogleAuth = () => signIn()   // 接真實 Firebase
       ├─ onEmailAuth / onForgotPassword  = mock 或未來接 API
       └─ AuthForm({ onGoogleAuth, onEmailAuth, onForgotPassword })
```
