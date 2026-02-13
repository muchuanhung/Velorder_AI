import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityMap } from "@/components/dashboard/activity-map";
import { ActivitiesTable } from "@/components/dashboard/activities-table";
import { SyncBanner } from "@/components/dashboard/sync-banner";
import { SyncProvider } from "@/contexts/SyncContext";
import { WeatherWidget } from "@/components/dashboard/weather/weather-widget";

export default async function Dashboard() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return (
    <SyncProvider>
        <div className="min-h-screen bg-background">
        <Sidebar />

        {/* Main content */}
        <main className="lg:pl-64 transition-all duration-300">
          <div className="p-4 pt-16 lg:pt-4 lg:p-8 space-y-6">
            {/* Header */}
            <Header />
            <SyncBanner />
            <div className="flex flex-col xl:grid xl:grid-cols-3 xl:grid-rows-[auto_auto] gap-6">
              <div className="order-1 xl:row-start-2 xl:col-start-1 xl:col-span-1">
                <WeatherWidget navigateTo="/maps" />
              </div>
              <div className="order-2 xl:row-start-1 xl:col-span-3">
                <StatsCards />
              </div>
              <div className="order-3 xl:row-start-2 xl:col-start-2 xl:col-span-2">
                <ActivitiesTable />
              </div>
            </div>
          </div>
        </main>
        </div>
    </SyncProvider>
  );
}
