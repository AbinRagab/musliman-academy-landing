import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260823110000_class_lifecycle_engine.sql'),
  'utf8',
);

describe('class lifecycle migration contract', () => {
  it('materializes recurring schedules into unique concrete classes', () => {
    expect(migration).toContain('add column if not exists schedule_id');
    expect(migration).toContain('classes_schedule_date_unique');
    expect(migration).toContain('create or replace function public.materialize_scheduled_classes');
    expect(migration).toContain('on conflict (schedule_id, class_date)');
  });

  it('replaces student schedules atomically and checks overlap conflicts', () => {
    expect(migration).toContain('create or replace function public.replace_student_class_schedules');
    expect(migration).toContain('public.assert_schedule_slot_available');
    expect(migration).toContain('public.time_overlaps');
    expect(migration).toContain('Teacher already has a class from');
    expect(migration).toContain('Student already has a class from');
  });

  it('updates teacher lifecycle state through one RPC', () => {
    expect(migration).toContain('create or replace function public.update_teacher_class_lifecycle');
    expect(migration).toContain("set status = 'live'");
    expect(migration).toContain("set status = 'completed'");
    expect(migration).toContain('teacher_session_checkins');
  });

  it('separates homework assignments from submissions', () => {
    expect(migration).toContain('create table if not exists public.homework_assignments');
    expect(migration).toContain('homework_assignments_class_student_teacher_unique');
    expect(migration).toContain('add column if not exists assignment_id');
  });
});
