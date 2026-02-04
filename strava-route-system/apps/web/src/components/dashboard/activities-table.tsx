"use client";

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
import { Bike, Footprints, Mountain, ArrowUpRight, Heart } from "lucide-react";

const activities = [
  {
    id: 1,
    name: "Morning Run - Central Park Loop",
    date: "Today, 7:32 AM",
    type: "Run",
    distance: "8.45 km",
    heartRate: 156,
    icon: Footprints,
  },
  {
    id: 2,
    name: "Evening Ride - River Trail",
    date: "Yesterday, 6:15 PM",
    type: "Ride",
    distance: "32.8 km",
    heartRate: 142,
    icon: Bike,
  },
  {
    id: 3,
    name: "Weekend Hike - Bear Mountain",
    date: "Jan 28, 2026",
    type: "Hike",
    distance: "14.2 km",
    heartRate: 128,
    icon: Mountain,
  },
  {
    id: 4,
    name: "Tempo Run - Track Session",
    date: "Jan 27, 2026",
    type: "Run",
    distance: "6.0 km",
    heartRate: 168,
    icon: Footprints,
  },
  {
    id: 5,
    name: "Recovery Ride - Neighborhood",
    date: "Jan 26, 2026",
    type: "Ride",
    distance: "18.5 km",
    heartRate: 118,
    icon: Bike,
  },
];

const typeColors: Record<string, string> = {
  Run: "bg-strava/10 text-strava border-strava/20",
  Ride: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  Hike: "bg-success/10 text-success border-success/20",
};

export function ActivitiesTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activities</CardTitle>
          <p className="text-sm text-muted-foreground">Your latest Strava activities</p>
        </div>
        <Button variant="ghost" size="sm" className="text-strava hover:text-strava hover:bg-strava/10">
          View all
          <ArrowUpRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Activity</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Distance</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Avg HR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow
                  key={activity.id}
                  className="border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <activity.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="truncate max-w-[200px] text-foreground">{activity.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{activity.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeColors[activity.type]}>
                      {activity.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">{activity.distance}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-foreground">{activity.heartRate}</span>
                      <span className="text-muted-foreground text-xs">bpm</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
