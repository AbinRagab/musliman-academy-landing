import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import type { DashboardRole } from '../data/mockData';
import '../styles/dashboard.css';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

type DashboardLayoutProps = {
  role: DashboardRole;
  children?: ReactNode;
};

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <Topbar role={role} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="dashboard-content">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
