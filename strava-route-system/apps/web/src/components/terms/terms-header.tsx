"use client";

import Link from "next/link";
import { Activity, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { termsSections } from "./terms-nav";

function handleMobileNav(id: string) {
  const element = document.getElementById(id);
  if (element) {
    const offset = 96;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export function TermsHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/login" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-strava">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:block font-semibold text-foreground text-sm">
              StravaSync
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden gap-1.5 text-xs bg-transparent"
              >
                導覽
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <ScrollArea className="h-72">
                {termsSections.map((section) => (
                  <DropdownMenuItem
                    key={section.id}
                    onClick={() => handleMobileNav(section.id)}
                    className="gap-2 text-sm cursor-pointer"
                  >
                    <section.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {section.label}
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}