import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLabEnabled } from "@/lib/lab/flag";
import { RouteSimClient } from "@/components/lab/route-sim/route-sim-client";

export const metadata: Metadata = {
  title: "路線沙盤（實驗）",
  robots: { index: false, follow: false },
};

export default function RouteSimPage() {
  if (!isLabEnabled()) notFound();
  return <RouteSimClient />;
}
