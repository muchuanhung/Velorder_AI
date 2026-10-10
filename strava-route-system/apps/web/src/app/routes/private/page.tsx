import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "私人路線" };

/**
 * 私人路線上傳 GPX 尚未完成，先隱藏：路線頁不放入口，直接開網址回 404。
 * 完成後恢復登入檢查並顯示 components/routes/private-routes-content.tsx。
 */
export default function PrivateRoutesPage() {
  notFound();
}
