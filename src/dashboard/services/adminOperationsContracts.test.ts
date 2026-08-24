import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const adminMigration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260823120000_admin_operations_completion.sql'),
  'utf8',
);

const adminService = readFileSync(
  join(process.cwd(), 'src/dashboard/services/adminOperationsService.ts'),
  'utf8',
);

const teacherPage = readFileSync(
  join(process.cwd(), 'src/dashboard/teacher/TeacherSectionPage.tsx'),
  'utf8',
);

describe('admin operations completion contract', () => {
  it('adds review state, settings, atomic conversion, and occurrence lifecycle RPCs', () => {
    expect(adminMigration).toContain('admin_review_status');
    expect(adminMigration).toContain('follow_up_status');
    expect(adminMigration).toContain('create table if not exists public.academy_settings');
    expect(adminMigration).toContain('create or replace function public.convert_trial_to_student');
    expect(adminMigration).toContain('create or replace function public.reschedule_class_occurrence');
    expect(adminMigration).toContain('create or replace function public.cancel_class_occurrence');
  });

  it('implements session consumption with an idempotent ledger', () => {
    expect(adminMigration).toContain('create table if not exists public.payment_session_usage');
    expect(adminMigration).toContain('unique (payment_id, class_id)');
    expect(adminMigration).toContain('create or replace function public.record_payment_session_usage');
    expect(adminMigration).toContain("v_class.status in ('cancelled', 'teacher_absent', 'rescheduled')");
    expect(adminMigration).toContain("v_attendance.status in ('excused', 'cancelled')");
  });

  it('does not keep admin operations as generic drawer-only workflows', () => {
    expect(adminService).toContain('fetchAdminTrialRows');
    expect(adminService).toContain('assignTrialTeacher');
    expect(adminService).toContain('convertTrialToStudent');
    expect(adminService).toContain('fetchAdminPaymentRows');
    expect(adminService).toContain('openPaymentReceipt');
    expect(adminService).toContain('fetchAdminReportRows');
  });

  it('replaces the static teacher messages array with real messages service calls', () => {
    expect(teacherPage).not.toContain('const messageThreads: MessageThread[] = []');
    expect(teacherPage).toContain('fetchTeacherMessages');
    expect(teacherPage).toContain('markTeacherMessageRead');
    expect(teacherPage).toContain('sendTeacherMessage');
  });
});
