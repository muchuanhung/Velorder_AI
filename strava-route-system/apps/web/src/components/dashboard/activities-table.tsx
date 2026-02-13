"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatActivityDate, formatActivityDistance } from "@/constants";
import { Bike, Footprints, Mountain, ArrowUpRight, Heart, Loader2 } from "lucide-react";

type Activity = {
  id: number;
  name: string;
  start_date_local: string;
  type?: string;
  distance: number;
  average_heartrate?: number | null;
};

function getTypeIcon(type?: string) {
  const t = type?.toLowerCase() ?? "";
  if (t.includes("run")) return Footprints;
  if (t.includes("ride") || t.includes("bike")) return Bike;
  return Mountain;
}

const typeColors: Record<string, string> = {
  Run: "bg-strava/10 text-strava border-strava/20",
  Ride: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  Hike: "bg-success/10 text-success border-success/20",
};

export function ActivitiesTable() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/strava/activities?limit=5", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { activities?: Activity[] } | null) => {
        if (!cancelled && data?.activities) setActivities(data.activities);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">最近活動</CardTitle>
          <p className="text-sm text-muted-foreground">您的最新 Strava 活動</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-strava hover:text-strava hover:bg-strava/10">
          <a
            href="https://www.strava.com/athlete/training"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看所有
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">活動</TableHead>
                <TableHead className="text-muted-foreground font-medium">日期</TableHead>
                <TableHead className="text-muted-foreground font-medium">類型</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">距離</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">平均心率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    尚無活動，請先完成 Strava 同步
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => {
                  const Icon = getTypeIcon(activity.type);
                  const typeLabel = activity.type ?? "Activity";
                  return (
                    <TableRow
                      key={activity.id}
                      className="border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="truncate max-w-[200px] text-foreground">{activity.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatActivityDate(activity.start_date_local)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeColors[typeLabel] ?? ""}>
                          {typeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatActivityDistance(activity.distance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {activity.average_heartrate != null ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Heart className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-foreground">{Math.round(activity.average_heartrate)}</span>
                            <span className="text-muted-foreground text-xs">bpm</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
