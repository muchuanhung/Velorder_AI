import { Lock } from "lucide-react";

/** 私人路線：登入即可使用；上傳區功能開發中 */
export function PrivateRoutesContent() {
  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">私人路線</h1>
      <p className="mt-2 text-sm text-muted-foreground">在此上傳與管理你的私人 GPX 路線。</p>
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <Lock className="mx-auto size-12 text-muted-foreground/40" aria-hidden />
        <p className="mt-4 text-sm text-muted-foreground">私人路線上傳功能開發中</p>
      </div>
    </div>
  );
}
