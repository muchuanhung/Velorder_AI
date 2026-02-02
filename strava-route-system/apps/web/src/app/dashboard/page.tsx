import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { getStravaToken } from "@/lib/background/strava-token-store";

// RSC：取得初步資料（登入狀態、Strava 是否已連結）
export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const tokenData = getStravaToken(userId);
  const hasStrava = Boolean(tokenData);

  return (
    <div className="flex min-h-[100svh] w-full flex-col items-center justify-center gap-6 p-6">
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
