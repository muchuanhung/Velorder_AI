"use client";

import type React from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck,
  ShieldCheck,
  Link2,
  CreditCard,
  Ban,
  HeartPulse,
  Scale,
  AlertTriangle,
  Pencil,
  UserX,
  Gavel,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared helper components (same pattern as PolicyContent)            */
/* ------------------------------------------------------------------ */

function SectionHeading({
  id,
  number,
  icon: Icon,
  title,
  subtitle,
}: {
  id: string;
  number: number;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary relative">
          <Icon className="h-4.5 w-4.5 text-strava" />
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-strava text-[10px] font-bold text-primary-foreground">
            {number}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
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
  const VariantIcon = icons[variant];

  return (
    <div className={`flex gap-3 rounded-lg border p-4 ${styles[variant]}`}>
      <VariantIcon
        className={`h-5 w-5 shrink-0 mt-0.5 ${iconStyles[variant]}`}
      />
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2 text-sm text-muted-foreground list-none">
      {items.map((item, i) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-foreground">
            {String.fromCharCode(97 + i)}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-strava shrink-0" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ProhibitedItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main content                                                        */
/* ------------------------------------------------------------------ */

export function TermsContent() {
  return (
    <article className="space-y-10">
      {/* ------------------------------------------------------------ */}
      {/* 1. Acceptance of Terms                                       */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-acceptance"
          number={1}
          icon={FileCheck}
          title="條款之接受"
          subtitle="您同意受本條款約束"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            本服務條款（「條款」）規範您對 StravaSync 應用程式（「服務」）之存取與使用。服務由 StravaSync（「我們」）營運。當您建立帳號、透過 OAuth 連結 Strava 帳號或以其他方式使用服務時，即表示您同意受本條款全部內容之約束。
          </p>

          <HighlightBox variant="info">
            <strong>連結 Strava 即視為同意：</strong>當您透過 OAuth 授權流程授權 StravaSync 存取您的 Strava 帳號資料時，即明確表示您已閱讀、理解並同意本服務條款以及我們的{" "}
            <a href="/privacy" className="text-strava underline underline-offset-2 font-medium">
              隱私政策
            </a>
            。
          </HighlightBox>

          <p className="text-muted-foreground leading-relaxed">
            若您不同意本條款之任何部分，請勿使用本服務。我們保留隨時以任何理由拒絕向任何人提供服務之權利。
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5 text-foreground">
              <FileCheck className="h-3 w-3" />
              最後更新：2026 年 2 月 10 日
            </Badge>
            <Badge variant="secondary" className="gap-1.5 text-foreground">
              <Scale className="h-3 w-3" />
              立即生效
            </Badge>
          </div>
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 2. Account & Access                                          */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-account"
          number={2}
          icon={ShieldCheck}
          title="帳號與存取"
          subtitle="註冊、驗證與資格"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            使用 StravaSync 須透過 Google 驗證（Firebase）或電子郵件／密碼註冊建立帳號。您須對帳號憑證之保密及帳號下之一切活動負責。
          </p>

          <NumberedList
            items={[
              "您須年滿 16 歲（或您所在管轄區之成年年齡）始得註冊帳號。",
              "您同意於註冊時提供正確完整之資訊，並保持帳號資訊為最新。",
              "您須妥善保管密碼，並於發現帳號遭未經授權存取時立即通知我們。",
              "同一自然人或法人同一時間僅得持有一個有效帳號。",
              "我們保留對違反本條款或出現可疑活動之帳號暫停或終止之權利。",
            ]}
          />
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 3. Strava API Usage Policy                                   */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-strava-api"
          number={3}
          icon={Link2}
          title="Strava API 使用政策"
          subtitle="第三方 API 依賴與限制"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            StravaSync 依賴{" "}
            <span className="text-strava font-medium">Strava V3 API</span>{" "}
            取得您的活動資料。使用本服務即表示您知悉並同意以下事項：
          </p>

          <div className="space-y-3">
            {[
              {
                title: "第三方依賴",
                description:
                  "本服務依賴 Strava API 之持續可用與正常運作。我們不對 Strava API 之停機、中斷、速率限制或任何可能影響您使用 StravaSync 之狀況負責。",
              },
              {
                title: "資料正確性",
                description:
                  "我們力求正確呈現您的資料，但無法保證自 Strava 取得之資料的準確性、完整性或即時性。GPS 軌跡、心率或表現數據之差異可能來自 Strava 平台或您的紀錄裝置。",
              },
              {
                title: "API 變更",
                description:
                  "Strava 可能隨時修改、廢止或停止 API 端點。此類變更可能影響部分 StravaSync 功能之可用性。我們將合理努力因應 API 變更，但無法保證功能不中斷。",
              },
              {
                title: "速率限制",
                description:
                  "Strava 對 API 使用設有速率限制。於高負載或大量歷史資料同步（經 Inngest 背景任務處理）時，資料可能暫時延遲提供。",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-lg border border-border bg-card p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-strava shrink-0 mt-0.5" />
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

          <HighlightBox variant="warning">
            <strong>Strava 條款適用：</strong>您對 Strava 資料之使用亦須遵守{" "}
            <span className="text-strava font-medium">
              Strava 自身服務條款
            </span>
            {" "}與{" "}
            <span className="text-strava font-medium">
              API 協議
            </span>
            。若本條款與 Strava 條款就您 Strava 資料有衝突，以 Strava 條款為準。
          </HighlightBox>
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 4. Subscription & Payments                                   */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-subscriptions"
          number={4}
          icon={CreditCard}
          title="訂閱與付款"
          subtitle="目前免費方案與規劃中的進階功能"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            StravaSync 目前提供免費方案，包含活動同步、基本分析與地圖視覺化等核心功能。我們正朝可持續營運模式發展，未來可能納入付費功能。
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    項目
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    說明
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    免費方案
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    含活動同步、基本訓練分析、GPS 地圖視覺化及 Inngest 背景處理。
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    進階功能
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    進階分析、AI 教練洞察、延伸歷史分析與自訂訓練計畫，未來可能需付費訂閱。
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    功能變更
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    目前免費之功能可能改為付費方案。任何此類變更將至少提前 30 日通知。
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    帳單
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    進階功能上線後，訂閱將以月繳或年繳方式計費。您可於下一計費週期前隨時取消。
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    退款
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    退款申請將個案審核。年訂於期中取消者，可能提供按比例退款。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <HighlightBox variant="info">
            <strong>價格透明：</strong>我們將在要求付款前清楚說明價格。未經您於安全付款流程中明確同意與確認，不會產生任何扣款。
          </HighlightBox>
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 5. Prohibited Conduct                                        */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-prohibited"
          number={5}
          icon={Ban}
          title="禁止行為"
          subtitle="將導致帳號終止之行為"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            您同意不從事以下任何禁止行為。違反可能導致帳號在未事先通知下遭立即暫停或終止。
          </p>

          <div className="space-y-3">
            <ProhibitedItem
              title="資料爬取與自動蒐集"
              description="使用機器人、爬蟲或任何自動化方式存取、蒐集或擷取 StravaSync 之資料，包括但不限於使用者檔案、活動資料、分析結果或任何彙整資料集。"
            />
            <ProhibitedItem
              title="逆向工程"
              description="嘗試反編譯、反組譯、逆向工程或以其他方式取得本服務之原始碼、演算法或專有分析引擎，包括任何機器學習模型、統計方法或資料處理流程。"
            />
            <ProhibitedItem
              title="未經授權之 API 存取"
              description="在未取得明確書面授權下存取或嘗試存取任何 StravaSync API 端點、內部服務或後端基礎設施，包括攔截、竄改或重送 API 請求。"
            />
            <ProhibitedItem
              title="帳號濫用"
              description="建立多個帳號、分享帳號憑證、冒充他人，或使用他人之 Strava 授權存取您無權查看之資料。"
            />
            <ProhibitedItem
              title="資料再散布"
              description="再散布、轉售、再授權或公開分享透過 StravaSync 取得之任何資料，包括分析結果、GPS 軌跡或由本服務衍生之訓練洞察。"
            />
            <ProhibitedItem
              title="干擾服務"
              description="引入惡意軟體、病毒或任何有害程式；以過量請求（DDoS）癱瘓服務；或以其他方式企圖破壞或降低 StravaSync 之可用性或效能。"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 6. Health Disclaimer                                         */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-health"
          number={6}
          icon={HeartPulse}
          title="健康與健身免責聲明"
          subtitle="關於分析與洞察之重要限制"
        />
        <div className="mt-4 space-y-4">
          <HighlightBox variant="warning">
            <strong>非醫療建議：</strong>StravaSync 提供之健身分析與訓練洞察僅供{" "}
            <strong>資訊與教育用途</strong>。本服務所呈現之資料、圖表、指標、建議與洞察不構成醫療建議、診斷或治療。
          </HighlightBox>

          <p className="text-muted-foreground leading-relaxed">
            在根據透過 StravaSync 取得之資訊做出健康、健身或訓練計畫相關決定前，您應先諮詢合格醫療人員。尤其：
          </p>

          <BulletList
            items={[
              "心率分析、訓練負荷估計與恢復建議來自演算法，可能未考量您的個人健康狀況、用藥或身體限制。",
              "GPS 衍生指標（距離、配速、海拔）為近似值，不應作為遠地導航等安全關鍵決策之依據。",
              "AI 教練功能（若提供）由機器學習模型產生，未經認證教練、訓練師或醫療專業人員審核。",
              "若運動時出現胸痛、頭暈、呼吸急促或其他不適症狀，請立即停止並就醫，勿以應用程式顯示為準。",
              "StravaSync 對因依循本服務所呈現之分析、建議或訓練計畫而產生之任何傷害、疾病或健康併發症不負責任。",
            ]}
          />
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 7. Intellectual Property                                     */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-ip"
          number={7}
          icon={Scale}
          title="智慧財產權"
          subtitle="內容、程式碼與分析之歸屬"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            本服務（含其原創內容、功能、使用者介面、分析演算法與運作方式）為 StravaSync 及其授權人專屬財產，且將持續如此。
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">您的資料</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                您對個人資料及 Strava 活動資料保有完整所有權。我們僅獲有限、非專屬授權，於提供本服務所需範圍內處理該等資料。
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">本服務</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                所有程式碼、設計、分析模型、彙整洞察與品牌均受著作權、商標及其他智慧財產權法律保護。
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">
                Strava 內容
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Strava 標誌、商標及「Powered by Strava」標示為 Strava, Inc. 財產，依其品牌指南授權使用。
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">意見回饋</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                您就本服務所提供之任何意見、建議或構想，我們得自由使用，無須對您負義務或給付報酬。
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 8. Disclaimer of Warranties                                  */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-warranty"
          number={8}
          icon={AlertTriangle}
          title="免責聲明"
          subtitle='本服務以「現狀」提供'
        />
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-5">
            <p className="text-sm text-foreground leading-relaxed uppercase tracking-wide font-semibold mb-3">
              重要法律聲明
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              本服務係以「現狀」及「可用性」為基礎提供，不附任何明示或默示之保證，包括但不限於商品適售性、特定用途適用性及不侵權之默示保證。
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            在不限制前述之前提下，我們不保證：
          </p>

          <BulletList
            items={[
              "本服務將不中斷、即時、安全或無錯誤。",
              "自本服務取得之結果將準確或可靠。",
              "本服務中之任何錯誤將被修正。",
              "本服務將與所有裝置、瀏覽器或作業系統相容。",
              "Strava API 將持續可用或不會以影響本服務之方式變更。",
            ]}
          />
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 9. Limitation of Liability                                   */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-limitation"
          number={9}
          icon={Gavel}
          title="責任限制"
          subtitle="損害賠償上限與排除"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            在法律允許之最大範圍內，STRAVASYNC 及其負責人、董事、員工或代理人概不對任何間接、附帶、特別、衍生或懲罰性損害負責，包括但不限於：
          </p>

          <BulletList
            items={[
              "利潤、資料、使用、商譽或其他無形損失。",
              "因您之資料遭未經授權存取或竄改所生之損害。",
              "因無法使用本服務所生之損害。",
              "因本服務上之任何第三方內容或行為所生之損害。",
              "因依賴分析或建議所生之任何與健康相關之損害。",
            ]}
          />

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-foreground leading-relaxed">
              <strong>總責任上限：</strong>我們就因本服務所生或與本服務相關之所有請求所負之總責任，不得超過以下兩者較高者：(a) 您於請求發生前十二（12）個月內支付予我們之金額，或 (b) 一百美元（$100.00）。
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 10. Modifications to Terms                                   */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-changes"
          number={10}
          icon={Pencil}
          title="條款之修改"
          subtitle="我們如何與何時可能更新本條款"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            我們保留隨時修改或取代本條款之權利。當我們進行重大變更時，將透過以下至少一種方式通知：
          </p>

          <NumberedList
            items={[
              "於 StravaSync 儀表板內以顯著方式公告至少 14 日。",
              "寄送電子郵件至您帳號所綁定之信箱。",
              "於本條款頂端更新「最後更新」日期。",
            ]}
          />

          <HighlightBox variant="success">
            <strong>寬限期：</strong>本條款之重大變更將於通知送達後至少 30 日始生效。您於生效日後繼續使用本服務，即視為接受修訂後之條款。
          </HighlightBox>
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 11. Termination                                              */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-termination"
          number={11}
          icon={UserX}
          title="終止"
          subtitle="任一方如何終止本協議"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            您或 StravaSync 皆可隨時以任何理由終止本協議。
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    當事人
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    方式
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground hidden sm:table-cell">
                    資料處理
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    您
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    於個人設定中刪除帳號，或解除 Strava 連結並以電子郵件申請刪除。
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell leading-relaxed">
                    所有個人與 Strava 資料將於 30 日內刪除。
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    StravaSync
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    我們得因違反條款而暫停或終止您之存取，並在可行時事先通知。
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell leading-relaxed">
                    您可於收到通知後 14 日內申請資料匯出。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            終止後，關於智慧財產權、免責聲明、責任限制以及依其性質應繼續有效之其他條款仍持續有效。
          </p>
        </div>
      </section>

      <Separator />

      {/* ------------------------------------------------------------ */}
      {/* 12. Contact Us                                               */}
      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeading
          id="tos-contact"
          number={12}
          icon={Mail}
          title="聯絡我們"
          subtitle="關於本條款之疑問"
        />
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            若您對本服務條款有任何疑問，請以下列資訊與我們聯絡。我們致力於迅速、透明地處理您的疑慮。
          </p>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium text-foreground min-w-32">
                  一般諮詢：
                </span>
                <span className="text-strava">mu.chuan.hung@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-foreground min-w-32">
                  法律相關：
                </span>
                <span className="text-strava">mu.chuan.hung@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-foreground min-w-32">
                  回覆時間：
                </span>
                <span className="text-muted-foreground">
                  五個工作天內
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Footer with cross-links */}
          <div className="flex flex-col items-center gap-3 pt-4 pb-2 text-center">
            <p className="text-xs text-muted-foreground">
              本服務條款應與我們的{" "}
              <a
                href="/privacy"
                className="text-strava underline underline-offset-2 font-medium"
              >
                隱私政策
              </a>
              {" "}一併閱讀。
            </p>
            <p className="text-xs text-muted-foreground">
              © 2026 StravaSync. 保留所有權利。
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}