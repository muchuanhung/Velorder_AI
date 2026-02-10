"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "../ui/separator";
import { ProfileHeader } from "@/components/profile/profile-header";
import { AccountInfo } from "@/components/profile/account-info";
import { PasswordChange } from "@/components/profile/password-change";
import { useAuth } from "@/contexts/AuthContext";
import { useSignOut } from "@/components/auth/sign-out-button";

function formatJoinedDate(creationTime: string | undefined): string {
  if (!creationTime) return "—";
  return new Date(creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ProfileContent() {
  const router = useRouter();
  const { user } = useAuth();
  const handleSignOut = useSignOut();

  const handleBack = () => {
    if (typeof window !== "undefined" && document.referrer?.startsWith(window.location.origin)) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="返回上一頁"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              個人資料
            </h2>
            <p className="text-sm text-muted-foreground">
              管理您的密碼及帳號資訊
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden gap-2 border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground sm:flex"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          登出
        </Button>
      </div>

      <Separator className="bg-border" />

      {/* Profile Header */}
      <ProfileHeader
        name={user?.displayName ?? "使用者"}
        email={user?.email ?? ""}
        avatarUrl={user?.photoURL ?? undefined}
        joinedDate={formatJoinedDate(user?.metadata?.creationTime)}
      />

      {/* Account Info */}
      <AccountInfo
        email={user?.email ?? ""}
        displayName={user?.displayName ?? ""}
      />

      {/* Password */}
      <PasswordChange />

      {/* Bottom padding for scroll */}
      <div className="h-8" />
    </div>
  );
}