"use client";

import { useState, useEffect } from "react";
import { Camera, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatarUrl?: string;
  joinedDate: string;
}

function formatPeriodRemaining(periodEndSec: number): string {
  const now = Date.now();
  const end = periodEndSec * 1000;
  const diff = end - now;
  if (diff <= 0) return "已到期";
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} 個月後到期`;
  }
  return `${days} 天後到期`;
}

export function ProfileHeader({ name, email, avatarUrl, joinedDate }: ProfileHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { isPro, currentPeriodEnd } = useSubscription();
  useEffect(() => setMounted(true), []);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      {/* Avatar with edit overlay */}
      <div className="group relative">
        <Avatar className="h-24 w-24 border-2 border-border">
          {mounted && avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="bg-strava text-primary-foreground text-2xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          className="absolute inset-0 flex h-24 w-24 items-center justify-center rounded-full bg-background/60 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Change avatar"
        >
          <Camera className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      {/* Info */}
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            {name}
          </h1>
          {isPro && (
            <Badge
              variant="secondary"
              className="gap-1 border-amber-400/30 bg-amber-400/10 text-amber-300"
            >
              <Crown className="h-3 w-3 fill-amber-400/50" />
              Pro
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{email}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs text-muted-foreground"
          >
            Joined {joinedDate}
          </Badge>
          {isPro && (
            <Badge
              variant="outline"
              className="text-xs text-muted-foreground border-amber-400/20"
            >
              {currentPeriodEnd
                ? formatPeriodRemaining(currentPeriodEnd)
                : "Pro 試用中"}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}