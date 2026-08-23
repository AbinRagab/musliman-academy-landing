import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAcademyTodayDate } from './dateUtils';
import { mapEvaluation, ratingToPercent } from './evaluationsService';
import { mapStudentPayment } from './studentPaymentsService';

describe('dashboard data contracts', () => {
  it('maps evaluations using the canonical database fields', () => {
    const evaluation = mapEvaluation({
      id: 'evaluation-1',
      student_id: 'student-1',
      teacher_id: 'teacher-1',
      class_id: 'class-1',
      recitation_rating: 4,
      tajweed_rating: 3,
      understanding_rating: null,
      behavior_rating: 5,
      progress_feedback: 'Improving fluency',
      teacher_notes: 'Revise last lesson',
      created_at: '2026-08-18T10:00:00.000Z',
    });

    expect(evaluation).toMatchObject({
      id: 'evaluation-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      classId: 'class-1',
      recitationRating: 4,
      tajweedRating: 3,
      understandingRating: null,
      behaviorRating: 5,
      progressFeedback: 'Improving fluency',
      teacherNotes: 'Revise last lesson',
    });
    expect(ratingToPercent(evaluation.recitationRating)).toBe(80);
  });

  it('maps payments from the canonical payments schema without package fallbacks', () => {
    const payment = mapStudentPayment({
      id: 'payment-1',
      program_id: 'program-1',
      currency: 'USD',
      amount: 120,
      payment_method: 'card',
      payment_date: '2026-08-01',
      next_due_date: '2026-09-01',
      status: 'pending',
      sessions_included: 8,
      sessions_remaining: 6,
      receipt_url: null,
      receipt_file_path: null,
      notes: null,
      created_at: '2026-08-01T00:00:00.000Z',
    }, new Map([['program-1', 'Quran Reading']]));

    expect(payment.packageName).toBe('Quran Reading');
    expect(payment.sessions).toBe(8);
    expect(payment.remainingSessions).toBe(6);
    expect(payment.dueAmount).toBe('$120.00');
    expect(payment.method).toBe('card');
  });

  it('uses the academy timezone for business dates', () => {
    expect(getAcademyTodayDate('Africa/Cairo', new Date('2026-08-17T22:30:00.000Z'))).toBe('2026-08-18');
  });

  it('keeps the production reconciliation migration scoped to dashboard prerequisites', () => {
    const reconciliationPath = join(process.cwd(), 'supabase/migrations/20260823095000_reconcile_dashboard_prerequisites.sql');
    const phaseOnePath = join(process.cwd(), 'supabase/migrations/20260823100000_dashboard_data_contract_cleanup.sql');
    const migration = readFileSync(
      reconciliationPath,
      'utf8',
    );

    expect(existsSync(phaseOnePath)).toBe(true);
    expect('20260823095000_reconcile_dashboard_prerequisites.sql' < '20260823100000_dashboard_data_contract_cleanup.sql').toBe(true);
    expect(migration).toContain('create or replace function public.current_teacher_id()');
    expect(migration).toContain('teacher_profile_id uuid references public.profiles(id)');
    expect(migration).toContain('teacher_id = public.current_teacher_id()');
    expect(migration).toContain('raise exception');
    expect(migration).not.toMatch(/\butm_source\b|\butm_medium\b|\butm_campaign\b|\bcampaign_id\b|\badset_id\b|\bad_id\b/);
  });
});
