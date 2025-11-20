"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs";
import styles from "../../../page.module.css";
import { Button } from "@repo/ui/button";
import {
  athleteFields,
  AthleteState,
  activityFields,
  ActivityState
} from "../../../../constants";

export default function StravaProfilePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const userId = params?.userId ?? "";

  const accessToken = searchParams.get("access_token");
  const activityId = searchParams.get("activity_id");

  const [athleteData, setAthleteData] = useState<AthleteState | null>(null);
  const [athleteError, setAthleteError] = useState<string | null>(null);
  const [athleteLoading, setAthleteLoading] = useState(false);

  const [activity, setActivity] = useState<ActivityState | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // 如果未登入，重定向到登入頁面
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/zh-tw");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!accessToken || !userId) {
      return;
    }

    setAthleteLoading(true);
    fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error("Strava 使用者資料取得失敗");
        }
        const athleteState: AthleteState = {
          id: userId,
          name: `${data.firstname} ${data.lastname}`,
          username: data.username || "",
          city: data.city || "",
          country: data.country || "",
          premium: data.premium,
          profile: data.profile
        };
        setAthleteData(athleteState);
        setAthleteError(null);
      })
      .catch((err) => {
        console.error("❌ 取得 Strava 使用者資料失敗", err);
        setAthleteError(err.message);
      })
      .finally(() => {
        setAthleteLoading(false);
      });
  }, [accessToken, userId]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (!activityId) {
      setActivityError("缺少活動 ID，請重新授權 Strava");
      return;
    }

    setActivityLoading(true);
    fetch(`/api/strava/activities/${activityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data) {
          throw new Error("Strava 活動取得失敗");
        }
        const { id, name, distance, moving_time } = data as ActivityState;
        setActivity({
          id,
          name,
          distance,
          moving_time
        });
        setActivityError(null);
      })
      .catch((err) => {
        console.error("❌ 取得 Strava 活動資料失敗", err);
        setActivityError(err.message);
      })
      .finally(() => setActivityLoading(false));
  }, [accessToken, activityId]);

  // 載入中或未登入時顯示載入畫面或登入提示
  if (!isLoaded) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">載入中...</h1>
          </div>
        </main>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">請先登入</h1>
            <p className="text-gray-500">
              您需要先登入才能查看 Strava 資料
            </p>
            <SignInButton mode="modal">
              <Button className={styles.secondary}>登入</Button>
            </SignInButton>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="flex items-center gap-4 w-full justify-end mb-4">
          <SignOutButton redirectUrl="/zh-tw">
            <Button className={styles.secondary}>登出</Button>
          </SignOutButton>
        </div>
        {athleteLoading ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">Strava 資料載入中...</h1>
            <p className="text-gray-500">請稍候，正在取得 Strava 使用者資料。</p>
          </div>
        ) : athleteError ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-red-500">
              無法取得 Strava 使用者資料
            </h1>
            <p className="text-gray-500">{athleteError}</p>
          </div>
        ) : athleteData ? (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-4">
              ✅ Strava 授權成功！
            </h1>
            {athleteData.profile ? (
              <Image
                src={athleteData.profile}
                alt={athleteData.name}
                width={100}
                height={100}
                className="mx-auto mb-4 rounded-full"
                unoptimized
              />
            ) : (
              <div className="w-[100px] h-[100px] mx-auto mb-4 rounded-full bg-gray-200" />
            )}

            <div className="mb-4">
              <p className="text-sm font-semibold">最新活動</p>
              {activityLoading && (
                <p className="text-sm text-gray-500">活動資料載入中...</p>
              )}
              {activityError && (
                <p className="text-sm text-red-500">{activityError}</p>
              )}
              {activity && (
                <div className="space-y-1 text-left inline-block">
                  {activityFields.map(({ key, label, formatter }) => {
                    const value = activity[key as keyof ActivityState];
                    const displayValue =
                      formatter?.(value) ??
                      (value !== null && value !== undefined
                        ? String(value)
                        : "未提供");
                    return (
                      <p key={key}>
                        <strong>{label}：</strong>
                        {displayValue}
                      </p>
                    );
                  })}
                </div>
              )}
              {!activityLoading && !activity && !activityError && (
                <p className="text-sm text-gray-500">目前沒有活動資料</p>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {athleteFields.map(({ key, label, optional, formatter }) => {
                const value = athleteData[key as keyof AthleteState];
                if (optional && !value) {
                  return null;
                }
                const displayValue =
                  formatter?.(value) ?? (value ? String(value) : "未設定");
                return (
                  <p key={key}>
                    <strong>{label}：</strong>
                    {displayValue}
                  </p>
                );
              })}
            </div>
            <Link href="/zh-tw" className="mx-auto">
              <Button className={styles.secondary}>返回首頁</Button>
            </Link>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">尚未取得 Strava 資料</h1>
            <p className="text-gray-500">
              請重新回到首頁點擊「連結 Strava」按鈕以完成授權。
            </p>
            <Link href="/zh-tw">
              <Button className={styles.secondary}>返回首頁</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

