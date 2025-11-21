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
        <Spinner color="#aaa" size={20} />
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[100svh] w-full items-center justify-center">
        <div className="flex w-full max-w-md flex-col items-center space-y-4 text-center">
          <h1 className="text-default text-[#00372e]">請先登入</h1>
          <p className="text-[40px]">您需要先登入才能使用 Strava 功能</p>
          <SignInButton mode="modal">
            <Button
              appName="web"
              className="btn btn-secondary"
              aria-label="登入"
            >
              登入
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center">
      <StravaAuthContent oauthUrl={oauthUrl} error={error} />
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
      <div className="flex items-center gap-2">
        <SignOutButton redirectUrl="/zh-tw">
          <Button
            appName="web"
            className="btn btn-default"
            aria-label="登出"
          >
            登出
          </Button>
        </SignOutButton>
        <StravaConnectSection oauthUrl={oauthUrl} error={error} />
      </div>
      <div className="text-[24px] font-semibold">連結 Strava</div>
    </div>
  );
}

