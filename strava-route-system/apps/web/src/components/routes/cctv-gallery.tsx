"use client";

import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  AlertCircle,
  CheckCircle2,
  AlertTriangle as TriangleIcon,
  ExternalLink,
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

const MAX_CONCURRENT_IFRAMES = 6;

const BLOCKED_IFRAME_DOMAINS = ["atis.ntpc.gov.tw"];

const RATE_LIMITED_IFRAME_DOMAINS = ["hls.bote.gov.taipei"];

function isBlockedByCSP(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return BLOCKED_IFRAME_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function isRateLimited(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return RATE_LIMITED_IFRAME_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

type VisibilityContextValue = {
  registerVisibility: (id: string, visible: boolean) => void;
  canShowIframe: (id: string) => boolean;
};

const VisibilityContext = createContext<VisibilityContextValue | null>(null);

interface CCTVGalleryProps {
  feeds: CCTVFeed[];
  loading?: boolean;
}

export function CCTVGallery({ feeds, loading }: CCTVGalleryProps) {
  const [orderedVisibleIds, setOrderedVisibleIds] = useState<string[]>([]);

  const registerVisibility = useCallback((id: string, visible: boolean) => {
    setOrderedVisibleIds((prev) => {
      if (visible) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  }, []);

  const canShowIframe = useCallback(
    (id: string) => orderedVisibleIds.slice(0, MAX_CONCURRENT_IFRAMES).includes(id),
    [orderedVisibleIds]
  );

  useEffect(() => {
    setOrderedVisibleIds([]);
  }, [feeds]);

  if (feeds.length === 0 && !loading) return null;

  return (
    <VisibilityContext.Provider value={{ registerVisibility, canShowIframe }}>
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
              即時影像
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            TDX CCTV 監視器
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-success/30 text-success text-[10px] px-2 py-0.5"
        >
          {loading ? (
            <span className="text-muted-foreground">載入中…</span>
          ) : (
            <>
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success inline-block animate-pulse" />
              {feeds.filter((f) => f.status === "online").length}/{feeds.length} 連線
            </>
          )}
        </Badge>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading && feeds.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center py-12 text-muted-foreground text-sm">
            載入路線附近監視器…
          </div>
        ) : (
          feeds.map((feed, i) => (
            <CCTVCard key={feed.id} feed={feed} index={i} />
          ))
        )}
      </div>
    </motion.div>
    </VisibilityContext.Provider>
  );
}

function CCTVCard({ feed, index }: { feed: CCTVFeed; index: number }) {
  const ctx = useContext(VisibilityContext);
  const cardRef = useRef<HTMLDivElement>(null);
  const statusIcon =
    feed.status === "online" ? CheckCircle2 : feed.status === "degraded" ? TriangleIcon : AlertCircle;
  const statusColor =
    feed.status === "online" ? "#22c55e" : feed.status === "degraded" ? "#f59e0b" : "#ef4444";

  const needsSlot = feed.videoUrl && isRateLimited(feed.videoUrl);
  const hasSlot = ctx ? ctx.canShowIframe(feed.id) : true;

  useEffect(() => {
    if (!ctx || !needsSlot || !cardRef.current) return;
    const el = cardRef.current;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry) ctx.registerVisibility(feed.id, entry.isIntersecting);
      },
      { rootMargin: "50px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ctx, feed.id, needsSlot]);

  const showCardIframe =
    feed.videoUrl &&
    !isBlockedByCSP(feed.videoUrl) &&
    (!needsSlot || hasSlot);

  // Deterministic "image" generated via SVG noise pattern
  const seed = feed.imageSeed;
  const hue1 = (seed * 37) % 360;
  const hue2 = (seed * 73 + 120) % 360;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-lg border border-border/30 bg-secondary/20 overflow-hidden group"
    >
      {/* Camera view placeholder */}
      <Dialog>
        <div className="relative h-32 bg-[#0a1020] overflow-hidden">
          {showCardIframe ? (
            <iframe
              src={feed.videoUrl}
              title={feed.label}
              className="absolute inset-0 w-full h-full border-0"
              allow="fullscreen"
            />
          ) : (
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
              <line
                x1="0" y1={80 + (seed % 20)} x2="320" y2={75 + (seed % 15)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="40"
              />
              <line
                x1="0" y1={80 + (seed % 20)} x2="320" y2={75 + (seed % 15)}
                stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="20,15"
              />
              <line x1="0" y1={50 + (seed % 10)} x2="320" y2={48 + (seed % 8)} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </svg>
          )}

          {(!feed.videoUrl || isBlockedByCSP(feed.videoUrl)) && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
              }}
            />
          )}

          {feed.videoUrl && isBlockedByCSP(feed.videoUrl) && (
            <a
              href={feed.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label={`在新分頁開啟 ${feed.label}`}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/90 text-xs font-medium text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
                {needsSlot && !hasSlot ? "點擊或滾動至上方載入" : "觀看即時影像"}
              </span>
            </a>
          )}

          {/* Status indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {(() => {
              const StatusIcon = statusIcon;
              return <StatusIcon className="h-3 w-3" style={{ color: statusColor }} />;
            })()}
            <span className="text-[10px] font-medium capitalize" style={{ color: statusColor }}>
              {feed.status === "online" ? "連線" : feed.status === "degraded" ? "離線" : "離線"}
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
                <span className="text-xs text-destructive font-medium">訊號中斷</span>
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
            {feed.videoUrl && !isBlockedByCSP(feed.videoUrl) ? (
              <iframe
                src={feed.videoUrl}
                title={feed.label}
                className="absolute inset-0 w-full h-full border-0"
                allow="fullscreen"
              />
            ) : (
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
            )}
            {feed.videoUrl && isBlockedByCSP(feed.videoUrl) && (
              <a
                href={feed.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50"
              >
                <p className="text-sm text-foreground/90">此影像因安全政策無法嵌入</p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-strava text-white text-sm font-medium hover:bg-strava/90 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                  在新分頁開啟即時影像
                </span>
              </a>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              {(() => {
                const StatusIcon = statusIcon;
                return <StatusIcon className="h-3.5 w-3.5" style={{ color: statusColor }} />;
              })()}
            </div>
          </div>
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="w-fit ml-auto">
              <X className="h-3.5 w-3.5 mr-1.5" />
              關閉
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}