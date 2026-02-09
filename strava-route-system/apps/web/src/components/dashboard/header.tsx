"use client";

import { useState } from "react";
import { Bell, Search, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSync } from "@/contexts/SyncContext";
import { useSignOut } from "@/components/auth/sign-out-button";
import { getInitials } from "@/constants";

export function Header() {
  const { user } = useAuth();
  const { syncing, setSyncing, setLastSyncCount } = useSync();
  const handleSignOut = useSignOut();
  /** 取得授權網址後先不跳轉，顯示確認再導向（避免多人共用瀏覽器時誤用他人 Strava） */
  const [pendingStravaUrl, setPendingStravaUrl] = useState<string | null>(null);

  const handleSyncNow = async () => {
    if (!user?.uid) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/strava/sync", {
        method: "POST",
        credentials: "include",
        headers: { "X-Client-UID": user.uid },
      });
      const data = await res.json();

      if (data.needAuth) {
        const urlRes = await fetch("/api/strava/oauth-url", {
          credentials: "include",
          headers: { "X-Client-UID": user.uid },
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) {
          toast.error((urlData.error as string) ?? "無法取得 Strava 授權網址，請稍後再試");
          return;
        }
        if (urlData.oauthUrl) {
          setPendingStravaUrl(urlData.oauthUrl);
          return;
        }
        toast.error("無法取得 Strava 授權網址，請稍後再試");
        return;
      }

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("登入狀態與頁面不符，請重新整理頁面後再試");
          return;
        }
        const msg = (data.error as string) ?? "";
        const isAuthError =
          res.status === 401 ||
          /401|Authorization Error|invalid.*access_token|過期|尚未連結/i.test(msg);
        if (isAuthError) {
          toast.error("尚未連結 Strava 或授權已失效，請先完成 Strava 授權", { duration: 2000 });
        } else {
          toast.error(msg || "Strava 同步失敗，請稍後再試");
        }
        return;
      }
      const count = data.count ?? 0;
      setLastSyncCount(count);
    } finally {
      setSyncing(false);
    }
  };

  const displayName = user?.displayName ?? null;
  const email = user?.email ?? null;
  const initials = getInitials(displayName, email);

  return (
    <header className="flex flex-col gap-4 pb-6">
      {/* confirm to authorize */}
      {pendingStravaUrl && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">請確認使用您自己的 Strava 帳號</p>
          <p className="mt-1 text-muted-foreground">
            多人共用瀏覽器時，授權畫面會顯示目前登入的 Strava 帳號。<span className="text-amber-600 dark:text-amber-500 font-medium">若為他人帳號請勿點擊授權</span>，否則其活動資料將被連結至您的 app 帳號（資安風險）。請先登出 Strava 或使用無痕視窗後再點「前往授權」。
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPendingStravaUrl(null)}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-strava hover:bg-strava/90"
              onClick={() => {
                if (pendingStravaUrl) window.location.href = pendingStravaUrl;
              }}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              前往 Strava 授權
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          歡迎回來! {displayName ?? email ?? "使用者"} 這是您的Strava活動數據概覽。
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search - hidden on mobile */}
        <div className="hidden md:block relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search activities..."
            className="w-64 pl-9 bg-secondary border-border focus-visible:ring-strava"
          />
        </div>

        {/* Sync button */}
        <Button
          variant="outline"
          size="sm"
          className="flex gap-2 border-border hover:bg-strava hover:text-primary-foreground hover:border-strava bg-transparent"
          onClick={handleSyncNow}
          disabled={syncing}
          title="Sync Now"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0" />
          )}
          <span className="hidden sm:inline">Sync Now</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-strava text-primary-foreground border-0 text-xs">
                3
              </Badge>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover border-border">
            <DropdownMenuLabel className="text-foreground">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <span className="font-medium text-foreground">New activity synced</span>
              <span className="text-xs text-muted-foreground">Morning Run - 8.45 km</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <span className="font-medium text-foreground">Weekly goal achieved!</span>
              <span className="text-xs text-muted-foreground">You&apos;ve hit 50 km this week</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <span className="font-medium text-foreground">Sync completed</span>
              <span className="text-xs text-muted-foreground">324 activities imported</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL ?? undefined} alt={displayName ?? undefined} />
                <AvatarFallback className="bg-strava text-primary-foreground text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuLabel className="text-foreground">
              <div className="flex flex-col">
                <span>{displayName ?? email ?? "使用者"}</span>
                {email && (
                  <span className="text-xs font-normal text-muted-foreground">{email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="cursor-pointer text-foreground">個人資料</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-foreground">設定</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-foreground">連結的應用程式</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer text-destructive"
              onSelect={handleSignOut}
            >
              登出
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  );
}
