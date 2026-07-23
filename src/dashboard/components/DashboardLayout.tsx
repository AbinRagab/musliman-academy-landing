import { useState, type ReactNode } from 'react';
import type { DashboardRole } from '../data/mockData';
import '../styles/dashboard.css';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

type DashboardLayoutProps = {
  role: DashboardRole;
  children: ReactNode;
};

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <Topbar role={role} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
