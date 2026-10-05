import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { RoutesClient } from "@/components/routes/routes-client";

export const metadata: Metadata = { title: "路線示警" };

/** 路線示警：公開頁面；?route= 指定要打開的路線（Dashboard 會帶過來） */
export default async function RoutesPage({ searchParams }: { searchParams: Promise<{ route?: string }> }) {
  const { route } = await searchParams;
  return (
    <AppShell current="routes">
      <RoutesClient initialRouteId={route} />
    </AppShell>
  );
}
