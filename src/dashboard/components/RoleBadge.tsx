import type { DashboardRole } from '../types';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

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
  const { t } = useDashboardLanguage();
  const roleKey = String(role).toLowerCase().replace(/[\s_]+/g, '-');

  return <span className={`dashboard-role dashboard-role--${roleKey}`}>{t(roleLabels[role] || role)}</span>;
}
