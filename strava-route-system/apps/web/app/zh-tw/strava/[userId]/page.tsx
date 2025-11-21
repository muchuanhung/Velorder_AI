"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs";
import { Button } from "@repo/ui/button";
import Spinner from "../../../../components/Spinner";
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

  if (!isLoaded) {
    return (
        <Spinner color="#aaa" size={20} />
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[100svh] w-full items-center justify-center px-6 py-10 md:px-16">
        <section className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-[#00372e]">請先登入</h1>
          <p className="text-gray-500">您需要先登入才能查看 Strava 資料</p>
          <SignInButton mode="modal">
            <Button className="btn btn-secondary">登入</Button>
          </SignInButton>
        </section>
      </div>
    );
  }

  const renderActivitySection = () => (
    <section className="space-y-2">
      <p className="text-sm font-semibold">最新活動</p>
      {activityLoading && (
        <p className="text-sm text-gray-500">活動資料載入中...</p>
      )}
      {activityError && (
        <p className="text-sm text-red-500">{activityError}</p>
      )}
      {activity && (
        <div className="inline-block space-y-1 text-left">
          {activityFields.map(({ key, label, formatter }) => {
            const value = activity[key as keyof ActivityState];
            const displayValue =
              formatter?.(value) ??
              (value !== null && value !== undefined ? String(value) : "未提供");
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
    </section>
  );

  const renderAthleteSection = () => {
    if (athleteLoading) {
      return <Spinner size={40} />;
    }

    if (athleteError) {
      return (
        <section className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-red-500">
            無法取得 Strava 使用者資料
          </h1>
          <p className="text-gray-500">{athleteError}</p>
        </section>
      );
    }

    if (athleteData) {
      return (
        <section className="space-y-6 text-center">
          <header>
            <h1 className="mb-4 text-2xl font-semibold">✅ Strava 授權成功！</h1>
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
              <div className="mx-auto mb-4 h-[100px] w-[100px] rounded-full bg-gray-200" />
            )}
          </header>

          {renderActivitySection()}

          <section className="space-y-2">
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
          </section>
        </section>
      );
    }

    return (
      <section className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">尚未取得 Strava 資料</h1>
        <p className="text-gray-500">
          請重新回到首頁點擊「連結 Strava」按鈕以完成授權。
        </p>
        <Link href="/zh-tw">
          <Button className="btn btn-secondary px-6">返回首頁</Button>
        </Link>
      </section>
    );
  };

  return (
    <div className="w-full min-h-[100svh]">
      <div className="flex flex-col gap-8">
        <div className="flex justify-end p-2 p-4 gap-2">
          <Link href="/zh-tw">
            <Button className="btn btn-secondary">返回 Dashboard</Button>
          </Link>
          <SignOutButton redirectUrl="/zh-tw">
            <Button className="btn btn-default">登出</Button>
          </SignOutButton>
        </div>
        {renderAthleteSection()}
      </div>
    </div>
  );
}
