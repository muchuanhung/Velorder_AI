"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import {
  Database,
  Target,
  Link2,
  Cookie,
  Shield,
  Scale,
  CreditCard,
  UserCheck,
  Mail,
  FileText,
} from "lucide-react";

const sections = [
  { id: "introduction", label: "導覽", icon: FileText },
  { id: "data-collection", label: "我們蒐集的資料", icon: Database },
  { id: "purpose-of-use", label: "使用目的", icon: Target },
  { id: "strava-api", label: "Strava API 合規", icon: Link2 },
  { id: "data-storage", label: "資料儲存與安全", icon: Shield },
  { id: "cookies", label: "Cookie 與追蹤", icon: Cookie },
  { id: "user-rights", label: "您的權利", icon: UserCheck },
  { id: "monetization", label: "營利說明", icon: CreditCard },
  { id: "third-parties", label: "第三方服務", icon: Scale },
  { id: "contact", label: "聯絡我們", icon: Mail },
];

export function PolicyNav() {
  const [activeSection, setActiveSection] = useState("introduction");

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
      }
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
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <div className="sticky top-24">
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <nav className="flex flex-col gap-0.5" aria-label="Privacy Policy sections">
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
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <section.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-strava" : "text-muted-foreground"
                  )}
                />
                {section.label}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}