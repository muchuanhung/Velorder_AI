import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/server";
import { AppShell } from "@/components/app-shell/app-shell";
import { PrivateRoutesContent } from "@/components/routes/private-routes-content";

export const metadata: Metadata = { title: "私人路線" };

export default async function PrivateRoutesPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return (
    <AppShell current="routes">
      <PrivateRoutesContent />
    </AppShell>
  );
}
