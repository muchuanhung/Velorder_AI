"use client";

import React from "react"
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Target,
  Link2,
  Cookie,
  Shield,
  Scale,
  CreditCard,
  UserCheck,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Heart,
  MapPin,
  Cpu,
} from "lucide-react";

function SectionHeading({
  id,
  icon: Icon,
  title,
  subtitle,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-4.5 w-4.5 text-strava" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-secondary/50 p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-strava/10 shrink-0">
        <Icon className="h-4 w-4 text-strava" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function HighlightBox({
  variant = "info",
  children,
}: {
  variant?: "info" | "warning" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-strava/30 bg-strava/5",
    warning: "border-warning/30 bg-warning/5",
    success: "border-success/30 bg-success/5",
  };
  const iconStyles = {
    info: "text-strava",
    warning: "text-warning",
    success: "text-success",
  };
  const icons = {
    info: AlertTriangle,
    warning: AlertTriangle,
    success: CheckCircle2,
  };
  const Icon = icons[variant];

  return (
    <div
      className={`flex gap-3 rounded-lg border p-4 ${styles[variant]}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconStyles[variant]}`} />
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export function PolicyContent() {
  return (
    <article className="space-y-10">
      {/* Introduction */}
      <section>
        <SectionHeading
          id="introduction"
          icon={FileText}
          title="隱私政策"
          subtitle="最後更新：2026 年 2 月 10 日"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            歡迎使用 StravaSync。我們非常重視您的隱私，尤其是運動與健康相關資料。本隱私政策說明當您使用本服務時，我們如何蒐集、使用、揭露與保護您的資訊。
          </p>
          <p className="text-muted-foreground leading-relaxed">
            使用 StravaSync 即表示您同意依本政策蒐集與使用資訊。若不同意本政策條款，請勿使用本服務。
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="gap-1.5 text-foreground">
              <Shield className="h-3 w-3" />
              符合 GDPR
            </Badge>
            <Badge variant="secondary" className="gap-1.5 text-foreground">
              <Link2 className="h-3 w-3" />
              符合 Strava API 規範
            </Badge>
            <Badge variant="secondary" className="gap-1.5 text-foreground">
              <UserCheck className="h-3 w-3" />
              使用者優先資料政策
            </Badge>
          </div>
        </div>
      </section>

      <Separator />

      {/* Data Collection */}
      <section>
        <SectionHeading
          id="data-collection"
          icon={Database}
          title="我們蒐集的資料"
          subtitle="透過 Strava OAuth 整合取得的資訊"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            當您透過 OAuth 2.0 將 Strava 帳號連結至 StravaSync 時，我們會請求以下類別的資料存取權。在 Strava 連結流程中，系統會提示您授權各項權限範圍。
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              icon={UserCheck}
              title="Strava 個人資料"
              description="您的公開個人資料，包含顯示名稱、大頭照、城市、州/省、國家及運動員統計。"
            />
            <InfoCard
              icon={MapPin}
              title="活動 GPS 紀錄"
              description="您紀錄的活動（跑步、騎車、游泳等）之詳細 GPS 座標與路線資料。"
            />
            <InfoCard
              icon={Heart}
              title="心率資料"
              description="透過 Garmin、Wahoo、Apple Watch 等穿戴裝置在活動中紀錄的心率串流。"
            />
            <InfoCard
              icon={Activity}
              title="表現數據"
              description="配速、速度、功率、步頻、海拔及其他與活動相關的感測器數據。"
            />
          </div>

          <HighlightBox variant="info">
            <strong>OAuth 權限範圍：</strong>我們僅請求{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-strava">
              read
            </code>
            、{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-strava">
              activity:read
            </code>
            、{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-strava">
              activity:read_all
            </code>
            。我們絕不請求對您 Strava 帳號的寫入權限。
          </HighlightBox>

          <h3 className="text-base font-medium text-foreground mt-6">
            自動蒐集的資訊
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-strava shrink-0" />
              <span className="leading-relaxed">
                <strong className="text-foreground">裝置資訊：</strong>
                瀏覽器類型、作業系統、螢幕解析度與裝置識別碼，用於分析與相容性。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-strava shrink-0" />
              <span className="leading-relaxed">
                <strong className="text-foreground">使用資料：</strong>
                造訪頁面、使用功能、各區塊停留時間與互動模式，以改善使用體驗。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-strava shrink-0" />
              <span className="leading-relaxed">
                <strong className="text-foreground">日誌資料：</strong>
                伺服器日誌蒐集之 IP 位址、存取時間與來源網址，用於安全監控。
              </span>
            </li>
          </ul>
        </div>
      </section>

      <Separator />

      {/* Purpose of Use */}
      <section>
        <SectionHeading
          id="purpose-of-use"
          icon={Target}
          title="使用目的"
          subtitle="我們如何運用您的資料以提升訓練體驗"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            您的資料僅用於下列特定目的。未經您明確同意，我們不會將資料用於以下所列以外之用途。
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    目的
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    說明
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground hidden sm:table-cell">
                    法律依據
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    個人化分析
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    根據您的活動紀錄產生訓練洞察、體能趨勢與表現儀表板。
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <Badge variant="outline" className="text-foreground">同意</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    背景處理
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    透過 Inngest 背景任務同步 Strava 歷史資料、計算彙總統計並非同步更新訓練指標。
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <Badge variant="outline" className="text-foreground">同意</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    地圖視覺化
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    在互動地圖上顯示您的 GPS 軌跡，協助檢視路線、探索熱力圖與發現新區域。
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <Badge variant="outline" className="text-foreground">同意</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    服務改善
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    經匿名與彙總之分析資料，用於改善功能、修復問題與優化效能。
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <Badge variant="outline" className="text-foreground">正當利益</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <HighlightBox variant="success">
            <strong>Inngest 處理：</strong>背景同步任務透過 Inngest 排程執行，於獨立的無伺服器函式中處理活動資料。每項任務具等冪性，重複執行不會產生重複資料。
          </HighlightBox>
        </div>
      </section>

      <Separator />

      {/* Strava API Compliance */}
      <section>
        <SectionHeading
          id="strava-api"
          icon={Link2}
          title="Strava API 合規"
          subtitle="我們對 Strava 開發者協議的承諾"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            StravaSync 完全符合{" "}
            <span className="text-strava font-medium">
              Strava API 協議
            </span>
            ，並遵循所有要求的資料處理實務。我們遵守以下原則：
          </p>

          <div className="space-y-3">
            {[
              {
                title: "不超必要保留資料",
                description:
                  "我們不會將 Strava 資料保留超過提供服務所需時間。當您解除 Strava 連結或刪除 StravaSync 帳號後，所有相關 Strava 資料將於 30 天內永久刪除。",
              },
              {
                title: "隨時可撤銷存取權",
                description:
                  "您可隨時透過個人設定或 Strava「我的應用程式」頁面解除 Strava 與 StravaSync 的連結。解除後，我們會立即停止所有資料同步並開始刪除程序。",
              },
              {
                title: "不出售健康資料",
                description:
                  "我們不會向任何第三方出售、出租或交換個人健康或體能資料。您的活動 GPS、心率與表現數據絕不透過資料仲介或廣告網路變現。",
              },
              {
                title: "正確 Strava 標示",
                description:
                  "所有來自 Strava 的資料皆依 Strava 品牌指南標示「Powered by Strava」。",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-lg border border-border bg-card p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Data Storage */}
      <section>
        <SectionHeading
          id="data-storage"
          icon={Shield}
          title="資料儲存與安全"
          subtitle="我們如何及於何處保護您的資訊"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            我們採用業界標準安全措施，保護靜態與傳輸中的資料。所有敏感資訊均經加密並存放於具存取控管之安全環境。
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              icon={Shield}
              title="加密"
              description="靜態資料使用 AES-256 加密，傳輸使用 TLS 1.3。API 權杖以伺服器端加密儲存。"
            />
            <InfoCard
              icon={Cpu}
              title="基礎架構"
              description="託管於 Vercel 邊緣網路與無伺服器函式。資料庫服務由符合 SOC 2 之供應商提供。"
            />
          </div>

          <h3 className="text-base font-medium text-foreground mt-6">
            保留時程
          </h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    資料類型
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    保留期間
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 text-foreground">
                    Strava 活動資料
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    至帳號刪除或解除 Strava 連結後 30 天
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground">
                    帳號憑證
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    至帳號刪除（由 Firebase Auth 管理）
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground">
                    彙總分析
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    永久保留（已完全匿名化）
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground">伺服器日誌</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    90 天滾動視窗
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Separator />

      {/* Cookies */}
      <section>
        <SectionHeading
          id="cookies"
          icon={Cookie}
          title="Cookie 與追蹤"
          subtitle="用於維持您的工作階段與偏好的技術"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            我們僅使用營運服務所必要之最少數量 Cookie 與類似技術。我們不使用廣告 Cookie 或跨站追蹤像素。
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Cookie
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    用途
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground hidden sm:table-cell">
                    效期
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 text-foreground">
                    <code className="font-mono text-xs">__session</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Firebase 驗證工作階段
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    14 天
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground">
                    <code className="font-mono text-xs">theme</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    介面主題偏好（深色／淺色）
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    1 年
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground">
                    <code className="font-mono text-xs">_vercel_insights</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    匿名使用分析（Vercel Analytics）
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    工作階段
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Separator />

      {/* User Rights */}
      <section>
        <SectionHeading
          id="user-rights"
          icon={UserCheck}
          title="您的權利"
          subtitle="對您個人資料的掌控"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            依您所在管轄區，您可能對個人資料享有下列權利。欲行使任一權利，請透過「聯絡我們」一節提供的聯絡方式與我們聯繫。
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "存取權",
                description:
                  "要求取得我們所持有您個人資料之副本，並以機器可讀格式提供。",
              },
              {
                title: "更正權",
                description:
                  "要求更正不正確之個人資料或補足不完整之資料。",
              },
              {
                title: "刪除權",
                description:
                  "要求刪除您的個人資料（「被遺忘權」）。我們將於 30 天內完成。",
              },
              {
                title: "可攜權",
                description:
                  "隨時以結構化、常用格式（JSON 或 CSV）匯出您的資料。",
              },
              {
                title: "限制處理權",
                description:
                  "於特定情況下要求我們限制對您個人資料的處理。",
              },
              {
                title: "撤回同意權",
                description:
                  "隨時透過解除 Strava 連結或刪除 StravaSync 帳號撤回同意。",
              },
            ].map((right) => (
              <div
                key={right.title}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="text-sm font-medium text-foreground">
                  {right.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {right.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Monetization */}
      <section>
        <SectionHeading
          id="monetization"
          icon={CreditCard}
          title="營利說明"
          subtitle="StravaSync 如何維持服務"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            StravaSync 目前以免費服務形式提供。我們承諾透明說明如何規劃維持與發展平台。
          </p>

          <HighlightBox variant="warning">
            <strong>未來進階功能：</strong>我們可能推出付費訂閱方案，提供進階分析、更深入訓練洞察、延伸歷史分析與 AI 教練建議。免費方案使用者仍可使用核心功能，包含活動同步、基本分析與地圖視覺化。任何價格變更將至少提前 30 天通知所有使用者。
          </HighlightBox>

          <div className="space-y-3">
            <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  不將資料變現
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  我們不會也永不出售個別使用者資料、健康指標或活動紀錄給廣告主、資料仲介或任何第三方。營收僅來自進階功能訂閱。
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  無廣告
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  StravaSync 不顯示第三方廣告，亦不使用您的資料在本平台或任何外部服務投放定向廣告。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Third Parties */}
      <section>
        <SectionHeading
          id="third-parties"
          icon={Scale}
          title="第三方服務"
          subtitle="會處理您資料的外部服務"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            我們使用少量第三方服務以營運 StravaSync。各服務受其自身隱私政策及我們的資料處理協議約束。
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    服務
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    用途
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground hidden sm:table-cell">
                    共享資料
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    Strava API
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    活動資料來源
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    OAuth 權杖
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    Firebase (Google)
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    驗證與使用者管理
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    電子郵件、驗證憑證
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    Inngest
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    背景任務編排
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    僅任務中繼資料
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    Vercel
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    託管與分析
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    匿名使用資料
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Separator />

      {/* Contact */}
      <section>
        <SectionHeading
          id="contact"
          icon={Mail}
          title="聯絡我們"
          subtitle="關於本政策或您資料的疑問"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            若您對本隱私政策、您的資料或欲行使任何權利有任何疑問，請透過以下資訊與我們聯繫。
          </p>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium text-foreground min-w-28">
                  電子郵件：
                </span>
                <span className="text-strava">mu.chuan.hung@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-foreground min-w-28">
                  回覆時間：
                </span>
                <span className="text-muted-foreground">
                  5 個工作天內
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-foreground min-w-28">
                  資料請求：
                </span>
                <span className="text-muted-foreground">
                  驗證後 30 天內處理
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            本隱私政策可能不時更新。若有重大變更，我們將於本頁張貼新版政策並更新「最後更新」日期。建議您定期檢視本頁以掌握變更。
          </p>
        </div>
      </section>
    </article>
  );
}