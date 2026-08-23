-- Reconcile an existing partially-migrated production database with the
-- dashboard prerequisites expected before 20260823100000_dashboard_data_contract_cleanup.sql.
--
-- This migration intentionally does not reapply the 20260816 marketing
-- attribution migration and does not delete or truncate production data.

create extension if not exists "pgcrypto";

create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions', 'finance'), false);
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_user_role() = 'teacher', false);
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_user_role() = 'student', false);
$$;

insert into public.teachers (profile_id, full_name, status, created_at, updated_at)
select
  p.id,
  coalesce(nullif(p.full_name, ''), p.email, 'Teacher'),
  coalesce(p.status::text, 'active'),
  now(),
  now()
from public.profiles p
where p.role = 'teacher'
  and not exists (
    select 1
    from public.teachers t
    where t.profile_id = p.id
  );

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select profile_id
    from public.teachers
    where profile_id is not null
    group by profile_id
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot reconcile teacher operational ids: % duplicate teachers.profile_id value(s) exist.', duplicate_count;
  end if;
end $$;

create unique index if not exists teachers_profile_id_unique_idx
  on public.teachers(profile_id)
  where profile_id is not null;

create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.teachers
  where profile_id = auth.uid()
  limit 1;
$$;

alter table if exists public.leads
  add column if not exists assigned_teacher_id uuid,
  add column if not exists lead_priority text default 'normal',
  add column if not exists lost_reason text,
  add column if not exists converted_student_id uuid references public.students(id),
  add column if not exists lead_type text default 'student',
  add column if not exists program_name text;

create table if not exists public.lead_activity_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  action_type text not null,
  description text,
  old_value text,
  new_value text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  program_id uuid references public.programs(id),
  teacher_profile_id uuid references public.profiles(id),
  day_of_week text not null,
  start_time time not null,
  duration_minutes integer not null default 30,
  timezone text not null default 'Africa/Cairo',
  platform text default 'Zoom',
  meeting_link text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  channel text not null,
  title text,
  body text not null,
  whatsapp_template_name text,
  variables jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  event_type text not null,
  target_role text not null,
  channel text not null,
  send_offset_minutes integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  related_entity_type text,
  related_entity_id uuid,
  recipient_id uuid,
  recipient_role text,
  channel text,
  template_key text,
  payload jsonb default '{}'::jsonb,
  status text default 'pending',
  scheduled_for timestamptz,
  processed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.notification_events(id) on delete set null,
  recipient_id uuid,
  recipient_role text,
  channel text,
  template_key text,
  provider text,
  provider_message_id text,
  status text not null,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.notification_events(id) on delete set null,
  recipient_id uuid references public.profiles(id) on delete cascade,
  recipient_role text,
  title text not null,
  message text not null,
  type text default 'system',
  related_entity_type text,
  related_entity_id uuid,
  related_url text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.teacher_session_checkins (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null,
  scheduled_start_at timestamptz not null,
  ready_at timestamptz,
  joined_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  status text default 'scheduled',
  late_minutes integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.teacher_compliance_rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  late_grace_minutes integer default 5,
  no_show_after_minutes integer default 10,
  max_warnings integer default 3,
  period_days integer default 30,
  action_after_limit text default 'flag_for_review',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.teacher_warnings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  class_id uuid references public.classes(id) on delete set null,
  warning_type text not null,
  severity text default 'medium',
  reason text not null,
  points integer default 1,
  status text default 'pending_review',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolution_note text
);

alter table if exists public.class_schedules
  add column if not exists student_id uuid references public.students(id) on delete cascade,
  add column if not exists program_id uuid references public.programs(id),
  add column if not exists teacher_profile_id uuid references public.profiles(id),
  add column if not exists day_of_week text,
  add column if not exists start_time time,
  add column if not exists duration_minutes integer default 30,
  add column if not exists timezone text default 'Africa/Cairo',
  add column if not exists platform text default 'Zoom',
  add column if not exists meeting_link text,
  add column if not exists status text default 'active',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.homework_submissions
  add column if not exists uploaded_by uuid references auth.users(id),
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size bigint;

alter table if exists public.teacher_session_checkins
  add column if not exists teacher_id uuid,
  add column if not exists ready_at timestamptz,
  add column if not exists joined_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists late_minutes integer default 0,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

alter table if exists public.teacher_warnings
  add column if not exists teacher_id uuid,
  add column if not exists class_id uuid references public.classes(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolution_note text;

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values
      (
        'homework-submissions',
        'homework-submissions',
        false,
        20971520,
        array[
          'application/pdf',
          'image/jpeg',
          'image/png',
          'audio/mpeg',
          'audio/mp3',
          'video/mp4',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      ),
      ('class-materials', 'class-materials', false, 52428800, null),
      ('payment-documents', 'payment-documents', false, 20971520, null),
      ('teacher-documents', 'teacher-documents', false, 20971520, null),
      ('profile-images', 'profile-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
  else
    raise notice 'storage.buckets not found; skipping storage bucket reconciliation.';
  end if;
end $$;

create index if not exists leads_assigned_teacher_id_idx on public.leads(assigned_teacher_id);
create index if not exists leads_next_follow_up_at_idx on public.leads(next_follow_up_at);
create index if not exists leads_lead_priority_idx on public.leads(lead_priority);
create index if not exists leads_lead_type_idx on public.leads(lead_type);
create index if not exists leads_form_type_idx on public.leads(form_type);
create index if not exists lead_activity_logs_lead_id_idx on public.lead_activity_logs(lead_id);
create index if not exists class_schedules_student_id_idx on public.class_schedules(student_id);
create index if not exists class_schedules_teacher_profile_id_idx on public.class_schedules(teacher_profile_id);
create index if not exists class_schedules_status_idx on public.class_schedules(status);
create index if not exists homework_submissions_uploaded_by_idx on public.homework_submissions(uploaded_by);
create index if not exists homework_submissions_file_path_idx on public.homework_submissions(file_path);
create index if not exists homework_submissions_class_id_idx on public.homework_submissions(class_id);
create index if not exists notification_events_status_schedule_idx on public.notification_events(status, scheduled_for);
create index if not exists notification_events_recipient_idx on public.notification_events(recipient_id, recipient_role);
create index if not exists notification_logs_event_idx on public.notification_logs(event_id);
create index if not exists in_app_notifications_recipient_idx on public.in_app_notifications(recipient_id, read_at, created_at desc);
create index if not exists teacher_session_checkins_teacher_idx on public.teacher_session_checkins(teacher_id, scheduled_start_at);
create index if not exists teacher_warnings_teacher_idx on public.teacher_warnings(teacher_id, created_at desc);

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select template_key, channel
    from public.notification_templates
    group by template_key, channel
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot add notification_templates_template_channel_unique: % duplicate template/channel key(s) exist.', duplicate_count;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notification_templates_template_channel_unique'
      and conrelid = 'public.notification_templates'::regclass
  ) then
    alter table public.notification_templates
      add constraint notification_templates_template_channel_unique unique (template_key, channel);
  end if;
end $$;

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select rule_key
    from public.notification_rules
    group by rule_key
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot add notification_rules_rule_key_unique: % duplicate rule key(s) exist.', duplicate_count;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notification_rules_rule_key_unique'
      and conrelid = 'public.notification_rules'::regclass
  ) then
    alter table public.notification_rules
      add constraint notification_rules_rule_key_unique unique (rule_key);
  end if;
end $$;

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select class_id, teacher_id
    from public.teacher_session_checkins
    group by class_id, teacher_id
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot add teacher_session_checkins_class_teacher_unique: % duplicate class/teacher check-in key(s) exist.', duplicate_count;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_session_checkins_class_teacher_unique'
      and conrelid = 'public.teacher_session_checkins'::regclass
  ) then
    alter table public.teacher_session_checkins
      add constraint teacher_session_checkins_class_teacher_unique unique (class_id, teacher_id);
  end if;
end $$;

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select teacher_id, class_id, warning_type
    from public.teacher_warnings
    where class_id is not null
    group by teacher_id, class_id, warning_type
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot add teacher_warnings_class_unique: % duplicate teacher/class/warning key(s) exist.', duplicate_count;
  end if;
end $$;

create unique index if not exists teacher_warnings_class_unique
  on public.teacher_warnings(teacher_id, class_id, warning_type)
  where class_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notification_templates_channel_supported'
      and conrelid = 'public.notification_templates'::regclass
  ) then
    alter table public.notification_templates
      add constraint notification_templates_channel_supported
      check (channel in ('in_app', 'email', 'whatsapp'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notification_rules_channel_supported'
      and conrelid = 'public.notification_rules'::regclass
  ) then
    alter table public.notification_rules
      add constraint notification_rules_channel_supported
      check (channel in ('in_app', 'email', 'whatsapp'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notification_events_channel_supported'
      and conrelid = 'public.notification_events'::regclass
  ) then
    alter table public.notification_events
      add constraint notification_events_channel_supported
      check (channel is null or channel in ('in_app', 'email', 'whatsapp'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notification_events_status_supported'
      and conrelid = 'public.notification_events'::regclass
  ) then
    alter table public.notification_events
      add constraint notification_events_status_supported
      check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'in_app_notifications_type_supported'
      and conrelid = 'public.in_app_notifications'::regclass
  ) then
    alter table public.in_app_notifications
      add constraint in_app_notifications_type_supported
      check (type in ('reminder', 'alert', 'warning', 'system', 'payment', 'homework', 'class'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_session_checkins_status_supported'
      and conrelid = 'public.teacher_session_checkins'::regclass
  ) then
    alter table public.teacher_session_checkins
      add constraint teacher_session_checkins_status_supported
      check (status in ('scheduled', 'reminded', 'ready', 'joined', 'live', 'completed', 'late', 'missed', 'excused', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_compliance_rules_action_supported'
      and conrelid = 'public.teacher_compliance_rules'::regclass
  ) then
    alter table public.teacher_compliance_rules
      add constraint teacher_compliance_rules_action_supported
      check (action_after_limit in ('flag_for_review', 'auto_suspend', 'admin_review_only'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_warnings_type_supported'
      and conrelid = 'public.teacher_warnings'::regclass
  ) then
    alter table public.teacher_warnings
      add constraint teacher_warnings_type_supported
      check (warning_type in ('late_checkin', 'no_show', 'missing_attendance', 'missing_class_report', 'trial_feedback_missing', 'manual'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_warnings_severity_supported'
      and conrelid = 'public.teacher_warnings'::regclass
  ) then
    alter table public.teacher_warnings
      add constraint teacher_warnings_severity_supported
      check (severity in ('low', 'medium', 'high'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_warnings_status_supported'
      and conrelid = 'public.teacher_warnings'::regclass
  ) then
    alter table public.teacher_warnings
      add constraint teacher_warnings_status_supported
      check (status in ('pending_review', 'approved', 'cancelled', 'excused', 'resolved'));
  end if;
end $$;

do $$
declare
  unmappable_count integer;
begin
  select count(*) into unmappable_count
  from public.students s
  where s.assigned_teacher_id is not null
    and not exists (select 1 from public.teachers t where t.id = s.assigned_teacher_id)
    and not exists (select 1 from public.teachers t where t.profile_id = s.assigned_teacher_id);
  if unmappable_count > 0 then
    raise exception 'Cannot reconcile students.assigned_teacher_id: % value(s) are neither teachers.id nor teachers.profile_id.', unmappable_count;
  end if;

  select count(*) into unmappable_count
  from public.leads l
  where l.assigned_teacher_id is not null
    and not exists (select 1 from public.teachers t where t.id = l.assigned_teacher_id)
    and not exists (select 1 from public.teachers t where t.profile_id = l.assigned_teacher_id);
  if unmappable_count > 0 then
    raise exception 'Cannot reconcile leads.assigned_teacher_id: % value(s) are neither teachers.id nor teachers.profile_id.', unmappable_count;
  end if;

  select count(*) into unmappable_count
  from public.free_trials ft
  where ft.teacher_id is not null
    and not exists (select 1 from public.teachers t where t.id = ft.teacher_id)
    and not exists (select 1 from public.teachers t where t.profile_id = ft.teacher_id);
  if unmappable_count > 0 then
    raise exception 'Cannot reconcile free_trials.teacher_id: % value(s) are neither teachers.id nor teachers.profile_id.', unmappable_count;
  end if;

  select count(*) into unmappable_count
  from public.classes c
  where c.teacher_id is not null
    and not exists (select 1 from public.teachers t where t.id = c.teacher_id)
    and not exists (select 1 from public.teachers t where t.profile_id = c.teacher_id);
  if unmappable_count > 0 then
    raise exception 'Cannot reconcile classes.teacher_id: % value(s) are neither teachers.id nor teachers.profile_id.', unmappable_count;
  end if;

  select count(*) into unmappable_count
  from public.attendance a
  where a.teacher_id is not null
    and not exists (select 1 from public.teachers t where t.id = a.teacher_id)
    and not exists (select 1 from public.teachers t where t.profile_id = a.teacher_id);
  if unmappable_count > 0 then
    raise exception 'Cannot reconcile attendance.teacher_id: % value(s) are neither teachers.id nor teachers.profile_id.', unmappable_count;
  end if;

  select count(*) into unmappable_count
  from public.evaluations e
  where e.teacher_id is not null
    and not exists (select 1 from public.teachers t where t.id = e.teacher_id)
    and not exists (select 1 from public.teachers t where t.profile_id = e.teacher_id);
  if unmappable_count > 0 then
    raise exception 'Cannot reconcile evaluations.teacher_id: % value(s) are neither teachers.id nor teachers.profile_id.', unmappable_count;
  end if;

  select count(*) into unmappable_count
  from public.teacher_session_checkins tsc
  where tsc.teacher_id is not null
    and not exists (select 1 from public.teachers t where t.id = tsc.teacher_id)
    and not exists (select 1 from public.teachers t where t.profile_id = tsc.teacher_id);
  if unmappable_count > 0 then
    raise exception 'Cannot reconcile teacher_session_checkins.teacher_id: % value(s) are neither teachers.id nor teachers.profile_id.', unmappable_count;
  end if;

  select count(*) into unmappable_count
  from public.teacher_warnings tw
  where tw.teacher_id is not null
    and not exists (select 1 from public.teachers t where t.id = tw.teacher_id)
    and not exists (select 1 from public.teachers t where t.profile_id = tw.teacher_id);
  if unmappable_count > 0 then
    raise exception 'Cannot reconcile teacher_warnings.teacher_id: % value(s) are neither teachers.id nor teachers.profile_id.', unmappable_count;
  end if;
end $$;

alter table if exists public.students drop constraint if exists students_assigned_teacher_id_fkey;
alter table if exists public.leads drop constraint if exists leads_assigned_teacher_id_fkey;
alter table if exists public.free_trials drop constraint if exists free_trials_teacher_id_fkey;
alter table if exists public.classes drop constraint if exists classes_teacher_id_fkey;
alter table if exists public.attendance drop constraint if exists attendance_teacher_id_fkey;
alter table if exists public.evaluations drop constraint if exists evaluations_teacher_id_fkey;
alter table if exists public.teacher_session_checkins drop constraint if exists teacher_session_checkins_teacher_id_fkey;
alter table if exists public.teacher_warnings drop constraint if exists teacher_warnings_teacher_id_fkey;

update public.students s
set assigned_teacher_id = t.id,
    updated_at = now()
from public.teachers t
where s.assigned_teacher_id = t.profile_id
  and not exists (select 1 from public.teachers valid_teacher where valid_teacher.id = s.assigned_teacher_id);

update public.leads l
set assigned_teacher_id = t.id,
    updated_at = now()
from public.teachers t
where l.assigned_teacher_id = t.profile_id
  and not exists (select 1 from public.teachers valid_teacher where valid_teacher.id = l.assigned_teacher_id);

update public.free_trials ft
set teacher_id = t.id,
    updated_at = now()
from public.teachers t
where ft.teacher_id = t.profile_id
  and not exists (select 1 from public.teachers valid_teacher where valid_teacher.id = ft.teacher_id);

update public.classes c
set teacher_id = t.id,
    updated_at = now()
from public.teachers t
where c.teacher_id = t.profile_id
  and not exists (select 1 from public.teachers valid_teacher where valid_teacher.id = c.teacher_id);

update public.attendance a
set teacher_id = t.id
from public.teachers t
where a.teacher_id = t.profile_id
  and not exists (select 1 from public.teachers valid_teacher where valid_teacher.id = a.teacher_id);

update public.evaluations e
set teacher_id = t.id
from public.teachers t
where e.teacher_id = t.profile_id
  and not exists (select 1 from public.teachers valid_teacher where valid_teacher.id = e.teacher_id);

update public.teacher_session_checkins tsc
set teacher_id = t.id
from public.teachers t
where tsc.teacher_id = t.profile_id
  and not exists (select 1 from public.teachers valid_teacher where valid_teacher.id = tsc.teacher_id);

update public.teacher_warnings tw
set teacher_id = t.id
from public.teachers t
where tw.teacher_id = t.profile_id
  and not exists (select 1 from public.teachers valid_teacher where valid_teacher.id = tw.teacher_id);

do $$
declare
  invalid_count integer;
begin
  select count(*) into invalid_count from public.students s where s.assigned_teacher_id is not null and not exists (select 1 from public.teachers t where t.id = s.assigned_teacher_id);
  if invalid_count > 0 then raise exception 'students.assigned_teacher_id still contains % non-operational teacher id(s).', invalid_count; end if;

  select count(*) into invalid_count from public.leads l where l.assigned_teacher_id is not null and not exists (select 1 from public.teachers t where t.id = l.assigned_teacher_id);
  if invalid_count > 0 then raise exception 'leads.assigned_teacher_id still contains % non-operational teacher id(s).', invalid_count; end if;

  select count(*) into invalid_count from public.free_trials ft where ft.teacher_id is not null and not exists (select 1 from public.teachers t where t.id = ft.teacher_id);
  if invalid_count > 0 then raise exception 'free_trials.teacher_id still contains % non-operational teacher id(s).', invalid_count; end if;

  select count(*) into invalid_count from public.classes c where c.teacher_id is not null and not exists (select 1 from public.teachers t where t.id = c.teacher_id);
  if invalid_count > 0 then raise exception 'classes.teacher_id still contains % non-operational teacher id(s).', invalid_count; end if;

  select count(*) into invalid_count from public.attendance a where a.teacher_id is not null and not exists (select 1 from public.teachers t where t.id = a.teacher_id);
  if invalid_count > 0 then raise exception 'attendance.teacher_id still contains % non-operational teacher id(s).', invalid_count; end if;

  select count(*) into invalid_count from public.evaluations e where e.teacher_id is not null and not exists (select 1 from public.teachers t where t.id = e.teacher_id);
  if invalid_count > 0 then raise exception 'evaluations.teacher_id still contains % non-operational teacher id(s).', invalid_count; end if;

  select count(*) into invalid_count from public.teacher_session_checkins tsc where tsc.teacher_id is not null and not exists (select 1 from public.teachers t where t.id = tsc.teacher_id);
  if invalid_count > 0 then raise exception 'teacher_session_checkins.teacher_id still contains % non-operational teacher id(s).', invalid_count; end if;

  select count(*) into invalid_count from public.teacher_warnings tw where tw.teacher_id is not null and not exists (select 1 from public.teachers t where t.id = tw.teacher_id);
  if invalid_count > 0 then raise exception 'teacher_warnings.teacher_id still contains % non-operational teacher id(s).', invalid_count; end if;
end $$;

alter table if exists public.students
  add constraint students_assigned_teacher_id_fkey foreign key (assigned_teacher_id) references public.teachers(id) not valid;
alter table if exists public.leads
  add constraint leads_assigned_teacher_id_fkey foreign key (assigned_teacher_id) references public.teachers(id) not valid;
alter table if exists public.free_trials
  add constraint free_trials_teacher_id_fkey foreign key (teacher_id) references public.teachers(id) not valid;
alter table if exists public.classes
  add constraint classes_teacher_id_fkey foreign key (teacher_id) references public.teachers(id) not valid;
alter table if exists public.attendance
  add constraint attendance_teacher_id_fkey foreign key (teacher_id) references public.teachers(id) not valid;
alter table if exists public.evaluations
  add constraint evaluations_teacher_id_fkey foreign key (teacher_id) references public.teachers(id) not valid;
alter table if exists public.teacher_session_checkins
  add constraint teacher_session_checkins_teacher_id_fkey foreign key (teacher_id) references public.teachers(id) on delete cascade not valid;
alter table if exists public.teacher_warnings
  add constraint teacher_warnings_teacher_id_fkey foreign key (teacher_id) references public.teachers(id) on delete cascade not valid;

drop trigger if exists class_schedules_set_updated_at on public.class_schedules;
create trigger class_schedules_set_updated_at
before update on public.class_schedules
for each row execute function public.set_updated_at();

drop trigger if exists notification_templates_set_updated_at on public.notification_templates;
create trigger notification_templates_set_updated_at before update on public.notification_templates for each row execute function public.set_updated_at();

drop trigger if exists notification_rules_set_updated_at on public.notification_rules;
create trigger notification_rules_set_updated_at before update on public.notification_rules for each row execute function public.set_updated_at();

drop trigger if exists teacher_session_checkins_set_updated_at on public.teacher_session_checkins;
create trigger teacher_session_checkins_set_updated_at before update on public.teacher_session_checkins for each row execute function public.set_updated_at();

drop trigger if exists teacher_compliance_rules_set_updated_at on public.teacher_compliance_rules;
create trigger teacher_compliance_rules_set_updated_at before update on public.teacher_compliance_rules for each row execute function public.set_updated_at();

alter table public.programs enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activity_logs enable row level security;
alter table public.students enable row level security;
alter table public.free_trials enable row level security;
alter table public.classes enable row level security;
alter table public.class_schedules enable row level security;
alter table public.attendance enable row level security;
alter table public.evaluations enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_rules enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_logs enable row level security;
alter table public.in_app_notifications enable row level security;
alter table public.teacher_session_checkins enable row level security;
alter table public.teacher_compliance_rules enable row level security;
alter table public.teacher_warnings enable row level security;

drop policy if exists "Authenticated users can read programs" on public.programs;
create policy "Authenticated users can read programs" on public.programs
  for select to authenticated
  using (status is null or status = 'active');

drop policy if exists "Public can read active programs" on public.programs;
create policy "Public can read active programs" on public.programs
  for select to anon
  using (status is null or status = 'active');

drop policy if exists "Admin admissions academic roles manage leads" on public.leads;
create policy "Admin admissions academic roles manage leads" on public.leads
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'admissions', 'academic_manager'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'admissions', 'academic_manager'));

drop policy if exists "Teachers can view assigned leads" on public.leads;
create policy "Teachers can view assigned leads" on public.leads
  for select using (assigned_teacher_id = public.current_teacher_id());

drop policy if exists "Admin admissions academic roles manage lead activity" on public.lead_activity_logs;
create policy "Admin admissions academic roles manage lead activity" on public.lead_activity_logs
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'admissions', 'academic_manager'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'admissions', 'academic_manager'));

drop policy if exists "Teachers can view assigned lead activity" on public.lead_activity_logs;
create policy "Teachers can view assigned lead activity" on public.lead_activity_logs
  for select using (
    exists (
      select 1 from public.leads l
      where l.id = lead_activity_logs.lead_id
        and l.assigned_teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers can insert assigned trial activity" on public.lead_activity_logs;
create policy "Teachers can insert assigned trial activity" on public.lead_activity_logs
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = lead_activity_logs.lead_id
        and l.assigned_teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Admin roles can update student teacher assignments" on public.students;
create policy "Admin roles can update student teacher assignments" on public.students
  for update to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions'));

drop policy if exists "Teachers can view students assigned to them" on public.students;
create policy "Teachers can view students assigned to them" on public.students
  for select using (assigned_teacher_id = public.current_teacher_id());

drop policy if exists "Teachers view assigned free trials" on public.free_trials;
create policy "Teachers view assigned free trials" on public.free_trials
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can update assigned free trials" on public.free_trials;
create policy "Teachers can update assigned free trials" on public.free_trials
  for update using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can view assigned classes" on public.classes;
create policy "Teachers can view assigned classes" on public.classes
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can update assigned classes" on public.classes;
create policy "Teachers can update assigned classes" on public.classes
  for update using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());

drop policy if exists "Students can view their own class schedules" on public.class_schedules;
create policy "Students can view their own class schedules" on public.class_schedules
  for select using (
    exists (
      select 1 from public.students s
      where s.id = class_schedules.student_id
        and s.profile_id = auth.uid()
    )
  );

drop policy if exists "Teachers can view assigned class schedules" on public.class_schedules;
create policy "Teachers can view assigned class schedules" on public.class_schedules
  for select using (teacher_profile_id = auth.uid());

drop policy if exists "Admin roles can view all class schedules" on public.class_schedules;
create policy "Admin roles can view all class schedules" on public.class_schedules
  for select using (public.is_admin_role());

drop policy if exists "Admin academic roles can manage class schedules" on public.class_schedules;
create policy "Admin academic roles can manage class schedules" on public.class_schedules
  for all using (
    public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions')
  ) with check (
    public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions')
  );

drop policy if exists "Teachers can view assigned attendance" on public.attendance;
create policy "Teachers can view assigned attendance" on public.attendance
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can insert attendance for assigned classes" on public.attendance;
create policy "Teachers can insert attendance for assigned classes" on public.attendance
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers can update attendance for assigned classes" on public.attendance;
create policy "Teachers can update attendance for assigned classes" on public.attendance
  for update using (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = public.current_teacher_id())
  ) with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers can view assigned evaluations" on public.evaluations;
create policy "Teachers can view assigned evaluations" on public.evaluations
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can insert evaluations for assigned students" on public.evaluations;
create policy "Teachers can insert evaluations for assigned students" on public.evaluations
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = evaluations.class_id and c.teacher_id = public.current_teacher_id())
    and exists (select 1 from public.students s where s.id = evaluations.student_id and s.assigned_teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers can view assigned homework submissions" on public.homework_submissions;
create policy "Teachers can view assigned homework submissions" on public.homework_submissions
  for select using (
    exists (
      select 1
      from public.classes c
      where c.id = homework_submissions.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers can add homework feedback" on public.homework_submissions;
create policy "Teachers can add homework feedback" on public.homework_submissions
  for update using (
    exists (
      select 1
      from public.classes c
      where c.id = homework_submissions.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  )
  with check (
    exists (
      select 1
      from public.classes c
      where c.id = homework_submissions.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Admins manage notification templates" on public.notification_templates;
create policy "Admins manage notification templates" on public.notification_templates
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage notification rules" on public.notification_rules;
create policy "Admins manage notification rules" on public.notification_rules
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage notification events" on public.notification_events;
create policy "Admins manage notification events" on public.notification_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users view own notification events" on public.notification_events;
create policy "Users view own notification events" on public.notification_events
  for select using (recipient_id = auth.uid());

drop policy if exists "Admins view notification logs" on public.notification_logs;
create policy "Admins view notification logs" on public.notification_logs
  for select using (public.is_admin());

drop policy if exists "Admins manage in app notifications" on public.in_app_notifications;
create policy "Admins manage in app notifications" on public.in_app_notifications
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users view own in app notifications" on public.in_app_notifications;
create policy "Users view own in app notifications" on public.in_app_notifications
  for select using (recipient_id = auth.uid());

drop policy if exists "Users update own in app notifications" on public.in_app_notifications;
create policy "Users update own in app notifications" on public.in_app_notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists "Admins manage teacher checkins" on public.teacher_session_checkins;
create policy "Admins manage teacher checkins" on public.teacher_session_checkins
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Teachers view own checkins" on public.teacher_session_checkins;
drop policy if exists "Teachers can view own checkins" on public.teacher_session_checkins;
create policy "Teachers view own checkins" on public.teacher_session_checkins
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers create assigned class checkins" on public.teacher_session_checkins;
drop policy if exists "Teachers can insert own checkins" on public.teacher_session_checkins;
create policy "Teachers create assigned class checkins" on public.teacher_session_checkins
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers update own assigned class checkins" on public.teacher_session_checkins;
drop policy if exists "Teachers can update own checkins" on public.teacher_session_checkins;
create policy "Teachers update own assigned class checkins" on public.teacher_session_checkins
  for update using (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  ) with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  );

drop policy if exists "Admins manage compliance rules" on public.teacher_compliance_rules;
create policy "Admins manage compliance rules" on public.teacher_compliance_rules
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage teacher warnings" on public.teacher_warnings;
create policy "Admins manage teacher warnings" on public.teacher_warnings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Teachers view own warnings" on public.teacher_warnings;
drop policy if exists "Teachers can view own warnings" on public.teacher_warnings;
create policy "Teachers view own warnings" on public.teacher_warnings
  for select using (teacher_id = public.current_teacher_id());

insert into public.teacher_compliance_rules (
  rule_name,
  late_grace_minutes,
  no_show_after_minutes,
  max_warnings,
  period_days,
  action_after_limit,
  is_active
)
select 'Default Teacher Compliance', 5, 10, 3, 30, 'flag_for_review', true
where not exists (select 1 from public.teacher_compliance_rules where is_active = true);

with seed_templates(template_key, title, body, whatsapp_template_name) as (
  values
    ('teacher_class_reminder_10_min', 'Class reminder', 'Assalamu Alaikum {{teacher_name}}, You have a {{program_name}} class with {{student_name}} at {{class_time}}. Please be ready before the session. Musliman Academy', 'teacher_class_reminder_10_min'),
    ('student_class_reminder_1_hour', 'Class reminder', 'Assalamu Alaikum, This is a reminder for {{student_name}}s {{program_name}} class today at {{class_time}} with {{teacher_name}}. Please be ready on time. Musliman Academy', 'student_class_reminder_1_hour'),
    ('teacher_no_checkin_urgent', 'Urgent class check-in', 'Assalamu Alaikum {{teacher_name}}, Your class with {{student_name}} has started, but your check-in has not been recorded. Please join or contact the academy team immediately. Musliman Academy', 'teacher_no_checkin_urgent'),
    ('admin_teacher_missing_alert', 'Teacher missing alert', 'Teacher {{teacher_name}} has not checked in for class {{class_name}} with {{student_name}} scheduled at {{class_time}}. Please review immediately.', 'admin_teacher_missing_alert'),
    ('teacher_warning_created', 'Teacher warning recorded', 'A warning has been recorded for missed/late class attendance. Reason: {{reason}} Class: {{class_name}} Date: {{class_time}} Please contact the academy team if this was due to an emergency.', 'teacher_warning_created'),
    ('teacher_attendance_missing', 'Attendance required', 'Please submit attendance for {{class_name}} with {{student_name}}. Attendance is required after every class.', 'teacher_attendance_missing'),
    ('teacher_report_missing', 'Class report required', 'Please submit your class report for {{class_name}} with {{student_name}}. Reports help the academy track student progress.', 'teacher_report_missing')
),
channels(channel) as (
  values ('in_app'), ('email'), ('whatsapp')
)
insert into public.notification_templates (template_key, channel, title, body, whatsapp_template_name, variables)
select template_key, channel, title, body, whatsapp_template_name, '{}'::jsonb
from seed_templates
cross join channels
on conflict (template_key, channel) do nothing;

insert into public.notification_rules (rule_key, event_type, target_role, channel, send_offset_minutes, is_active)
values
  ('teacher_class_reminder_10_min', 'class_reminder', 'teacher', 'in_app', -10, true),
  ('teacher_class_reminder_10_min_email', 'class_reminder', 'teacher', 'email', -10, true),
  ('teacher_class_reminder_10_min_whatsapp', 'class_reminder', 'teacher', 'whatsapp', -10, true),
  ('student_class_reminder_1_hour', 'class_reminder', 'student', 'in_app', -60, true),
  ('student_class_reminder_1_hour_email', 'class_reminder', 'student', 'email', -60, true),
  ('student_class_reminder_1_hour_whatsapp', 'class_reminder', 'student', 'whatsapp', -60, true),
  ('teacher_no_checkin_alert', 'teacher_no_checkin', 'teacher', 'in_app', 2, true),
  ('teacher_no_checkin_alert_email', 'teacher_no_checkin', 'teacher', 'email', 2, true),
  ('teacher_no_checkin_alert_whatsapp', 'teacher_no_checkin', 'teacher', 'whatsapp', 2, true),
  ('admin_teacher_missing_alert', 'teacher_missing', 'admin', 'in_app', 5, true),
  ('admin_teacher_missing_alert_email', 'teacher_missing', 'admin', 'email', 5, true),
  ('teacher_warning_created', 'teacher_warning_created', 'teacher', 'in_app', 0, true)
on conflict (rule_key) do nothing;

create or replace function public.render_notification_template(template_body text, payload jsonb)
returns text
language plpgsql
immutable
as $$
declare
  rendered text := coalesce(template_body, '');
  pair record;
begin
  for pair in select key, value from jsonb_each_text(coalesce(payload, '{}'::jsonb)) loop
    rendered := replace(rendered, '{{' || pair.key || '}}', pair.value);
  end loop;

  return rendered;
end;
$$;

create or replace function public.enqueue_notification_event(
  p_event_type text,
  p_related_entity_type text,
  p_related_entity_id uuid,
  p_recipient_id uuid,
  p_recipient_role text,
  p_channel text,
  p_template_key text,
  p_payload jsonb,
  p_scheduled_for timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_recipient_profile_id uuid;
begin
  if p_recipient_role = 'teacher' then
    select coalesce(
      (select t.profile_id from public.teachers t where t.id = p_recipient_id limit 1),
      p_recipient_id
    )
    into v_recipient_profile_id;
  else
    v_recipient_profile_id := p_recipient_id;
  end if;

  insert into public.notification_events (
    event_type,
    related_entity_type,
    related_entity_id,
    recipient_id,
    recipient_role,
    channel,
    template_key,
    payload,
    scheduled_for
  )
  select
    p_event_type,
    p_related_entity_type,
    p_related_entity_id,
    v_recipient_profile_id,
    p_recipient_role,
    p_channel,
    p_template_key,
    coalesce(p_payload, '{}'::jsonb),
    p_scheduled_for
  where not exists (
    select 1
    from public.notification_events ne
    where ne.event_type = p_event_type
      and coalesce(ne.related_entity_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_related_entity_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and coalesce(ne.recipient_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(v_recipient_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and ne.channel = p_channel
      and ne.template_key = p_template_key
      and ne.status <> 'cancelled'
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function public.process_scheduled_notification_events(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_template record;
  v_message text;
  v_count integer := 0;
begin
  for v_event in
    select *
    from public.notification_events
    where status = 'pending'
      and coalesce(scheduled_for, now()) <= now()
    order by scheduled_for nulls first, created_at
    limit p_limit
  loop
    update public.notification_events set status = 'processing' where id = v_event.id;

    select * into v_template
    from public.notification_templates
    where template_key = v_event.template_key
      and channel = v_event.channel
      and is_active = true
    limit 1;

    if v_template.id is null then
      update public.notification_events set status = 'failed', processed_at = now() where id = v_event.id;
      insert into public.notification_logs(event_id, recipient_id, recipient_role, channel, template_key, provider, status, error_message, created_at)
      values (v_event.id, v_event.recipient_id, v_event.recipient_role, v_event.channel, v_event.template_key, 'database', 'failed', 'Template not found or inactive.', now());
      continue;
    end if;

    v_message := public.render_notification_template(v_template.body, v_event.payload);

    if v_event.channel = 'in_app' and v_event.recipient_id is not null then
      insert into public.in_app_notifications(
        event_id,
        recipient_id,
        recipient_role,
        title,
        message,
        type,
        related_entity_type,
        related_entity_id,
        related_url
      )
      values (
        v_event.id,
        v_event.recipient_id,
        v_event.recipient_role,
        coalesce(v_template.title, v_event.event_type),
        v_message,
        case
          when v_event.event_type like '%warning%' then 'warning'
          when v_event.event_type like '%alert%' or v_event.event_type like '%missing%' then 'alert'
          when v_event.event_type like '%reminder%' then 'reminder'
          else 'system'
        end,
        v_event.related_entity_type,
        v_event.related_entity_id,
        null
      );

      update public.notification_events set status = 'sent', processed_at = now() where id = v_event.id;
      insert into public.notification_logs(event_id, recipient_id, recipient_role, channel, template_key, provider, status, sent_at, created_at)
      values (v_event.id, v_event.recipient_id, v_event.recipient_role, v_event.channel, v_event.template_key, 'in_app', 'sent', now(), now());
      v_count := v_count + 1;
    else
      update public.notification_events set status = 'pending' where id = v_event.id;
    end if;
  end loop;

  return v_count;
end;
$$;

create or replace function public.class_scheduled_start_at(p_class public.classes)
returns timestamptz
language sql
stable
as $$
  select ((p_class.class_date::timestamp + coalesce(p_class.start_time, '00:00'::time)) at time zone 'UTC');
$$;

create or replace function public.run_teacher_compliance_check()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule public.teacher_compliance_rules%rowtype;
  v_class record;
  v_start timestamptz;
  v_late_count integer := 0;
  v_no_show_count integer := 0;
  v_reminder_count integer := 0;
  v_admin record;
  v_channel text;
  v_warning_id uuid;
  v_warning_count integer;
begin
  select * into v_rule
  from public.teacher_compliance_rules
  where is_active = true
  order by created_at desc
  limit 1;

  if v_rule.id is null then
    insert into public.teacher_compliance_rules(rule_name) values ('Default Teacher Compliance') returning * into v_rule;
  end if;

  for v_class in
    select
      c.*,
      tp.full_name as teacher_name,
      t.profile_id as teacher_profile_id,
      s.student_name,
      s.profile_id as student_profile_id,
      s.whatsapp as student_whatsapp,
      pr.name as program_name
    from public.classes c
    left join public.teachers t on t.id = c.teacher_id
    left join public.profiles tp on tp.id = t.profile_id
    left join public.students s on s.id = c.student_id
    left join public.programs pr on pr.id = c.program_id
    where c.status in ('scheduled', 'rescheduled')
      and c.teacher_id is not null
      and c.class_date between current_date - interval '1 day' and current_date + interval '2 days'
  loop
    v_start := public.class_scheduled_start_at(v_class);

    insert into public.teacher_session_checkins(class_id, teacher_id, scheduled_start_at, status)
    values (v_class.id, v_class.teacher_id, v_start, 'scheduled')
    on conflict (class_id, teacher_id) do nothing;

    if now() >= v_start - interval '10 minutes' and now() < v_start + interval '1 day' then
      foreach v_channel in array array['in_app', 'email', 'whatsapp'] loop
        perform public.enqueue_notification_event(
          'class_reminder',
          'class',
          v_class.id,
          v_class.teacher_id,
          'teacher',
          v_channel,
          'teacher_class_reminder_10_min',
          jsonb_build_object(
            'teacher_name', coalesce(v_class.teacher_name, 'Teacher'),
            'student_name', coalesce(v_class.student_name, 'student'),
            'program_name', coalesce(v_class.program_name, v_class.lesson_title, 'academy'),
            'class_time', to_char(v_start, 'YYYY-MM-DD HH24:MI')
          ),
          v_start - interval '10 minutes'
        );
      end loop;
      v_reminder_count := v_reminder_count + 1;
    end if;

    if now() >= v_start - interval '1 hour' and now() < v_start + interval '1 day' then
      foreach v_channel in array array['in_app', 'email', 'whatsapp'] loop
        if v_channel <> 'in_app' or v_class.student_profile_id is not null then
          perform public.enqueue_notification_event(
            'class_reminder',
            'class',
            v_class.id,
            v_class.student_profile_id,
            'student',
            v_channel,
            'student_class_reminder_1_hour',
            jsonb_build_object(
              'student_name', coalesce(v_class.student_name, 'student'),
              'teacher_name', coalesce(v_class.teacher_name, 'teacher'),
              'program_name', coalesce(v_class.program_name, v_class.lesson_title, 'academy'),
              'class_time', to_char(v_start, 'YYYY-MM-DD HH24:MI'),
              'recipient_phone', v_class.student_whatsapp
            ),
            v_start - interval '1 hour'
          );
        end if;
      end loop;
    end if;

    if now() >= v_start + (v_rule.late_grace_minutes || ' minutes')::interval
      and not exists (
        select 1 from public.teacher_session_checkins tsc
        where tsc.class_id = v_class.id
          and tsc.teacher_id = v_class.teacher_id
          and (tsc.ready_at is not null or tsc.joined_at is not null)
      )
    then
      update public.teacher_session_checkins
      set status = 'late',
          late_minutes = greatest(0, floor(extract(epoch from (now() - scheduled_start_at)) / 60)::integer)
      where class_id = v_class.id and teacher_id = v_class.teacher_id and status not in ('missed', 'excused', 'cancelled');

      foreach v_channel in array array['in_app', 'email', 'whatsapp'] loop
        perform public.enqueue_notification_event(
          'teacher_no_checkin',
          'class',
          v_class.id,
          v_class.teacher_id,
          'teacher',
          v_channel,
          'teacher_no_checkin_urgent',
          jsonb_build_object(
            'teacher_name', coalesce(v_class.teacher_name, 'Teacher'),
            'student_name', coalesce(v_class.student_name, 'student')
          ),
          now()
        );
      end loop;

      for v_admin in select id from public.profiles where role in ('super_admin', 'admin', 'academic_manager') and status = 'active' loop
        foreach v_channel in array array['in_app', 'email'] loop
          perform public.enqueue_notification_event(
            'teacher_missing',
            'class',
            v_class.id,
            v_admin.id,
            'admin',
            v_channel,
            'admin_teacher_missing_alert',
            jsonb_build_object(
              'teacher_name', coalesce(v_class.teacher_name, 'Teacher'),
              'class_name', coalesce(v_class.lesson_title, 'Class'),
              'student_name', coalesce(v_class.student_name, 'student'),
              'class_time', to_char(v_start, 'YYYY-MM-DD HH24:MI')
            ),
            now()
          );
        end loop;
      end loop;

      v_late_count := v_late_count + 1;
    end if;

    if now() >= v_start + (v_rule.no_show_after_minutes || ' minutes')::interval
      and not exists (
        select 1 from public.teacher_session_checkins tsc
        where tsc.class_id = v_class.id
          and tsc.teacher_id = v_class.teacher_id
          and (tsc.ready_at is not null or tsc.joined_at is not null)
      )
    then
      update public.teacher_session_checkins
      set status = 'missed',
          late_minutes = greatest(0, floor(extract(epoch from (now() - scheduled_start_at)) / 60)::integer)
      where class_id = v_class.id and teacher_id = v_class.teacher_id and status not in ('excused', 'cancelled');

      insert into public.teacher_warnings(teacher_id, class_id, warning_type, severity, reason, points)
      values (
        v_class.teacher_id,
        v_class.id,
        'no_show',
        'high',
        'Teacher did not check in or join before the no-show threshold.',
        2
      )
      on conflict do nothing
      returning id into v_warning_id;

      if v_warning_id is not null then
        v_no_show_count := v_no_show_count + 1;

        foreach v_channel in array array['in_app', 'email', 'whatsapp'] loop
          perform public.enqueue_notification_event(
            'teacher_warning_created',
            'class',
            v_class.id,
            v_class.teacher_id,
            'teacher',
            v_channel,
            'teacher_warning_created',
            jsonb_build_object(
              'reason', 'Teacher did not check in or join before the no-show threshold.',
              'class_name', coalesce(v_class.lesson_title, 'Class'),
              'class_time', to_char(v_start, 'YYYY-MM-DD HH24:MI')
            ),
            now()
          );
        end loop;

        select count(*) into v_warning_count
        from public.teacher_warnings tw
        where tw.teacher_id = v_class.teacher_id
          and tw.created_at >= now() - (v_rule.period_days || ' days')::interval
          and tw.status in ('pending_review', 'approved');

        if v_warning_count >= v_rule.max_warnings then
          if v_rule.action_after_limit = 'auto_suspend' then
            update public.teachers set status = 'suspended' where id = v_class.teacher_id;
            update public.profiles set status = 'suspended' where id = v_class.teacher_profile_id and role = 'teacher';
          end if;

          for v_admin in select id from public.profiles where role in ('super_admin', 'admin', 'academic_manager') and status = 'active' loop
            perform public.enqueue_notification_event(
              'teacher_warning_limit_exceeded',
              'teacher',
              v_class.teacher_id,
              v_admin.id,
              'admin',
              'in_app',
              'admin_teacher_missing_alert',
              jsonb_build_object(
                'teacher_name', coalesce(v_class.teacher_name, 'Teacher'),
                'class_name', 'Warning limit exceeded',
                'student_name', v_warning_count::text || ' warnings in period',
                'class_time', to_char(now(), 'YYYY-MM-DD HH24:MI')
              ),
              now()
            );
          end loop;
        end if;
      end if;
    end if;
  end loop;

  perform public.process_scheduled_notification_events(100);

  return jsonb_build_object(
    'reminders_checked', v_reminder_count,
    'late_checkins', v_late_count,
    'no_shows', v_no_show_count
  );
end;
$$;
