"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  BarChart3,
  User,
  Menu,
  X,
  ChevronDown,
  Flame,
  Lock,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductLogo } from "@/components/ui/product-logo";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ProUpgradeModal } from "@/components/ui/pro-ugrade-modal";

// --- Types ---

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  premium?: boolean;
}

interface NavGroup {
  icon: LucideIcon;
  label: string;
  basePath: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

// --- Navigation data ---

const navigation: NavEntry[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Map, label: "地圖", href: "/maps" },
  {
    icon: Map,
    label: "路線",
    basePath: "/routes",
    children: [
      { icon: Flame, label: "熱門路線", href: "/routes" },
      { icon: Lock, label: "私人路線", href: "/routes/private", premium: true },
    ],
  },
  { icon: User, label: "個人資料", href: "/profile" },
];

// --- Premium badge subcomponent ---

function PremiumCrown() {
  return (
    <Crown
      className="h-3.5 w-3.5 shrink-0 fill-amber-400/30 text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]"
      aria-label="Premium feature"
    />
  );
}

// --- Single nav link ---

function NavLink({
  item,
  collapsed,
  isActive,
  onPremiumClick,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  onPremiumClick?: () => void;
}) {
  const isPremium = item.premium;

  const inner = isPremium ? (
    <button
      type="button"
      onClick={onPremiumClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left",
        isActive
          ? "bg-strava/15 text-strava"
          : "text-muted-foreground/70 hover:shadow-[inset_0_0_0_1px_rgba(245,158,11,0.15)] hover:bg-amber-400/5 hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-strava" : "text-muted-foreground/50"
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          <PremiumCrown />
        </>
      )}
    </button>
  ) : (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-strava/15 text-strava"
          : isPremium
            ? "text-muted-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isPremium &&
          !isActive &&
          "hover:shadow-[inset_0_0_0_1px_rgba(245,158,11,0.15)] hover:bg-amber-400/5"
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-strava" : isPremium ? "text-muted-foreground/50" : ""
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {isPremium && <PremiumCrown />}
        </>
      )}
    </Link>
  );

  if (isPremium && !collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="border border-amber-400/20 bg-amber-400/10 text-amber-300 backdrop-blur-md"
        >
          升級到 Pro
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}

// --- Collapsible nav group ---

function NavGroupSection({
  group,
  collapsed,
  pathname,
  onPremiumClick,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  onPremiumClick?: () => void;
}) {
  const isGroupActive =
    group.basePath === "/"
      ? pathname === "/"
      : pathname.startsWith(group.basePath);

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(isGroupActive);
  }, [isGroupActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isGroupActive
            ? "text-strava"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <group.icon
          className={cn(
            "h-5 w-5 shrink-0",
            isGroupActive ? "text-strava" : ""
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{group.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </>
        )}
      </CollapsibleTrigger>

      {!collapsed && (
        <CollapsibleContent className="overflow-hidden">
          <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
            {group.children.map((child) => {
              const childActive =
                child.href === group.basePath
                  ? pathname === child.href
                  : pathname.startsWith(child.href);
              return (
                <NavLink
                  key={child.href}
                  item={child}
                  collapsed={false}
                  isActive={childActive}
                  onPremiumClick={onPremiumClick}
                />
              );
            })}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

// --- Main sidebar ---

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);

  return (
    <TooltipProvider>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileOpen(false);
          }}
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-sidebar-border p-4">
          <ProductLogo size={40} className="rounded-lg" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">
                StravaSync
              </span>
              <span className="text-xs text-muted-foreground">
                Fitness Tracker
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((entry) => {
            if (isGroup(entry)) {
              return (
                <NavGroupSection
                  key={entry.label}
                  group={entry}
                  collapsed={collapsed}
                  pathname={pathname}
                  onPremiumClick={() => setProModalOpen(true)}
                />
              );
            }

            const isActive =
              entry.href === "/"
                ? pathname === "/"
                : pathname.startsWith(entry.href);

            return (
              <NavLink
                key={entry.href}
                item={entry}
                collapsed={collapsed}
                isActive={isActive}
                onPremiumClick={() => setProModalOpen(true)}
              />
            );
          })}
        </nav>

        {/* Pro upgrade card */}
        {!collapsed && (
          <div className="mx-3 mb-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Crown className="h-4 w-4 fill-amber-400/30 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">
                升級到 Pro
              </span>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              解鎖收藏熱門路線、私人路線和天氣預報進階分析。
            </p>
            <Button
              size="sm"
              className="h-7 w-full bg-amber-500 text-xs font-semibold text-background hover:bg-amber-400"
              onClick={() => setProModalOpen(true)}
            >
              升級到 Pro
            </Button>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="hidden border-t border-sidebar-border p-3 lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu className="h-4 w-4" />
            {!collapsed && <span className="ml-2">收合</span>}
          </Button>
        </div>
      </aside>

      {/* Pro upgrade modal */}
      <ProUpgradeModal
        open={proModalOpen}
        onOpenChange={setProModalOpen}
      />
    </TooltipProvider>
  );
}
