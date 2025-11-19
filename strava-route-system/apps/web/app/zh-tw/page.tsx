"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import styles from "../page.module.css";

export default function ZHTWHome() {
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-2xl font-semibold">連結 Strava</h1>
          <p className="text-gray-500">
            點擊下方按鈕開始 Strava 授權流程，完成後即可查看使用者資料。
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {oauthUrl ? (
            <Link href={oauthUrl}>
              <Button appName="web" className={styles.secondary}>
                連結 Strava
              </Button>
            </Link>
          ) : (
            <button
              className={`${styles.secondary} cursor-not-allowed opacity-60`}
              disabled
            >
              載入中...
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

