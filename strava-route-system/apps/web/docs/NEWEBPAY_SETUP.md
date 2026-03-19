# 藍新金流 NewebPay 整合設定

> 因 Stripe 對台灣銀行卡收款支援有限，改用藍新金流以支援台灣信用卡、ATM、超商等在地支付方式。

## 1. 為何改用藍新金流

| 項目 | Stripe | 藍新金流 NewebPay |
|------|--------|-------------------|
| 台灣信用卡 | 部分銀行不支援 | 支援多數台灣銀行 |
| ATM 轉帳 | 不支援 | 支援 |
| 超商代碼/條碼 | 不支援 | 支援 |
| 定期定額 | 原生訂閱 API | 信用卡定期定額委託 |
| 幣別 | 多幣別 | 新台幣 |

## 2. 申請與取得金鑰

1. 至 [藍新金流服務平台](https://www.newebpay.com/) 註冊
2. 完成商店審核：
   - **個人會員**：不需營業登記，提供身分證、手機、Email 即可
   - **企業會員**：需營業登記、統編等公司資料
3. 登入後 **商店管理** → **商店資料設定** → **串接設定** 取得：
   - **MerchantID**（商店代號）
   - **HashKey**（32 字元）
   - **HashIV**（16 字元）

4. **API 文件下載**：https://www.newebpay.com/website/Page/content/download_api  
   下載「信用卡定期定額」相關文件（程式版本 V1.3）

## 3. 環境變數

```
NEWEBPAY_MERCHANT_ID=MS12345678
NEWEBPAY_HASH_KEY=your_32_char_hash_key
NEWEBPAY_HASH_IV=your_16_char_hash_iv
NEWEBPAY_ENV=test          # test | production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

- **測試環境**：`NEWEBPAY_ENV=test`，使用測試商店的金鑰，不會實際扣款
- **正式環境**：`NEWEBPAY_ENV=production`，使用正式商店金鑰

### 測試信用卡

| 卡號 | 說明 |
|------|------|
| `4000-2211-1111-1111` | 一般測試卡 |
| `4761-5311-1111-1114` | 美國運通測試卡 |

- 有效期限：任意未過期日期（MMYY）
- CVV：任意 3 碼

## 4. API 端點

| 環境 | MPG 單次付款 | 定期定額 |
|------|-------------|----------|
| 測試 | `https://ccore.newebpay.com/MPG/mpg_gateway` | 見官方定期定額文件 |
| 正式 | `https://core.newebpay.com/MPG/mpg_gateway` | 見官方定期定額文件 |

## 5. 加解密機制

藍新採用 **AES-256-CBC** 加密與 **SHA256** 驗證。

### 加密流程

1. 組合請求參數為 Query String
2. 使用 HashKey、HashIV 做 AES-256-CBC 加密
3. 加密結果轉 Hex
4. 產生 TradeSha：`SHA256("HashKey={key}&{TradeInfo}&HashIV={iv}")` 轉大寫

### Node.js 加密範例

```ts
import crypto from "node:crypto";

function encrypt(params: Record<string, string | number>, hashKey: string, hashIV: string): string {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString();
  const cipher = crypto.createCipheriv("aes-256-cbc", hashKey, hashIV);
  return Buffer.concat([cipher.update(query, "utf8"), cipher.final()]).toString("hex");
}

function tradeSha(tradeInfo: string, hashKey: string, hashIV: string): string {
  const raw = `HashKey=${hashKey}&${tradeInfo}&HashIV=${hashIV}`;
  return crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
}
```

### 回傳驗證（CheckCode）

藍新回傳 `TradeInfo`、`TradeSha`，需解密並驗證：

```ts
function decrypt(tradeInfo: string, hashKey: string, hashIV: string): Record<string, string> {
  const buf = Buffer.from(tradeInfo, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", hashKey, hashIV);
  const decrypted = Buffer.concat([decipher.update(buf), decipher.final()]).toString("utf8");
  return Object.fromEntries(new URLSearchParams(decrypted));
}
```

## 6. 交易流程

### 6.1 單次付款（MPG）

適用：一次性購買，或先以單次付款驗證流程。

1. 後端組裝參數（MerchantOrderNo、Amt、ItemDesc、ReturnURL、NotifyURL 等）
2. AES 加密 → TradeInfo、TradeSha
3. 產生 HTML form，POST 到藍新 MPG 端點
4. 使用者於藍新頁面完成付款
5. 藍新呼叫 **NotifyURL**（背景通知）與 **ReturnURL**（導回商店）

### 6.2 定期定額（訂閱）

適用：月繳、年繳等週期扣款。

1. 建立「定期定額委託單」，參數包含：
   - 週期（每月、每年等）
   - 授權期數
   - 首次授權金額（通常先做 10 元驗證，成功後取消）
2. 使用者於藍新頁面授權
3. 藍新依週期自動扣款，並呼叫 NotifyURL 通知

> 詳細參數請參考官方「信用卡定期定額」API 文件。

## 7. 需實作的 API 與前端調整

### 7.1 後端

| 原 Stripe | 藍新對應 |
|-----------|----------|
| `POST /api/stripe/create-checkout-session` | `POST /api/newebpay/create-payment`：組裝參數、加密、回傳 form HTML 或導向 URL |
| `POST /api/stripe/webhook` | `POST /api/newebpay/notify`：接收藍新 NotifyURL 回傳，解密驗證，更新 Firestore |

### 7.2 Firestore 訂閱結構

可沿用 `subscriptions` collection，欄位調整為：

| 欄位 | 說明 |
|------|------|
| userId | Firebase UID |
| status | `active` / `canceled` / `past_due` |
| newebpayTradeNo | 藍新交易編號 |
| newebpayPeriodNo | 定期定額委託編號（若有） |
| priceId | 方案識別（day/monthly/yearly） |
| currentPeriodEnd | 當前計費週期結束（timestamp） |
| updatedAt | 最後更新 |

### 7.3 前端

- `ProUpgradeModal`：改為呼叫 `/api/newebpay/create-payment`，取得導向 URL 或 form 後跳轉
- `billing/success`：改為接收藍新 ReturnURL 的 query 參數，必要時呼叫 sync API 更新訂閱狀態

## 8. 遷移步驟建議

1. **保留 Stripe 程式碼**：可先並存，用 feature flag 或 env 切換
2. **實作藍新 lib**：`lib/newebpay/`（加密、解密、TradeSha）
3. **實作 create-payment API**：依方案組裝 Amt、週期等
4. **實作 notify callback**：解密、驗證、寫入 Firestore
5. **調整 success/cancel 頁**：解析藍新回傳格式
6. **測試**：使用測試環境與測試卡
7. **切換**：正式環境改用藍新，移除或停用 Stripe

## 9. 官方資源

- 官網：https://www.newebpay.com/
- API 文件下載：https://www.newebpay.com/website/Page/content/download_api
- 技術客服：02-2162-2005
