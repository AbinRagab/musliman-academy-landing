import { describe, expect, it } from 'vitest';
import { adminAreaAccess, canAccessAdminArea, canAccessAdminPath } from './accessControl';

describe('dashboard admin access control', () => {
  it('gives super admins access to every admin area', () => {
    for (const area of Object.keys(adminAreaAccess) as Array<keyof typeof adminAreaAccess>) {
      expect(canAccessAdminArea('super_admin', area)).toBe(true);
    }
  });

  it('limits admissions to CRM and trial-class workflows', () => {
    expect(canAccessAdminPath('admissions', '/dashboard/admin/leads')).toBe(true);
    expect(canAccessAdminPath('admissions', '/dashboard/admin/free-trials')).toBe(true);
    expect(canAccessAdminPath('admissions', '/dashboard/admin/students')).toBe(false);
    expect(canAccessAdminPath('admissions', '/dashboard/admin/payments')).toBe(false);
  });

  it('limits finance to payments and reports', () => {
    expect(canAccessAdminPath('finance', '/dashboard/admin/payments')).toBe(true);
    expect(canAccessAdminPath('finance', '/dashboard/admin/reports')).toBe(true);
    expect(canAccessAdminPath('finance', '/dashboard/admin/leads')).toBe(false);
  });

  it('limits academic managers to academic operations and reports', () => {
    expect(canAccessAdminPath('academic_manager', '/dashboard/admin/students')).toBe(true);
    expect(canAccessAdminPath('academic_manager', '/dashboard/admin/teachers')).toBe(true);
    expect(canAccessAdminPath('academic_manager', '/dashboard/admin/classes')).toBe(true);
    expect(canAccessAdminPath('academic_manager', '/dashboard/admin/reports')).toBe(true);
    expect(canAccessAdminPath('academic_manager', '/dashboard/admin/leads')).toBe(false);
    expect(canAccessAdminPath('academic_manager', '/dashboard/admin/payments')).toBe(false);
    expect(canAccessAdminPath('academic_manager', '/dashboard/admin/accounts')).toBe(false);
  });

  it('limits viewers to reports', () => {
    expect(canAccessAdminPath('viewer', '/dashboard/admin/reports')).toBe(true);
    expect(canAccessAdminPath('viewer', '/dashboard/admin')).toBe(false);
    expect(canAccessAdminPath('viewer', '/dashboard/admin/settings')).toBe(false);
  });

  it('keeps student and teacher roles outside admin routes', () => {
    expect(canAccessAdminPath('student', '/dashboard/admin/reports')).toBe(false);
    expect(canAccessAdminPath('teacher', '/dashboard/admin/students')).toBe(false);
  });
});
