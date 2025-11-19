"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import styles from "../../../page.module.css";
import { Button } from "@repo/ui/button";
import {
  athleteFields,
  mapSearchParamsToAthlete,
  AthleteState
} from "../../../../constants";

export default function StravaProfilePage() {
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const userId = params?.userId ?? "";

  const athleteData: AthleteState | null = searchParams?.size
    ? mapSearchParamsToAthlete(
        userId,
        Object.fromEntries(searchParams.entries())
      )
    : null;

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
                alt={athleteData.name}
                width={100}
                height={100}
                className="mx-auto mb-4 rounded-full"
                unoptimized
              />
            )}
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
            <p className="text-sm text-gray-500 mb-4">
              請查看瀏覽器 console 查看完整資料
            </p>
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

