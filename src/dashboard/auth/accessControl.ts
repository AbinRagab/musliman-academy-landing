import type { AuthRole } from './AuthProvider';

export type AdminArea =
  | 'dashboard'
  | 'accounts'
  | 'leads'
  | 'students'
  | 'studentPayments'
  | 'teachers'
  | 'freeTrials'
  | 'classes'
  | 'attendance'
  | 'compliance'
  | 'payments'
  | 'reports'
  | 'settings';

export const adminAreaAccess: Record<AdminArea, readonly AuthRole[]> = {
  dashboard: ['super_admin', 'admin', 'academic_manager'],
  accounts: ['super_admin', 'admin'],
  leads: ['super_admin', 'admin', 'admissions'],
  students: ['super_admin', 'admin', 'academic_manager'],
  studentPayments: ['super_admin', 'admin', 'finance'],
  teachers: ['super_admin', 'admin', 'academic_manager'],
  freeTrials: ['super_admin', 'admin', 'admissions'],
  classes: ['super_admin', 'admin', 'academic_manager'],
  attendance: ['super_admin', 'admin', 'academic_manager'],
  compliance: ['super_admin', 'admin', 'academic_manager'],
  payments: ['super_admin', 'admin', 'finance'],
  reports: ['super_admin', 'admin', 'academic_manager', 'finance', 'viewer'],
  settings: ['super_admin', 'admin'],
};

export const adminPathArea: Record<string, AdminArea> = {
  '/dashboard/admin': 'dashboard',
  '/dashboard/admin/accounts': 'accounts',
  '/dashboard/admin/leads': 'leads',
  '/dashboard/admin/students': 'students',
  '/dashboard/admin/teachers': 'teachers',
  '/dashboard/admin/free-trials': 'freeTrials',
  '/dashboard/admin/classes': 'classes',
  '/dashboard/admin/attendance': 'attendance',
  '/dashboard/admin/compliance': 'compliance',
  '/dashboard/admin/payments': 'payments',
  '/dashboard/admin/reports': 'reports',
  '/dashboard/admin/settings': 'settings',
};

export function canAccessAdminArea(role: AuthRole | null | undefined, area: AdminArea) {
  return Boolean(role && adminAreaAccess[area].includes(role));
}

export function canAccessAdminPath(role: AuthRole | null | undefined, path: string) {
  const area = adminPathArea[path];
  return area ? canAccessAdminArea(role, area) : false;
}
