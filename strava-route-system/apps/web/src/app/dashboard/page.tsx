import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityMap } from "@/components/dashboard/activity-map";
import { ActivitiesTable } from "@/components/dashboard/activities-table";
import { SyncBanner } from "@/components/dashboard/sync-banner";
import { SyncProvider } from "@/contexts/SyncContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { WeatherWidget } from "@/components/dashboard/weather/weather-widget";

export default async function Dashboard() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return (
    <SyncProvider>
      <LocationProvider>
        <div className="min-h-screen bg-background">
        <Sidebar />

        {/* Main content */}
        <main className="lg:pl-64 transition-all duration-300">
          <div className="p-4 pt-16 lg:pt-4 lg:p-8 space-y-6">
            {/* Header */}
            <Header />

            {/* Sync Status Banner：顯示與 Header Sync 按鈕一致的同步狀態 */}
            <SyncBanner />

            {/* Stats Cards */}
            <StatsCards />

            {/* Map and Table Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <WeatherWidget />
              <div className="xl:col-span-2">
                <ActivitiesTable />
              </div>
            </div>
          </div>
        </main>
        </div>
      </LocationProvider>
    </SyncProvider>
  );
}
