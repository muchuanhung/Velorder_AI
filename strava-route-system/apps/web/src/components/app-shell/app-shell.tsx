import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Map, Route, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppSection = "dashboard" | "routes" | "maps" | "profile";

const NAV: { id: AppSection; label: string; href: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "今日判讀", href: "/dashboard", icon: LayoutDashboard },
  { id: "routes", label: "路線", href: "/routes", icon: Route },
  { id: "maps", label: "地圖", href: "/maps", icon: Map },
  { id: "profile", label: "個人資料", href: "/profile", icon: User },
];

/**
 * 全站外框：桌機頂部導覽、手機底部分頁列。
 * 目前頁面由呼叫端以 current 傳入，整個外框是 Server Component、不需要客戶端 JS。
 */
export function AppShell({
  current,
  fullBleed = false,
  children,
}: {
  current: AppSection;
  /** 地圖等全版面頁：內容填滿頂列與底部分頁列之間，不加寬度限制與內距 */
  fullBleed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(fullBleed ? "flex h-dvh flex-col" : "min-h-dvh")}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        跳到主要內容
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-black tracking-wide text-primary">
            <Image src="/dawnline.svg" alt="" width={32} height={32} className="size-8" priority />
            Dawnline
          </Link>
          <nav aria-label="主要導覽" className="hidden h-full items-stretch gap-6 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={item.id === current ? "page" : undefined}
                className={cn(
                  "flex items-center border-b-2 text-sm font-medium transition-colors",
                  item.id === current
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        className={cn(
          fullBleed
            ? "relative min-h-0 flex-1 pb-[calc(env(safe-area-inset-bottom)+4.25rem)] md:pb-0"
            : "mx-auto max-w-6xl px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 sm:px-6 md:pb-12 md:pt-10"
        )}
      >
        {children}
      </main>

      <nav
        aria-label="主要導覽"
        data-bottom-nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.id === current;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
                active ? "font-bold text-primary" : "text-muted-foreground"
              )}
            >
              <span className={cn("rounded-full px-4 py-1", active && "bg-accent")}>
                <Icon className="size-5" aria-hidden />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
