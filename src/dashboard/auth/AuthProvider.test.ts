import { describe, expect, it } from 'vitest';
import { accountsRoles, adminAreaRoles, getDashboardPath, studentRoles, teacherRoles } from './AuthProvider';

describe('dashboard role routing', () => {
  it('maps roles to their dashboard entry points', () => {
    expect(getDashboardPath('teacher')).toBe('/dashboard/teacher');
    expect(getDashboardPath('student')).toBe('/dashboard/student');
    expect(getDashboardPath('finance')).toBe('/dashboard/admin/payments');
    expect(getDashboardPath('admin')).toBe('/dashboard/admin');
    expect(getDashboardPath(null)).toBe('/dashboard/login');
  });

  it('keeps role groups aligned with portal protection', () => {
    expect(adminAreaRoles).toEqual(expect.arrayContaining(['super_admin', 'admin', 'admissions', 'academic_manager']));
    expect(accountsRoles).toEqual(['super_admin', 'admin']);
    expect(teacherRoles).toEqual(['teacher']);
    expect(studentRoles).toEqual(['student']);
  });
});
