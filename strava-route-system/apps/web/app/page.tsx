"use client";

import Image from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const searchParams = useSearchParams();
  const [athleteData, setAthleteData] = useState<{
    id: string;
    name: string;
    username: string;
    city: string;
    country: string;
    premium: boolean;
    profile: string;
  } | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/strava/oauth-url')
      .then((res) => res.json())
      .then((data) => {
        if (data.oauthUrl) {
          setOauthUrl(data.oauthUrl);
        } else {
          console.error('❌ Failed to get OAuth URL:', data.error, data.details);
        }
      })
      .catch((err) => {
        console.error('❌ Error fetching OAuth URL:', err);
        alert(`取得 OAuth URL 時發生錯誤: ${err.message}`);
      });
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'strava_connected') {
      const data = {
        id: searchParams.get('athlete_id') || '',
        name: searchParams.get('athlete_name') || '',
        username: searchParams.get('athlete_username') || '',
        city: searchParams.get('athlete_city') || '',
        country: searchParams.get('athlete_country') || '',
        premium: searchParams.get('athlete_premium') === 'true',
        profile: searchParams.get('athlete_profile') || ''
      };

      setAthleteData(data);

      // 在瀏覽器 console 顯示使用者資料
      console.log('✅ Strava 授權成功！使用者資料：', {
        '使用者 ID': data.id,
        '姓名': data.name,
        '使用者名稱': data.username || '未設定',
        '城市': data.city || '未設定',
        '國家': data.country || '未設定',
        'Premium': data.premium ? '是' : '否',
        '大頭照': data.profile
      });
    }

    if (error) {
      console.error('❌ Strava 授權失敗：', error);
    }
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {athleteData ? (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-4">
              ✅ Strava 授權成功！
            </h1>
            {athleteData.profile && (
              <Image
                src={athleteData.profile}
                alt="Profile"
                width={100}
                height={100}
                className="mx-auto mb-4 rounded-full"
                unoptimized
              />
            )}
            <div className="space-y-2 mb-4">
              <p>
                <strong>姓名：</strong>
                {athleteData.name}
              </p>
              {athleteData.username && (
                <p>
                  <strong>使用者名稱：</strong>
                  {athleteData.username}
                </p>
              )}
              {athleteData.city && (
                <p>
                  <strong>城市：</strong>
                  {athleteData.city}
                </p>
              )}
              {athleteData.country && (
                <p>
                  <strong>國家：</strong>
                  {athleteData.country}
                </p>
              )}
              <p>
                <strong>Premium：</strong>
                {athleteData.premium ? "是" : "否"}
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              請查看瀏覽器 console 查看完整資料
            </p>
            <form action="/" method="post" className="mx-auto">
              <Button type="submit" className={styles.secondary}>
                登出
              </Button>
            </form>
          </div>
        ) : oauthUrl ? (
          <div className="text-center">
            <div className="text-2xl mb-4">連結 Strava</div>
            <p className="text-gray-500">
              點擊下方按鈕開始 Strava 授權流程
            </p>
            <Link href={oauthUrl}>
              <Button appName="web" className={styles.secondary}>
                連結 Strava
              </Button>
            </Link>
          </div>
        ) : (
          <button
            className={`${styles.secondary} cursor-not-allowed opacity-60`}
            disabled
          >
            載入中...
          </button>
        )}
      </main>
    </div>
  );
}
