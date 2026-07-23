import type { DashboardRole } from '../data/mockData';

const roleLabels: Record<DashboardRole | string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  'Super Admin': 'Super Admin',
  Admin: 'Admin',
  Teacher: 'Teacher',
  Student: 'Student',
};

export default function RoleBadge({ role }: { role: DashboardRole | string }) {
  return <span className={`dashboard-role dashboard-role--${String(role).toLowerCase().replace(/\s+/g, '-')}`}>{roleLabels[role] || role}</span>;
}
