import { DashboardContent } from '@/components/dashboard-content';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}
