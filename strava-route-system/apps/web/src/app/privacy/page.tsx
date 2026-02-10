"use client";

import { PrivacyHeader } from "@/components/privacy/privacy-header";
import { PolicyNav } from "@/components/privacy/policy-nav";
import { PolicyContent } from "@/components/privacy/policy-content";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PrivacyHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
          <aside className="hidden lg:block">
            <PolicyNav />
          </aside>
          <main className="min-w-0">
            <PolicyContent />
          </main>
        </div>
      </div>
    </div>
  );
}
