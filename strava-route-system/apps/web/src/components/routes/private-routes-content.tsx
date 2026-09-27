"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { ProUpgradeModal } from "@/components/ui/pro-ugrade-modal";

/** 私人路線（Pro）：未訂閱顯示升級說明；已訂閱顯示上傳區（功能開發中） */
export function PrivateRoutesContent() {
  const { isPro, loading } = useSubscription();
  const [proModalOpen, setProModalOpen] = useState(false);

  if (loading) {
    return (
      <p className="py-24 text-center text-sm text-muted-foreground" role="status">
        載入中...
      </p>
    );
  }

  if (!isPro) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-accent">
            <Lock className="size-8 text-primary" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-foreground">Pro 專屬功能</h1>
          <p className="text-center text-sm text-muted-foreground">
            私人路線為 Pro 會員專屬功能，升級後即可上傳與管理你的私人 GPX 路線。
          </p>
          <Button className="w-full" onClick={() => setProModalOpen(true)}>
            升級到 Pro
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/routes" className="flex items-center gap-2">
              <ArrowLeft className="size-4" aria-hidden />
              返回路線示警
            </Link>
          </Button>
        </div>
        <ProUpgradeModal open={proModalOpen} onOpenChange={setProModalOpen} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">私人路線</h1>
      <p className="mt-2 text-sm text-muted-foreground">你已解鎖私人路線功能，可在此上傳與管理你的私人 GPX。</p>
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <Lock className="mx-auto size-12 text-muted-foreground/40" aria-hidden />
        <p className="mt-4 text-sm text-muted-foreground">私人路線上傳功能開發中</p>
      </div>
    </div>
  );
}
