-- Complete remaining operational dashboard contracts.
-- Additive/idempotent migration; does not destroy production data.

create extension if not exists "pgcrypto";

alter table if exists public.attendance
  add column if not exists admin_review_status text not null default 'pending',
  add column if not exists follow_up_status text not null default 'not_required',
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists correction_requested_at timestamptz,
  add column if not exists correction_note text;

alter table if exists public.classes
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_by uuid references public.profiles(id) on delete set null,
  add column if not exists cancelled_at timestamptz,
  add column if not exists rescheduled_by uuid references public.profiles(id) on delete set null,
  add column if not exists rescheduled_at timestamptz,
  add column if not exists reschedule_reason text;

alter table if exists public.payments
  add column if not exists invoice_url text,
  add column if not exists invoice_file_path text,
  add column if not exists refunded_at timestamptz,
  add column if not exists cancelled_at timestamptz;

alter table if exists public.teachers
  add column if not exists bio text,
  add column if not exists availability_json jsonb not null default '{}'::jsonb,
  add column if not exists profile_image_path text;

alter table if exists public.profiles
  add column if not exists preferred_language text,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

create table if not exists public.academy_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_session_usage (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  sessions_used integer not null default 1 check (sessions_used > 0),
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (payment_id, class_id)
);

create index if not exists attendance_admin_review_idx on public.attendance(admin_review_status, follow_up_status);
create index if not exists payments_invoice_file_path_idx on public.payments(invoice_file_path);
create index if not exists payment_session_usage_student_idx on public.payment_session_usage(student_id);
create index if not exists payment_session_usage_class_idx on public.payment_session_usage(class_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'attendance_admin_review_status_supported'
      and conrelid = 'public.attendance'::regclass
  ) then
    alter table public.attendance
      add constraint attendance_admin_review_status_supported
      check (admin_review_status in ('pending', 'confirmed', 'correction_requested'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'attendance_follow_up_status_supported'
      and conrelid = 'public.attendance'::regclass
  ) then
    alter table public.attendance
      add constraint attendance_follow_up_status_supported
      check (follow_up_status in ('not_required', 'open', 'done'));
  end if;
end $$;

create or replace function public.set_academy_setting(
  p_key text,
  p_value jsonb
)
returns public.academy_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_setting public.academy_settings;
begin
  if not public.is_admin() then
    raise exception 'Only admin roles can update academy settings.';
  end if;

  insert into public.academy_settings(key, value, updated_by, updated_at)
  values (p_key, coalesce(p_value, '{}'::jsonb), auth.uid(), now())
  on conflict (key) do update
    set value = excluded.value,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
  returning * into v_setting;

  return v_setting;
end;
$$;

create or replace function public.convert_trial_to_student(p_trial_id uuid)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial public.free_trials%rowtype;
  v_lead public.leads%rowtype;
  v_student public.students%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admin roles can convert trials.';
  end if;

  select * into v_trial
  from public.free_trials
  where id = p_trial_id
  for update;

  if not found then
    raise exception 'Trial not found.';
  end if;

  if v_trial.student_id is not null then
    select * into v_student from public.students where id = v_trial.student_id;
    update public.free_trials set status = 'converted', updated_at = now() where id = p_trial_id;
    return v_student;
  end if;

  if v_trial.lead_id is null then
    raise exception 'Trial has no lead to convert.';
  end if;

  select * into v_lead
  from public.leads
  where id = v_trial.lead_id
  for update;

  if not found then
    raise exception 'Lead not found.';
  end if;

  if v_lead.converted_student_id is not null then
    select * into v_student from public.students where id = v_lead.converted_student_id;
    update public.free_trials
      set student_id = v_student.id,
          status = 'converted',
          updated_at = now()
      where id = p_trial_id;
    return v_student;
  end if;

  select * into v_student
  from public.students
  where lead_id = v_lead.id
  order by created_at asc
  limit 1
  for update;

  if not found then
    insert into public.students (
      lead_id,
      student_name,
      whatsapp,
      country,
      age,
      program_id,
      assigned_teacher_id,
      status,
      start_date,
      created_at,
      updated_at
    )
    values (
      v_lead.id,
      coalesce(nullif(v_lead.full_name, ''), 'Converted student'),
      v_lead.whatsapp,
      v_lead.country,
      v_lead.student_age,
      coalesce(v_trial.program_id, v_lead.program_id),
      coalesce(v_trial.teacher_id, v_lead.assigned_teacher_id),
      'active',
      current_date,
      now(),
      now()
    )
    returning * into v_student;
  end if;

  update public.leads
    set converted_student_id = v_student.id,
        status = 'enrolled',
        updated_at = now()
    where id = v_lead.id;

  update public.free_trials
    set student_id = v_student.id,
        status = 'converted',
        updated_at = now()
    where id = p_trial_id;

  insert into public.lead_activity_logs(lead_id, action_type, description, old_value, new_value, created_by)
  values (v_lead.id, 'converted_to_student', 'Lead converted to student from free trial.', null, v_student.id::text, auth.uid());

  return v_student;
end;
$$;

create or replace function public.reschedule_class_occurrence(
  p_class_id uuid,
  p_class_date date,
  p_start_time time,
  p_duration_minutes integer,
  p_meeting_link text default null,
  p_reason text default null
)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admin roles can reschedule classes.';
  end if;

  if p_duration_minutes is null or p_duration_minutes <= 0 then
    raise exception 'Duration must be positive.';
  end if;

  select * into v_class from public.classes where id = p_class_id for update;
  if not found then
    raise exception 'Class not found.';
  end if;

  if v_class.status = 'completed' then
    raise exception 'Completed historical classes cannot be rescheduled.';
  end if;

  update public.classes
    set class_date = p_class_date,
        start_time = p_start_time,
        end_time = p_start_time + make_interval(mins => p_duration_minutes),
        duration_minutes = p_duration_minutes,
        meeting_link = coalesce(nullif(p_meeting_link, ''), meeting_link),
        status = 'rescheduled',
        rescheduled_by = auth.uid(),
        rescheduled_at = now(),
        reschedule_reason = nullif(p_reason, ''),
        updated_at = now()
    where id = p_class_id
    returning * into v_class;

  return v_class;
end;
$$;

create or replace function public.cancel_class_occurrence(
  p_class_id uuid,
  p_reason text default null
)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admin roles can cancel classes.';
  end if;

  select * into v_class from public.classes where id = p_class_id for update;
  if not found then
    raise exception 'Class not found.';
  end if;

  if v_class.status = 'completed' then
    raise exception 'Completed historical classes cannot be cancelled.';
  end if;

  update public.classes
    set status = 'cancelled',
        cancellation_reason = nullif(p_reason, ''),
        cancelled_by = auth.uid(),
        cancelled_at = now(),
        updated_at = now()
    where id = p_class_id
    returning * into v_class;

  return v_class;
end;
$$;

create or replace function public.record_payment_session_usage(p_class_id uuid)
returns public.payment_session_usage
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes%rowtype;
  v_attendance public.attendance%rowtype;
  v_payment public.payments%rowtype;
  v_usage public.payment_session_usage%rowtype;
  v_reason text;
begin
  if not public.is_admin() and public.current_teacher_id() is null then
    raise exception 'Not authorized to record session usage.';
  end if;

  select * into v_class from public.classes where id = p_class_id;
  if not found then
    raise exception 'Class not found.';
  end if;

  select * into v_attendance
  from public.attendance
  where class_id = p_class_id and student_id = v_class.student_id
  order by marked_at desc
  limit 1;

  if v_class.status in ('cancelled', 'teacher_absent', 'rescheduled') then
    raise exception 'This class status does not consume a paid session.';
  end if;

  if found and v_attendance.status in ('excused', 'cancelled') then
    raise exception 'Excused/cancelled attendance does not consume a paid session.';
  end if;

  if v_class.status not in ('completed', 'student_absent') then
    raise exception 'Only completed or student-absent classes consume paid sessions.';
  end if;

  v_reason := case
    when v_class.status = 'student_absent' or (found and v_attendance.status = 'absent') then 'student_absent'
    when found and v_attendance.status = 'late' then 'completed_late'
    else 'completed_present'
  end;

  select * into v_payment
  from public.payments
  where student_id = v_class.student_id
    and status = 'paid'
    and coalesce(sessions_remaining, 0) > 0
  order by coalesce(payment_date, created_at::date) asc, created_at asc
  limit 1
  for update;

  if not found then
    raise exception 'No paid package with remaining sessions is available for this student.';
  end if;

  insert into public.payment_session_usage(payment_id, student_id, class_id, sessions_used, reason, created_by)
  values (v_payment.id, v_class.student_id, p_class_id, 1, v_reason, auth.uid())
  on conflict (payment_id, class_id) do nothing
  returning * into v_usage;

  if not found then
    select * into v_usage
    from public.payment_session_usage
    where payment_id = v_payment.id and class_id = p_class_id;
    return v_usage;
  end if;

  update public.payments
    set sessions_remaining = greatest(coalesce(sessions_remaining, 0) - 1, 0),
        updated_at = now()
    where id = v_payment.id;

  return v_usage;
end;
$$;

create or replace function public.run_dashboard_notification_cycle()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compliance jsonb;
  v_processed integer;
begin
  begin
    select public.run_teacher_compliance_check() into v_compliance;
  exception when undefined_function then
    v_compliance := '{"skipped":"run_teacher_compliance_check missing"}'::jsonb;
  end;

  begin
    select public.process_scheduled_notification_events(100) into v_processed;
  exception when undefined_function then
    v_processed := 0;
  end;

  return jsonb_build_object(
    'compliance', v_compliance,
    'processed', v_processed,
    'ran_at', now()
  );
end;
$$;

do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception when insufficient_privilege then
  raise notice 'pg_cron extension requires Supabase project-level enablement.';
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobname)
    from cron.job
    where jobname = 'musliman-dashboard-notification-cycle';

    perform cron.schedule(
      'musliman-dashboard-notification-cycle',
      '*/5 * * * *',
      $cron$select public.run_dashboard_notification_cycle();$cron$
    );
  end if;
exception when undefined_table or insufficient_privilege then
  raise notice 'Unable to create pg_cron job automatically. Configure the 5-minute dashboard notification cycle manually.';
end $$;

alter table public.academy_settings enable row level security;
alter table public.payment_session_usage enable row level security;

drop policy if exists "Admins manage academy settings" on public.academy_settings;
create policy "Admins manage academy settings" on public.academy_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users can read nonsecret academy settings" on public.academy_settings;
create policy "Authenticated users can read nonsecret academy settings" on public.academy_settings
  for select using (auth.role() = 'authenticated');

drop policy if exists "Admins manage payment session usage" on public.payment_session_usage;
create policy "Admins manage payment session usage" on public.payment_session_usage
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'finance'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'finance'));

drop policy if exists "Students view own payment session usage" on public.payment_session_usage;
create policy "Students view own payment session usage" on public.payment_session_usage
  for select using (
    exists (
      select 1 from public.students s
      where s.id = payment_session_usage.student_id
        and s.profile_id = auth.uid()
    )
  );

drop policy if exists "Teachers view assigned payment session usage" on public.payment_session_usage;
create policy "Teachers view assigned payment session usage" on public.payment_session_usage
  for select using (
    exists (
      select 1 from public.classes c
      where c.id = payment_session_usage.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );
