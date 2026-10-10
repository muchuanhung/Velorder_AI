"use client";

import { useLinkStatus } from "next/link";
import Spinner from "@/components/ui/Spinner";

/**
 * 路線晶片內文：點下後到新判讀回來前顯示 spinner。
 * useLinkStatus 只在 <Link> 子孫可用，所以拆成 client component 放進 RouteSwitcher 的 Link 裡。
 */
export function RouteChipLabel({ name }: { name: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="inline-flex min-w-0 items-center gap-2" aria-busy={pending || undefined}>
      {pending && <Spinner size="sm" className="shrink-0" />}
      <span className="truncate">{name}</span>
    </span>
  );
}
