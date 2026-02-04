"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Layers, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export function ActivityMap() {
  const [selectedActivity, setSelectedActivity] = useState("Morning Run");

  // Simulated GPS track points for visualization
  const trackPoints = [
    { x: 15, y: 60 },
    { x: 20, y: 45 },
    { x: 30, y: 40 },
    { x: 45, y: 35 },
    { x: 55, y: 30 },
    { x: 65, y: 35 },
    { x: 75, y: 45 },
    { x: 80, y: 55 },
    { x: 85, y: 65 },
    { x: 80, y: 75 },
    { x: 70, y: 80 },
    { x: 55, y: 78 },
    { x: 40, y: 75 },
    { x: 25, y: 70 },
    { x: 15, y: 60 },
  ];

  const pathD = trackPoints
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">Activity Map</CardTitle>
          <p className="text-sm text-muted-foreground">GPS tracks from recent activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-strava/10 text-strava border-0">
            <MapPin className="h-3 w-3 mr-1" />
            {selectedActivity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[400px] bg-secondary/30 rounded-b-lg overflow-hidden">
          {/* Map placeholder with stylized representation */}
          <div className="absolute inset-0">
            {/* Grid pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Stylized map terrain */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Water feature */}
              <ellipse cx="80" cy="25" rx="15" ry="10" className="fill-chart-2/20" />
              
              {/* Parks/green areas */}
              <circle cx="30" cy="70" r="12" className="fill-success/10" />
              <circle cx="65" cy="60" r="8" className="fill-success/10" />
              
              {/* Roads */}
              <path d="M 0 50 Q 50 45 100 50" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-muted-foreground/30" />
              <path d="M 50 0 Q 55 50 50 100" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-muted-foreground/30" />
              
              {/* GPS Track with glow effect */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#trackGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-lg"
              />
              <path
                d={pathD}
                fill="none"
                className="stroke-strava"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Start marker */}
              {(() => {
                const startPoint = trackPoints[0];
                return startPoint != null ? (
                  <>
                    <circle cx={startPoint.x} cy={startPoint.y} r="3" className="fill-success" />
                    <circle cx={startPoint.x} cy={startPoint.y} r="5" className="fill-success/30" />
                  </>
                ) : null;
              })()}
              {/* End marker */}
              {(() => {
                const endPoint = trackPoints[trackPoints.length - 2];
                return endPoint != null ? (
                  <>
                    <circle cx={endPoint.x} cy={endPoint.y} r="3" className="fill-strava" />
                    <circle cx={endPoint.x} cy={endPoint.y} r="5" className="fill-strava/30" />
                  </>
                ) : null;
              })()}
              
              <defs>
                <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(var(--success))" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="rgb(252, 76, 2)" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Map controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="h-8 w-8 bg-card/90 backdrop-blur-sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="h-8 w-8 bg-card/90 backdrop-blur-sm">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="h-8 w-8 bg-card/90 backdrop-blur-sm">
              <Layers className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="h-8 w-8 bg-card/90 backdrop-blur-sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Activity selector */}
          <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
            {["Morning Run", "Evening Ride", "Weekend Hike"].map((activity) => (
              <Button
                key={activity}
                size="sm"
                variant={selectedActivity === activity ? "default" : "secondary"}
                className={selectedActivity === activity ? "bg-strava hover:bg-strava/90 text-primary-foreground" : "bg-card/90 backdrop-blur-sm"}
                onClick={() => setSelectedActivity(activity)}
              >
                {activity}
              </Button>
            ))}
          </div>

          {/* Placeholder text */}
          <div className="absolute top-4 left-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
            Leaflet/Mapbox integration ready
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
