"use client";

import { Bell, Search, RefreshCw } from "lucide-react";
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
import { useSignOut } from "@/components/auth/sign-out-button";

export function Header() {
  const handleSignOut = useSignOut();

  return (
    <header className="flex items-center justify-between gap-4 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here&apos;s your fitness overview.
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
        <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-border hover:bg-strava hover:text-primary-foreground hover:border-strava bg-transparent">
          <RefreshCw className="h-4 w-4" />
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
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback className="bg-strava text-primary-foreground text-sm font-medium">JD</AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuLabel className="text-foreground">
              <div className="flex flex-col">
                <span>John Doe</span>
                <span className="text-xs font-normal text-muted-foreground">john@example.com</span>
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
