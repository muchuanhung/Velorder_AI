import { Sidebar } from "@/components/dashboard/sidebar";
import { ProfileContent } from "@/components/profile/profile-content";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="p-4 pt-16 lg:pt-8 lg:p-8">
          <ProfileContent />
        </div>
      </main>
    </div>
  );
}