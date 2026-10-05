import { cn } from "@/lib/utils";

/** 全站頁尾：品牌與資料來源 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("text-center text-xs text-muted-foreground", className)}>
      曉行 Dawnline｜資料來源：交通部中央氣象署、TDX 運輸資料流通服務
    </footer>
  );
}
