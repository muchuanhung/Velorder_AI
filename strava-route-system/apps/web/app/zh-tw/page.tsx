"use client";

import { useEffect, useState } from "react";
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs";
import { Button } from "@repo/ui/button";
import Spinner from "../../components/Spinner";
import StravaConnectSection from "../../components/strava/StravaConnectSection";

export default function ZHTWHome() {
  const { isSignedIn, isLoaded } = useAuth();
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    fetch("/api/strava/oauth-url")
      .then((res) => res.json())
      .then((data) => {
        if (data.oauthUrl) {
          setOauthUrl(data.oauthUrl);
          setError(null);
        } else {
          console.error("❌ Failed to get OAuth URL:", data.error, data.details);
          setError("無法取得 Strava 授權網址，請稍後再試。");
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching OAuth URL:", err);
        setError("取得 OAuth URL 時發生錯誤，請檢查網路或稍後再試。");
      });
  }, [isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100svh] w-full items-center justify-center px-6 py-10 md:px-16">
        <main className="flex w-full max-w-3xl flex-col items-center gap-8">
          <Spinner size={40} />
        </main>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-6 py-10 md:px-16">
        <div className="flex w-full max-w-md flex-col items-center space-y-4 text-center">
          <h1 className="text-2xl font-semibold">請先登入</h1>
          <p className="text-[40px]">您需要先登入才能使用 Strava 功能</p>
          <SignInButton mode="modal">
            <Button
              appName="web"
              className="btn btn-secondary px-6"
            >
              登入
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center px-6 py-10 md:px-16">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8">
        <StravaAuthContent
          oauthUrl={oauthUrl}
          error={error}
        />
      </main>
    </div>
  );
}

interface StravaAuthContentProps {
  oauthUrl: string | null;
  error: string | null;
}

function StravaAuthContent({ oauthUrl, error }: StravaAuthContentProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <div className="flex items-center gap-4">
        <SignOutButton redirectUrl="/zh-tw">
          <Button
            appName="web"
            className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border border-black/10 bg-transparent px-5 text-base font-medium text-black transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            登出
          </Button>
        </SignOutButton>
        <StravaConnectSection oauthUrl={oauthUrl} error={error} />
      </div>
      <h1 className="text-2xl font-semibold">連結 Strava</h1>
      <p className="text-gray-500">
        點擊下方按鈕開始 Strava 授權流程，完成後即可查看使用者資料。
      </p>
    </div>
  );
}

