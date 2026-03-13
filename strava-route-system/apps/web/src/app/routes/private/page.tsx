"use client";

import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { ProUpgradeModal } from "@/components/ui/pro-ugrade-modal";
import { useState } from "react";

export default function PrivateRoutesPage() {
  const { isPro, loading } = useSubscription();
  const [proModalOpen, setProModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64 flex items-center justify-center min-h-screen">
          <p className="text-sm text-muted-foreground">載入中...</p>
        </main>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64 transition-all duration-300">
          <div className="flex min-h-screen flex-col items-center justify-center p-4 pt-16 lg:pt-8">
            <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border/50 bg-card p-8 shadow-xl">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/20 ring-1 ring-amber-400/30">
                <Lock className="h-8 w-8 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Pro 專屬功能</h1>
              <p className="text-center text-sm text-muted-foreground">
                私人路線為 Pro 會員專屬功能，升級後即可上傳與管理你的私人 GPX 路線。
              </p>
              <Button
                className="w-full"
                onClick={() => setProModalOpen(true)}
              >
                升級到 Pro
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/routes" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  返回熱門路線
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <ProUpgradeModal open={proModalOpen} onOpenChange={setProModalOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="p-4 pt-16 lg:pt-8 lg:p-8">
          <h1 className="text-xl font-bold text-foreground">私人路線</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            你已解鎖私人路線功能，可在此上傳與管理你的私人 GPX。
          </p>
          <div className="mt-6 rounded-lg border border-dashed border-border/50 bg-card/30 p-12 text-center">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">
              私人路線上傳功能開發中
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
