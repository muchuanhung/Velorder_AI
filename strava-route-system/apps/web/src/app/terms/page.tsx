import type { Metadata } from "next";
import { TermsNav } from "@/components/terms/terms-nav";
import { TermsContent } from "@/components/terms/terms-content";
import { TermsHeader } from "@/components/terms/terms-header";

export const metadata: Metadata = {
  title: "服務條款",
  description:
    "曉行 Dawnline 服務條款：帳號使用、服務費用與使用者責任。",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <TermsHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <div className="flex gap-10">
          {/* Sticky sidebar navigation -- hidden on mobile */}
          <aside className="hidden lg:block w-56 shrink-0">
            <TermsNav />
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 pb-16">
            <TermsContent />
          </main>
        </div>
      </div>
    </div>
  );
}