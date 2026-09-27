import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { PrivateRoutesContent } from "@/components/routes/private-routes-content";

export const metadata: Metadata = { title: "私人路線｜Routecast" };

export default function PrivateRoutesPage() {
  return (
    <AppShell current="routes">
      <PrivateRoutesContent />
    </AppShell>
  );
}
