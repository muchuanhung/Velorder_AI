import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { getCurrentUserId } from "@/lib/auth/server";
import { getStravaToken } from "@/lib/background/strava-token-store";
import { SignOutButton } from "@/components/auth/sign-out-button";

// RSC：取得初步資料（登入狀態、Strava 是否已連結）
export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    console.log("[Auth Server] dashboard: 無 userId，redirect → /login");
    redirect("/login");
  }
  console.log("[Auth Server] dashboard: 有 userId", userId);

  const tokenData = getStravaToken(userId);
  const hasStrava = Boolean(tokenData);

  return (
    <div className="relative flex min-h-[100svh] w-full flex-col items-center justify-center gap-6 p-6">
      <div className="absolute right-4 top-4">
        <SignOutButton />
      </div>
      <h1 className="text-2xl font-semibold text-[#00372e]">Dashboard</h1>
      <p className="text-default">
        {hasStrava ? "已連結 Strava" : "尚未連結 Strava"}
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button appName="web" className="btn btn-secondary">
            {hasStrava ? "管理 Strava" : "連結 Strava"}
          </Button>
        </Link>
        <Link href="/map">
          <Button appName="web" className="btn btn-primary">
            開啟地圖
          </Button>
        </Link>
      </div>
    </div>
  );
}
