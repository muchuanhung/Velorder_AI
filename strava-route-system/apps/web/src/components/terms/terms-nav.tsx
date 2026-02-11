"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileCheck,
  ShieldCheck,
  Link2,
  CreditCard,
  Ban,
  HeartPulse,
  Scale,
  AlertTriangle,
  Pencil,
  UserX,
  Gavel,
  Mail,
} from "lucide-react";

const sections = [
  { id: "tos-acceptance", label: "接受服務條款", icon: FileCheck },
  { id: "tos-account", label: "帳號與存取", icon: ShieldCheck },
  { id: "tos-strava-api", label: "Strava API 使用", icon: Link2 },
  { id: "tos-subscriptions", label: "訂閱", icon: CreditCard },
  { id: "tos-prohibited", label: "禁止行為", icon: Ban },
  { id: "tos-health", label: "健康聲明", icon: HeartPulse },
  { id: "tos-ip", label: "智慧財產權", icon: Scale },
  { id: "tos-warranty", label: "保證聲明", icon: AlertTriangle },
  { id: "tos-limitation", label: "責任限制", icon: Gavel },
  { id: "tos-changes", label: "修改", icon: Pencil },
  { id: "tos-termination", label: "終止", icon: UserX },
  { id: "tos-contact", label: "聯絡我們", icon: Mail },
];

export { sections as termsSections };

export function TermsNav() {
  const [activeSection, setActiveSection] = useState("tos-acceptance");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0.1,
      },
    );

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, []);

  function handleClick(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const offset = 96;
      const top =
        element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <div className="sticky top-24">
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <nav
          className="flex flex-col gap-0.5"
          aria-label="Terms of Service sections"
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleClick(section.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-secondary text-strava"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <section.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-strava" : "text-muted-foreground",
                  )}
                />
                <span className="truncate">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}