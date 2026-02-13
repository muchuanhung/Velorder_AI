"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Bike,
  Footprints,
  MapPin,
  X,
} from "lucide-react";
import { ProductLogo } from "@/components/ui/product-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { routes } from "@/lib/routes/route-data";
import { RouteCard } from "@/components/routes/route-card";
import { RouteHeader } from "@/components/routes/route-header";
import { WeatherVerdict } from "@/components/routes/weather-verdict";
import { CCTVGallery } from "@/components/routes/cctv-gallery";

type FilterType = "all" | "cycling" | "running";

export default function RoutesPage() {
  const [selectedId, setSelectedId] = useState(routes[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const selectedRoute = routes.find((r) => r.id === selectedId) || routes[0];

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.nameZh.includes(search);
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  function handleSelectRoute(id: string) {
    setSelectedId(id);
    setMobileListOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6 bg-border/40" />
            <div className="flex items-center gap-2">
              <ProductLogo size={32} className="rounded-lg" />
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-foreground">路線分析</h1>
                <p className="text-[10px] text-muted-foreground">即時天氣 & 路況分析</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 根據路線切換定位 */}
            <Badge variant="outline" className="border-strava/30 text-strava text-[10px] px-2 py-0.5">
              <MapPin className="h-3 w-3 mr-1" />
              Taipei
            </Badge>
            {/* Mobile route list trigger */}
            <Drawer open={mobileListOpen} onOpenChange={setMobileListOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  路線列表
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-card/95 backdrop-blur-xl border-border max-h-[85vh]">
                <DrawerHeader className="pb-2">
                  <DrawerTitle className="text-foreground">選擇一條路線</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-6 overflow-y-auto">
                  <div className="space-y-3">
                    {/* Mobile search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="搜尋路線..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary/40 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-strava/40"
                      />
                    </div>
                    {/* Mobile filter */}
                    <div className="flex items-center gap-2">
                      <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")} label="All" />
                      <FilterChip active={typeFilter === "cycling"} onClick={() => setTypeFilter("cycling")} label="Cycling" icon={Bike} />
                      <FilterChip active={typeFilter === "running"} onClick={() => setTypeFilter("running")} label="Running" icon={Footprints} />
                    </div>
                    {/* Mobile route list */}
                    <div className="space-y-2">
                      {filteredRoutes.map((route, i) => (
                        <RouteCard
                          key={route.id}
                          route={route}
                          isSelected={route.id === selectedId}
                          onSelect={handleSelectRoute}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </header>

      <div className="pt-14 flex h-[calc(100vh-3.5rem)]">
        {/* Desktop sidebar - route list */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-[340px] shrink-0 border-r border-border/30 bg-card/30">
          {/* Sidebar header with search */}
          <div className="p-4 border-b border-border/20 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜尋路線..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-secondary/40 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-strava/40 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")} label="全部" />
              <FilterChip active={typeFilter === "cycling"} onClick={() => setTypeFilter("cycling")} label="騎自行車" icon={Bike} />
              <FilterChip active={typeFilter === "running"} onClick={() => setTypeFilter("running")} label="跑步" icon={Footprints} />
            </div>
          </div>

          {/* Route cards */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route, i) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      isSelected={route.id === selectedId}
                      onSelect={handleSelectRoute}
                      index={i}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No routes found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Try adjusting your search or filters
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-border/20">
            <p className="text-[10px] text-muted-foreground/50 text-center">
              {filteredRoutes.length} of {routes.length} routes
            </p>
          </div>
        </aside>

        {/* Main content - route detail */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedRoute && (
            <motion.div
              key={selectedRoute.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="p-4 lg:p-6 xl:p-8 max-w-4xl mx-auto space-y-5"
            >
              {/* Route header with GPX preview */}
              <RouteHeader route={selectedRoute} />

              {/* Weather verdict + breakdown */}
              <WeatherVerdict route={selectedRoute} />

              {/* CCTV Gallery */}
              <CCTVGallery feeds={selectedRoute.cctvFeeds} />

              {/* Bottom spacing */}
              <div className="h-4" />
            </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
        active
          ? "bg-strava/10 text-strava ring-1 ring-strava/25"
          : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}