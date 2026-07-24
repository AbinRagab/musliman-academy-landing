import type { DashboardRole } from '../data/mockData';

const roleLabels: Record<DashboardRole | string, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  admissions: 'Admissions',
  academic_manager: 'Academic Manager',
  teacher: 'Teacher',
  student: 'Student',
  finance: 'Finance',
  viewer: 'Viewer',
  'Super Admin': 'Super Admin',
  Admin: 'Admin',
  Teacher: 'Teacher',
  Student: 'Student',
};

export default function RoleBadge({ role }: { role: DashboardRole | string }) {
  const roleKey = String(role).toLowerCase().replace(/[\s_]+/g, '-');

  return <span className={`dashboard-role dashboard-role--${roleKey}`}>{roleLabels[role] || role}</span>;
}
