import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/server";
import { LoginView } from "@/components/auth/login-view";
import { FeaturedRoutes } from "@/components/home/featured-routes";

/** 入口頁：已登入直接進今日判讀；未登入在同一頁看精選路線判定並登入（/login 也渲染這頁） */
export default async function HomePage() {
  if (await getCurrentUserId()) redirect("/dashboard");

  return (
    <LoginView
      featured={
        <Suspense fallback={null}>
          <FeaturedRoutes />
        </Suspense>
      }
    />
  );
}
