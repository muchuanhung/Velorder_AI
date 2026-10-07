import { Route, CloudSun, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Route,
    title: "逐公里標示",
    short: "逐公里標示",
    description: "沿 GPX 軌跡逐段標出走、慢、停，一眼看出哪一段要注意。",
  },
  {
    icon: CloudSun,
    title: "天氣與路況一起看",
    short: "天氣＋路況",
    description: "交通部中央氣象署鄉鎮預報與雨量，加上 TDX 路況事件。",
  },
  {
    icon: HelpCircle,
    title: "缺資料標未判定",
    short: "缺資料標未判定",
    description: "資料不足或過期，一律不當成安全。",
  },
];

/**
 * 功能說明：三則全部列出（不輪播，避免後兩則沒人看到）。
 * full＝桌機 hero，含說明；compact＝手機版，三欄等寬（圖示在上、短標題在下），固定一排不換行，避免把登入表單推到首屏外。
 */
export function FeatureList({ variant = "full", className }: { variant?: "full" | "compact"; className?: string }) {
  if (variant === "compact") {
    return (
      <ul className={cn("grid grid-cols-3 gap-2", className)} aria-label="功能">
        {features.map(({ icon: Icon, title, short }) => (
          <li
            key={title}
            className="flex flex-col items-center gap-1 rounded-lg bg-secondary/70 px-1 py-2 text-center text-xs font-medium text-foreground"
          >
            <Icon className="size-4 text-primary" aria-hidden />
            <span className="whitespace-nowrap">{short}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("space-y-4", className)} aria-label="功能">
      {features.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div>
            <h2 className="font-medium text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
