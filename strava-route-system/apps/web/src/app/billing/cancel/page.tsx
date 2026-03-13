import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="flex min-h-screen flex-col items-center justify-center p-4 pt-16 lg:pt-8">
          <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border/50 bg-card p-8 shadow-xl">
            <h1 className="text-xl font-bold text-foreground">已取消訂閱</h1>
            <p className="text-center text-sm text-muted-foreground">
              你已取消本次訂閱流程。若之後想升級 Pro，隨時可以從側邊欄的「升級到 Pro」再次訂閱。
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/profile" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回個人資料
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
