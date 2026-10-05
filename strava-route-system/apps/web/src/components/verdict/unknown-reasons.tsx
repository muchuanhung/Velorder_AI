"use client";

import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UNKNOWN_REASON_TEXT, type UnknownReason } from "@/lib/routes/recon-geo";
import { cn } from "@/lib/utils";

/**
 * 未判定 badge：外觀不變，點開看為什麼未判定（手機沒有 hover，所以用 Popover 不用 tooltip）。
 */
export function UnknownReasons({
  reasons,
  children,
  className,
}: {
  reasons: UnknownReason[] | undefined;
  children: ReactNode;
  className?: string;
}) {
  const list: UnknownReason[] = reasons?.length ? reasons : ["no_data"];
  return (
    <Popover>
      <PopoverTrigger
        className={cn("cursor-help underline decoration-dotted underline-offset-4", className)}
        aria-label="為什麼未判定"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="space-y-2 text-sm">
        <p className="font-bold">為什麼未判定</p>
        <ul className="space-y-1.5">
          {list.map((r) => (
            <li key={r}>
              <b>{UNKNOWN_REASON_TEXT[r].title}</b>
              <span className="text-muted-foreground">：{UNKNOWN_REASON_TEXT[r].detail}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">未判定不代表安全。</p>
      </PopoverContent>
    </Popover>
  );
}
