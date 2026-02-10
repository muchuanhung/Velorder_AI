"use client";

import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatarUrl?: string;
  joinedDate: string;
}

export function ProfileHeader({ name, email, avatarUrl, joinedDate }: ProfileHeaderProps) {
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
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
          {name}
        </h1>
        <p className="text-sm text-muted-foreground">{email}</p>
        <Badge
          variant="secondary"
          className="text-xs text-muted-foreground"
        >
          Joined {joinedDate}
        </Badge>
      </div>
    </div>
  );
}