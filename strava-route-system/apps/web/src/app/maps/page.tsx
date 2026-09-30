import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { MapsClient } from "@/components/maps/maps-client";

export const metadata: Metadata = { title: "降雨地圖｜Routecast" };

export default function MapsPage() {
  return (
    <AppShell current="maps" fullBleed>
      <MapsClient />
    </AppShell>
  );
}
