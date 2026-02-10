"use client";

import { Mail, Lock, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface AccountInfoProps {
  email: string;
  displayName: string;
}

export function AccountInfo({ email, displayName }: AccountInfoProps) {
  return (
    <TooltipProvider>
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
              <Mail className="h-4 w-4 text-strava" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">帳號資訊</CardTitle>
              <CardDescription>帳號資訊由 Firebase 管理。</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-sm text-foreground">
              名稱
            </Label>
            <Input
              id="display-name"
              value={displayName}
              disabled
              className="bg-secondary text-muted-foreground disabled:opacity-70"
            />
          </div>

          {/* Email - Read-Only with Lock + Tooltip */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="email" className="text-sm text-foreground">
                電子郵件
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Email information"
                  >
                    <Lock className="h-3 w-3" />
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Account email is managed via Firebase and cannot be changed.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-secondary pl-10 text-muted-foreground disabled:opacity-70"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              要更改您的電子郵件，請在您的 Google 帳號設定中更新。
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}