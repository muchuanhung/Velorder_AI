# Strava API 品牌規範與 Athlete Capacity 審核

為通過 Strava Athlete Capacity 額度審核，須符合 [Strava API Brand Guidelines](https://strava.github.io/api/v3/guidelines/)。

## 1. Connect with Strava 按鈕

- **必須**使用官方「Connect with Strava」橙色按鈕
- **禁止**自訂純文字連結或修改按鈕樣式
- 按鈕必須連結至 `https://www.strava.com/oauth/authorize`（本專案透過 `/api/strava/oauth-url` 取得完整授權 URL）

### 官方資源

- 下載：https://strava.github.io/api/downloads/1.1-connect-with-strava-09192016.zip
- 規格：高度 48px @1x、96px @2x；EPS、SVG、PNG 格式；橙色與淺色兩種

### 本專案實作

- `public/connect-with-strava.svg`：依官方規格重建的 SVG（橙色 #FC4C02）
- `ConnectWithStravaButton` 元件：用於 Dashboard 授權確認區塊

**建議**：審核前可下載官方 zip，以官方 SVG/PNG 替換 `public/connect-with-strava.svg` 以確保完全符合規範。

## 2. Powered by Strava 標示

- **必須**在顯示跑步里程或地圖的頁面清楚標示「Powered by Strava」
- 可使用官方「Powered by Strava」或「Compatible with Strava」logo

### 本專案實作

- `PoweredByStrava` 元件：`@/components/ui/powered-by-strava`
- 顯示位置：
  - **Dashboard**：活動統計、里程數據頁面底部
  - **Routes**：路線分析頁面（側欄與主內容區）
  - **Maps**：地圖頁面左下角

### 官方資源

- 下載：https://strava.github.io/api/downloads/1.2-strava-api-logos-09192016.zip
- 規格：橫向與堆疊版；EPS、SVG、PNG；淺色、灰色、白色三種

## 3. 連結回 Strava 資料

- 呈現 Strava 資料時須提供「View on Strava」連結
- 連結樣式：粗體、底線或橙色 #FC4C02

### 本專案實作

- `ActivitiesTable`：已有「查看所有」連結至 `https://www.strava.com/athlete/training`
