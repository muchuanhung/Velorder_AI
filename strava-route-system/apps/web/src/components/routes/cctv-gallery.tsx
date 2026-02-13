"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle as TriangleIcon,
  Flag,
  Maximize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import type { CCTVFeed } from "@/lib/routes/route-data";

interface CCTVGalleryProps {
  feeds: CCTVFeed[];
}

export function CCTVGallery({ feeds }: CCTVGalleryProps) {
  const [reported, setReported] = useState<Set<string>>(new Set());

  function handleReport(id: string) {
    setReported((prev) => new Set(prev).add(id));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      className="rounded-xl border border-border/40 bg-card/40 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-strava" />
            <h3 className="text-sm font-semibold text-foreground">
              Live Road Conditions
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            TDX CCTV feeds along the route
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-success/30 text-success text-[10px] px-2 py-0.5"
        >
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success inline-block animate-pulse" />
          {feeds.filter((f) => f.status === "online").length}/{feeds.length} Online
        </Badge>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {feeds.map((feed, i) => (
          <CCTVCard
            key={feed.id}
            feed={feed}
            index={i}
            isReported={reported.has(feed.id)}
            onReport={() => handleReport(feed.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function CCTVCard({
  feed,
  index,
  isReported,
  onReport,
}: {
  feed: CCTVFeed;
  index: number;
  isReported: boolean;
  onReport: () => void;
}) {
  const statusIcon =
    feed.status === "online" ? CheckCircle2 : feed.status === "degraded" ? TriangleIcon : AlertCircle;
  const statusColor =
    feed.status === "online" ? "#22c55e" : feed.status === "degraded" ? "#f59e0b" : "#ef4444";

  // Deterministic "image" generated via SVG noise pattern
  const seed = feed.imageSeed;
  const hue1 = (seed * 37) % 360;
  const hue2 = (seed * 73 + 120) % 360;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-lg border border-border/30 bg-secondary/20 overflow-hidden group"
    >
      {/* Camera view placeholder */}
      <Dialog>
        <div className="relative h-32 bg-[#0a1020] overflow-hidden">
          {/* Generated "camera" view */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="none">
            <defs>
              <radialGradient id={`cg-${seed}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={`hsl(${hue1}, 30%, 18%)`} />
                <stop offset="100%" stopColor={`hsl(${hue2}, 20%, 8%)`} />
              </radialGradient>
              <filter id={`noise-${seed}`}>
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed={seed} />
                <feColorMatrix type="saturate" values="0" />
                <feBlend in="SourceGraphic" mode="overlay" />
              </filter>
            </defs>
            <rect width="320" height="128" fill={`url(#cg-${seed})`} />
            {/* Road lines */}
            <line
              x1="0" y1={80 + (seed % 20)} x2="320" y2={75 + (seed % 15)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="40"
            />
            <line
              x1="0" y1={80 + (seed % 20)} x2="320" y2={75 + (seed % 15)}
              stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="20,15"
            />
            {/* Horizon */}
            <line x1="0" y1={50 + (seed % 10)} x2="320" y2={48 + (seed % 8)} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </svg>

          {/* Scanline effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
            }}
          />

          {/* Status indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {(() => {
              const StatusIcon = statusIcon;
              return <StatusIcon className="h-3 w-3" style={{ color: statusColor }} />;
            })()}
            <span className="text-[10px] font-medium capitalize" style={{ color: statusColor }}>
              {feed.status}
            </span>
          </div>

          {/* Timestamp */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/40 backdrop-blur-sm rounded px-1.5 py-0.5">
            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground font-mono">
              {feed.lastUpdated}
            </span>
          </div>

          {/* Expand button */}
          <DialogTrigger asChild>
            <button
              type="button"
              className="absolute bottom-2 right-2 h-7 w-7 flex items-center justify-center rounded-md bg-background/30 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label={`Expand ${feed.label} camera view`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </DialogTrigger>

          {/* Camera label overlay */}
          <div className="absolute bottom-2 left-2 bg-background/40 backdrop-blur-sm rounded px-2 py-0.5">
            <span className="text-[10px] font-medium text-foreground">{feed.location}</span>
          </div>

          {feed.status === "offline" && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
                <span className="text-xs text-destructive font-medium">Signal Lost</span>
              </div>
            </div>
          )}
        </div>

        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-strava" />
              {feed.label} - {feed.location}
            </DialogTitle>
          </DialogHeader>
          <div className="relative h-80 bg-[#0a1020] rounded-lg overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 640 320" preserveAspectRatio="none">
              <defs>
                <radialGradient id={`cg-lg-${seed}`} cx="50%" cy="50%">
                  <stop offset="0%" stopColor={`hsl(${hue1}, 30%, 18%)`} />
                  <stop offset="100%" stopColor={`hsl(${hue2}, 20%, 8%)`} />
                </radialGradient>
              </defs>
              <rect width="640" height="320" fill={`url(#cg-lg-${seed})`} />
              <line
                x1="0" y1={180 + (seed % 20)} x2="640" y2={170 + (seed % 15)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="80"
              />
              <line
                x1="0" y1={180 + (seed % 20)} x2="640" y2={170 + (seed % 15)}
                stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeDasharray="30,20"
              />
            </svg>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              {(() => {
                const StatusIcon = statusIcon;
                return <StatusIcon className="h-3.5 w-3.5" style={{ color: statusColor }} />;
              })()}
              <span className="text-xs font-mono text-muted-foreground">
                Last updated: {feed.lastUpdated}
              </span>
            </div>
          </div>
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="w-fit ml-auto">
              <X className="h-3.5 w-3.5 mr-1.5" />
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Feed info */}
      <div className="p-2.5 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{feed.label}</p>
          <p className="text-[10px] text-muted-foreground">{feed.location}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-[10px] px-2 shrink-0 ${isReported ? "text-warning" : "text-muted-foreground hover:text-foreground"}`}
          onClick={onReport}
          disabled={isReported}
        >
          <Flag className="h-3 w-3 mr-1" />
          {isReported ? "Reported" : "Report"}
        </Button>
      </div>
    </motion.div>
  );
}