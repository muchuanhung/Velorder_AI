import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { RoutesClient } from "@/components/routes/routes-client";
import { parseActivity, parseDeparture } from "@/lib/routes/trip";

export const metadata: Metadata = { title: "路線" };

/** 路線：公開頁面；?route= 指定要打開的路線（Dashboard 會帶過來） */
export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ route?: string; depart?: string; activity?: string }>;
}) {
  const { route, depart, activity } = await searchParams;
  // 行程設定與今日判讀共用同一組網址參數；無效值視為未指定
  const trip = {
    depart: parseDeparture(depart, new Date())?.toISOString() ?? null,
    activity: parseActivity(activity),
  };
  return (
    <AppShell current="routes">
      <RoutesClient initialRouteId={route} trip={trip} />
    </AppShell>
  );
}
