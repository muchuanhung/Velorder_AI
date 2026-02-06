"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/** 登出並導向 /login，供按鈕或 DropdownMenuItem onSelect 使用 */
export function useSignOut() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return handleSignOut;
}
