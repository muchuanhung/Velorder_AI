"use client";

import React from "react"

import { Card, CardContent } from "@/components/ui/card";
import { Route, Mountain, Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  highlight?: boolean;
}

function StatCard({ title, value, subtitle, icon, trend, highlight }: StatCardProps) {
  return (
    <Card className={cn(
      "bg-card border-border transition-all hover:border-strava/30",
      highlight && "border-strava/50"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              highlight ? "text-strava" : "text-foreground"
            )}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-strava/10 text-strava" : "bg-secondary text-muted-foreground"
          )}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className={trend.positive ? "text-success" : "text-destructive"}>
              {trend.positive ? "+" : ""}{trend.value}
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type JobStatus = "idle" | "running" | "completed" | "error";

function JobStatusCard({ status }: { status: JobStatus }) {
  const statusConfig = {
    idle: { icon: <CheckCircle2 className="h-5 w-5" />, label: "Ready", color: "text-muted-foreground" },
    running: { icon: <Loader2 className="h-5 w-5 animate-spin" />, label: "Syncing...", color: "text-strava" },
    completed: { icon: <CheckCircle2 className="h-5 w-5" />, label: "Synced", color: "text-success" },
    error: { icon: <AlertCircle className="h-5 w-5" />, label: "Error", color: "text-destructive" },
  };

  const config = statusConfig[status];

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Inngest Job Status</p>
            <p className={cn("text-2xl font-bold tracking-tight", config.color)}>
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground">Background sync process</p>
          </div>
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary",
            config.color
          )}>
            {config.icon}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
          <span>Last sync: 2 minutes ago</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Distance"
        value="1,284 km"
        subtitle="This month"
        icon={<Route className="h-5 w-5" />}
        trend={{ value: "12.5%", positive: true }}
        highlight
      />
      <StatCard
        title="Elevation Gain"
        value="24,892 m"
        subtitle="This month"
        icon={<Mountain className="h-5 w-5" />}
        trend={{ value: "8.3%", positive: true }}
      />
      <StatCard
        title="Active Hours"
        value="68.5 hrs"
        subtitle="This month"
        icon={<Clock className="h-5 w-5" />}
        trend={{ value: "2.1%", positive: false }}
      />
      <JobStatusCard status="completed" />
    </div>
  );
}
