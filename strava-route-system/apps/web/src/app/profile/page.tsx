import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/server";
import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileContent } from "@/components/profile/profile-content";

export const metadata: Metadata = { title: "個人資料｜Dawnline" };

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return (
    <AppShell current="profile">
      <ProfileContent />
    </AppShell>
  );
}
