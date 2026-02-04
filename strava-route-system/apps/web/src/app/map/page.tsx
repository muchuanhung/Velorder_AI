"use client";

// Client Component：之後接 Mapbox 即時同步
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";

export default function MapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center">
        <p className="text-default">載入中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-[100svh] w-full flex-col p-4">
      <div className="flex justify-end gap-2">
        <Link href="/dashboard">
          <Button appName="web" className="btn btn-secondary">
            返回 Dashboard
          </Button>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center text-default">
        <p>Map 頁面（Mapbox 即時同步待接上）</p>
      </div>
    </div>
  );
}
