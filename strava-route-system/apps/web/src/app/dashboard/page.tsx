import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityMap } from "@/components/dashboard/activity-map";
import { ActivitiesTable } from "@/components/dashboard/activities-table";
import { SyncBanner } from "@/components/dashboard/sync-banner";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content */}
      <main className="lg:pl-64 transition-all duration-300">
        <div className="p-4 pt-16 lg:pt-4 lg:p-8 space-y-6">
          {/* Header */}
          <Header />

          {/* Sync Status Banner */}
          <SyncBanner syncing={true} progress={68} />

          {/* Stats Cards */}
          <StatsCards />

          {/* Map and Table Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ActivityMap />
            <ActivitiesTable />
          </div>
        </div>
      </main>
    </div>
  );
}
