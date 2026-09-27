import { getDashboardBriefing } from "@/lib/dashboard/get-briefing.server";
import { VerdictBoard } from "./verdict-board";
import { HazardSummary } from "./hazard-summary";
import { RouteCompare } from "./route-compare";
import { RouteSwitcher } from "./route-switcher";

/** 今日判讀主體：在伺服器端取得路線與天氣後一次輸出 */
export async function Briefing({ routeId }: { routeId?: string }) {
  const data = await getDashboardBriefing(routeId);

  if (data.status === "no-routes") {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <h2 className="text-lg font-bold">目前沒有可判讀的路線</h2>
        <p className="mt-2 text-sm text-muted-foreground">路線資料尚未建立，請稍後再回來看看。</p>
      </section>
    );
  }

  const { featured, alternative, routes, weatherCoverage } = data;

  return (
    <div className="space-y-6">
      <RouteSwitcher routes={routes} currentId={featured.id} />
      <VerdictBoard briefing={featured} />
      {alternative ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <HazardSummary briefing={featured} />
          <RouteCompare alternative={alternative} />
        </div>
      ) : (
        <HazardSummary briefing={featured} />
      )}
      <p className="text-xs text-muted-foreground">
        天氣：中央氣象署鄉鎮預報
        {weatherCoverage.ok < weatherCoverage.total &&
          `（${weatherCoverage.total - weatherCoverage.ok} 個行政區暫時取不到資料）`}
        ・判讀僅供參考，出發前請再確認現場狀況。
      </p>
    </div>
  );
}
