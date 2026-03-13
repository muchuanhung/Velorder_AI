import Link from "next/link";
import { Suspense } from "react";
import { Crown, CheckCircle } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { SuccessSync } from "@/components/billing/success-sync";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <SuccessSync />
      </Suspense>
      <Sidebar />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="flex min-h-screen flex-col items-center justify-center p-4 pt-16 lg:pt-8">
          <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border/50 bg-card p-8 shadow-xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/20 ring-1 ring-amber-400/30">
              <Crown className="h-8 w-8 fill-amber-400/40 text-amber-400" />
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h1 className="text-xl font-bold">升級成功</h1>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              感謝你的訂閱！你已解鎖 Pro 完整功能，包含私人路線、即時路況與天氣進階分析。
            </p>
            <div className="flex w-full gap-2">
              <Button asChild className="flex-1">
                <Link href="/routes/private">前往私人路線</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/profile">個人資料</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
