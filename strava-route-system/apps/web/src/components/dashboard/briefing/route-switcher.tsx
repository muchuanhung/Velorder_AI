import Link from "next/link";
import { cn } from "@/lib/utils";

/** 路線切換：純連結（?route=），可分享、可上一頁，不需客戶端狀態 */
export function RouteSwitcher({ routes, currentId }: { routes: { id: string; name: string }[]; currentId: string }) {
  if (routes.length < 2) return null;
  return (
    <nav aria-label="切換路線" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 pb-1">
        {routes.map((r) => {
          const active = r.id === currentId;
          return (
            <li key={r.id}>
              <Link
                href={`/dashboard?route=${encodeURIComponent(r.id)}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {r.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
