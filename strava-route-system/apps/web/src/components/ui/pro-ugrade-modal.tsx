"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Check,
  MapPin,
  CloudRain,
  Camera,
  Bell,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";

// --- Feature list ---

const features = [
  {
    icon: MapPin,
    title: "無限私人 GPX 上傳",
    description: "安全儲存你的私密訓練路線。",
  },
  {
    icon: CloudRain,
    title: "即時天氣情報",
    description: "跨區降雨警報與風速分析。",
  },
  {
    icon: Camera,
    title: "即時路況（TDX & CCTV）",
    description: "出發前掌握路況。",
  },
  {
    icon: Bell,
    title: "智慧提醒",
    description:
      "收藏路線天氣轉好時第一時間通知你。",
  },
];

// --- Pricing ---

interface Plan {
  id: "monthly" | "yearly";
  label: string;
  price: string;
  period: string;
  savings?: string;
}

const plans: Plan[] = [
  { id: "monthly", label: "月繳", price: "NT$30", period: "/月" },
  {
    id: "yearly",
    label: "年繳",
    price: "NT$300",
    period: "/年",
    savings: "省 10%",
  },
];

// --- Component ---

export function ProUpgradeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly"
  );
  const [subscribing, setSubscribing] = useState(false);

  function handleSubscribe() {
    setSubscribing(true);
    // simulate Stripe redirect
    setTimeout(() => setSubscribing(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] sm:max-w-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200 outline-none"
          )}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/40"
              >
                {/* Close button */}
                <DialogPrimitive.Close className="absolute top-4 right-4 z-20 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">關閉</span>
                </DialogPrimitive.Close>

                {/* Ambient glow */}
                <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-amber-400/8 blur-3xl" />
                <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-[#FC4C02]/10 blur-2xl" />

                {/* Header */}
                <div className="relative px-6 pt-8 pb-5 text-center">
                  {/* Crown */}
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 ring-1 ring-amber-400/25">
                    <motion.div
                      animate={{
                        filter: [
                          "drop-shadow(0 0 6px rgba(255,215,0,0.3))",
                          "drop-shadow(0 0 14px rgba(255,215,0,0.5))",
                          "drop-shadow(0 0 6px rgba(255,215,0,0.3))",
                        ],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      <Crown className="h-8 w-8 fill-amber-400/40 text-amber-400" />
                    </motion.div>
                  </div>

                  <DialogTitle className="text-xl font-bold text-foreground">
                    解鎖完整功能
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    進階路線分析、即時路況提醒、私人 GPX 儲存。
                  </DialogDescription>
                </div>

                <Separator className="bg-border/50" />

                {/* Features */}
                <div className="space-y-0.5 px-6 py-4">
                  {features.map((f) => (
                    <div key={f.title} className="flex items-start gap-3 py-2">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FC4C02]/15">
                        <Check className="h-3 w-3 text-[#FC4C02]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {f.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="bg-border/50" />

                {/* Pricing toggle */}
                <div className="px-6 py-4">
                  <div className="flex gap-2 rounded-lg bg-secondary/40 p-1">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={cn(
                          "relative flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-all",
                          selectedPlan === plan.id
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{plan.label}</span>
                        {plan.savings && (
                          <Badge className="ml-1.5 border-0 bg-amber-400/15 px-1.5 py-0 text-[10px] font-semibold text-amber-400">
                            {plan.savings}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Price display */}
                  <div className="mt-4 text-center">
                    <span className="text-3xl font-bold text-foreground">
                      {plans.find((p) => p.id === selectedPlan)?.price}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      {plans.find((p) => p.id === selectedPlan)?.period}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6 space-y-3">
                  {/* Subscribe button with shimmer */}
                  <Button
                    className="group relative h-12 w-full overflow-hidden bg-[#FC4C02] text-sm font-bold text-white hover:bg-[#e04400]"
                    onClick={handleSubscribe}
                    disabled={subscribing}
                  >
                    {/* Shimmer sweep */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    {subscribing ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                          className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        處理中...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        立即訂閱
                      </span>
                    )}
                  </Button>

                  {/* 試用體驗 */}
                  <button
                    type="button"
                    className="w-full text-center text-sm font-medium text-[#FC4C02] transition-colors hover:text-[#e04400]"
                  >
                    試用體驗 7 天
                  </button>

                  {/* Footer trust signals */}
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      透過 Stripe 安全付款
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      隨時取消
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}