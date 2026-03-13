# Stripe Pro 訂閱整合設定

## 1. Stripe 帳號與 Dashboard

1. 至 [Stripe Dashboard](https://dashboard.stripe.com) 註冊或登入
2. 開啟 **Developers → API keys**
3. 取得：
   - **Publishable key**（`pk_test_...` / `pk_live_...`）
   - **Secret key**（`sk_test_...` / `sk_live_...`）

## 2. 安裝依賴

```bash
cd strava-route-system/apps/web && pnpm add stripe @stripe/stripe-js
```

## 3. 環境變數

在 `.env.local` 或部署環境加入：

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_MONTHLY=price_xxxxx   # 月繳 Price ID
STRIPE_PRICE_YEARLY=price_xxxxx    # 年繳 Price ID
```

> `STRIPE_WEBHOOK_SECRET` 於本地測試時由 Stripe CLI 產生，見第 8 節。

## 4. Stripe Dashboard 建立產品與價格

1. 至 **Products** → **Add product**
2. 建立兩個價格：
   - **月繳**：NT$50/月，recurring monthly
   - **年繳**：NT$500/年，recurring yearly
3. 記下每個 Price 的 `price_xxx` ID，供 API 使用

## 5. API Routes 結構

```
apps/web/src/
├── app/api/stripe/
│   ├── create-checkout-session/route.ts   # 建立 Checkout Session
│   └── webhook/route.ts                   # 處理 Stripe 事件
├── lib/
│   └── stripe/
│       ├── server.ts                      # Stripe server instance
│       └── prices.ts                      # price_xxx 對應 planId
```

### create-checkout-session

- **Method**: POST
- **Body**: `{ planId: "monthly" | "yearly" }`
- **流程**：
  1. `getAuthFromRequest` 取得 `uid`，未登入回傳 401
  2. `stripe.checkout.sessions.create` 建立 Session
  3. 回傳 `{ url: session.url }`，前端導向 Stripe Checkout

### webhook

- **Method**: POST（Stripe 呼叫）
- **處理事件**：
  - `checkout.session.completed` → 寫入 Firestore `users/{userId}/subscription` 為 Pro
  - `customer.subscription.deleted` → 取消 Pro 狀態

## 6. 前端整合

在 `ProUpgradeModal` 的 `handleSubscribe` 中：

1. `fetch("/api/stripe/create-checkout-session", { method: "POST", body: JSON.stringify({ planId: selectedPlan }) })`
2. 取得 `{ url }` 後執行 `window.location.href = url` 導向 Stripe Checkout

## 7. 成功 / 取消頁面

`create-checkout-session` 已設定導向：

- 成功：`/billing/success`
- 取消：`/billing/cancel`

頁面已實作於 `src/app/billing/success/page.tsx` 與 `src/app/billing/cancel/page.tsx`。

## 8. 本地測試 Webhook

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

終端會顯示 `whsec_xxx`，將此值填入 `STRIPE_WEBHOOK_SECRET`。

## 9. 流程概覽

```
使用者點「立即訂閱」
  → POST /api/stripe/create-checkout-session { planId }
  → 回傳 Stripe Checkout URL
  → window.location = url
  → 使用者在 Stripe 完成付款
  → Stripe 呼叫 webhook
  → webhook 更新 Firestore 訂閱狀態
  → 使用者被導回 success_url
```

## 10. Firestore 訂閱結構（建議）

Collection: `users/{userId}/subscription`（或 `subscriptions` collection，doc id = userId）

| 欄位 | 說明 |
|------|------|
| status | `active` / `canceled` / `past_due` |
| stripeCustomerId | Stripe Customer ID |
| stripeSubscriptionId | Stripe Subscription ID |
| priceId | 訂閱的 Price ID |
| currentPeriodEnd | 當前計費週期結束時間 |
| updatedAt | 最後更新時間 |
