"use client";

import { useState } from "react";
import { Bell, Search, RefreshCw, Loader2 } from "lucide-react";
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
import { useSignOut } from "@/components/auth/sign-out-button";
import { getInitials } from "@/constants";

export function Header() {
  const { user } = useAuth();
  const handleSignOut = useSignOut();
  const [syncing, setSyncing] = useState(false);

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
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("登入狀態與頁面不符，請重新整理頁面後再試");
          return;
        }
        if (data.needAuth) {
          toast.info("尚未連結 Strava，即將導向授權頁面");
          const urlRes = await fetch("/api/strava/oauth-url", { credentials: "include" });
          const urlData = await urlRes.json();
          if (urlData.oauthUrl) {
            window.location.href = urlData.oauthUrl;
            return;
          }
          toast.error("無法取得 Strava 授權網址，請稍後再試");
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
      toast.success(`已同步 ${data.count ?? 0} 筆活動`);
      console.log("Strava sync 回傳：", data);
      console.log("同步活動筆數：", data.count);
      console.log("活動列表：", data.activities);
    } finally {
      setSyncing(false);
    }
  };

  const displayName = user?.displayName ?? null;
  const email = user?.email ?? null;
  const initials = getInitials(displayName, email);

  return (
    <header className="flex items-center justify-between gap-4 pb-6">
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
          className="hidden sm:flex gap-2 border-border hover:bg-strava hover:text-primary-foreground hover:border-strava bg-transparent"
          onClick={handleSyncNow}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync Now
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
    </header>
  );
}
