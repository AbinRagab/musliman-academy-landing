alter table public.classes
  add column if not exists schedule_id uuid references public.class_schedules(id) on delete set null,
  add column if not exists timezone text not null default 'Africa/Cairo',
  add column if not exists platform text,
  add column if not exists next_lesson_plan text,
  add column if not exists teacher_notes text,
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists rescheduled_from_class_id uuid references public.classes(id) on delete set null;

create index if not exists classes_schedule_id_idx on public.classes(schedule_id);
create index if not exists classes_date_status_idx on public.classes(class_date, status);
create index if not exists classes_teacher_date_time_idx on public.classes(teacher_id, class_date, start_time);
create index if not exists classes_student_date_time_idx on public.classes(student_id, class_date, start_time);

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select schedule_id, class_date
    from public.classes
    where schedule_id is not null
    group by schedule_id, class_date
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot add classes_schedule_date_unique: % duplicate schedule/date class occurrence key(s) exist. Resolve duplicates before running this migration.', duplicate_count;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'classes_schedule_date_unique'
      and conrelid = 'public.classes'::regclass
  ) then
    alter table public.classes
      add constraint classes_schedule_date_unique unique (schedule_id, class_date);
  end if;
end $$;

create table if not exists public.homework_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  instructions text not null,
  due_at timestamptz,
  status text not null default 'assigned',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint homework_assignments_status_supported check (status in ('assigned', 'cancelled', 'reviewed'))
);

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select class_id, student_id, teacher_id
    from public.homework_assignments
    group by class_id, student_id, teacher_id
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot add homework_assignments_class_student_teacher_unique: % duplicate class/student/teacher homework assignment key(s) exist.', duplicate_count;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'homework_assignments_class_student_teacher_unique'
      and conrelid = 'public.homework_assignments'::regclass
  ) then
    alter table public.homework_assignments
      add constraint homework_assignments_class_student_teacher_unique unique (class_id, student_id, teacher_id);
  end if;
end $$;

alter table public.homework_submissions
  add column if not exists assignment_id uuid references public.homework_assignments(id) on delete set null;

create index if not exists homework_assignments_class_idx on public.homework_assignments(class_id);
create index if not exists homework_assignments_student_idx on public.homework_assignments(student_id, status);
create index if not exists homework_assignments_teacher_idx on public.homework_assignments(teacher_id, created_at desc);
create index if not exists homework_submissions_assignment_idx on public.homework_submissions(assignment_id);

drop trigger if exists homework_assignments_set_updated_at on public.homework_assignments;
create trigger homework_assignments_set_updated_at
before update on public.homework_assignments
for each row execute function public.set_updated_at();

alter table public.homework_assignments enable row level security;

drop policy if exists "Admin roles can manage homework assignments" on public.homework_assignments;
create policy "Admin roles can manage homework assignments" on public.homework_assignments
  for all using (public.is_admin_role()) with check (public.is_admin_role());

drop policy if exists "Teachers can view assigned homework assignments" on public.homework_assignments;
create policy "Teachers can view assigned homework assignments" on public.homework_assignments
  for select using (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = homework_assignments.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers can manage assigned homework assignments" on public.homework_assignments;
create policy "Teachers can manage assigned homework assignments" on public.homework_assignments
  for all using (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = homework_assignments.class_id
        and c.teacher_id = public.current_teacher_id()
        and c.status in ('live', 'completed')
    )
  ) with check (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = homework_assignments.class_id
        and c.teacher_id = public.current_teacher_id()
        and c.student_id = homework_assignments.student_id
    )
  );

drop policy if exists "Students can view own homework assignments" on public.homework_assignments;
create policy "Students can view own homework assignments" on public.homework_assignments
  for select using (
    exists (
      select 1 from public.students s
      where s.id = homework_assignments.student_id
        and s.profile_id = auth.uid()
    )
  );

alter table public.profiles
  add column if not exists preferred_language text,
  add column if not exists preferred_class_time text,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb,
  add column if not exists parent_communication_preferences jsonb not null default '{}'::jsonb;

alter table public.messages
  add column if not exists related_student_id uuid references public.students(id) on delete set null,
  add column if not exists related_class_id uuid references public.classes(id) on delete set null,
  add column if not exists related_trial_id uuid references public.free_trials(id) on delete set null,
  add column if not exists category text not null default 'general',
  add column if not exists thread_id uuid;

create index if not exists messages_thread_id_idx on public.messages(thread_id);
create index if not exists messages_related_student_idx on public.messages(related_student_id);
create index if not exists messages_related_class_idx on public.messages(related_class_id);
create index if not exists messages_related_trial_idx on public.messages(related_trial_id);

create or replace function public.prevent_message_content_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin_role() then
    return new;
  end if;

  if old.sender_id is distinct from new.sender_id
    or old.receiver_id is distinct from new.receiver_id
    or old.subject is distinct from new.subject
    or old.body is distinct from new.body
    or old.related_student_id is distinct from new.related_student_id
    or old.related_class_id is distinct from new.related_class_id
    or old.related_trial_id is distinct from new.related_trial_id
    or old.category is distinct from new.category
    or old.thread_id is distinct from new.thread_id
  then
    raise exception 'Only message read state can be changed after send.';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_prevent_content_updates on public.messages;
create trigger messages_prevent_content_updates
before update on public.messages
for each row execute function public.prevent_message_content_updates();

drop policy if exists "Users can mark received messages read" on public.messages;
create policy "Users can mark received messages read" on public.messages
  for update using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

create or replace function public.mark_message_read(p_message_id uuid)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.messages%rowtype;
begin
  update public.messages
  set read_at = coalesce(read_at, now())
  where id = p_message_id
    and receiver_id = auth.uid()
  returning * into v_message;

  if v_message.id is null then
    raise exception 'Message not found or cannot be marked read by this user.';
  end if;

  return v_message;
end;
$$;

create or replace function public.mark_all_messages_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.messages
  set read_at = coalesce(read_at, now())
  where receiver_id = auth.uid()
    and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.weekday_index(p_day text)
returns integer
language sql
immutable
as $$
  select case lower(trim(p_day))
    when 'sunday' then 0
    when 'sun' then 0
    when 'monday' then 1
    when 'mon' then 1
    when 'tuesday' then 2
    when 'tue' then 2
    when 'wednesday' then 3
    when 'wed' then 3
    when 'thursday' then 4
    when 'thu' then 4
    when 'friday' then 5
    when 'fri' then 5
    when 'saturday' then 6
    when 'sat' then 6
    else null
  end;
$$;

create or replace function public.time_overlaps(
  p_first_start time,
  p_first_duration integer,
  p_second_start time,
  p_second_duration integer
)
returns boolean
language sql
immutable
as $$
  select p_first_start < (p_second_start + make_interval(mins => greatest(coalesce(p_second_duration, 30), 1)))
    and p_second_start < (p_first_start + make_interval(mins => greatest(coalesce(p_first_duration, 30), 1)));
$$;

create or replace function public.assert_schedule_slot_available(
  p_student_id uuid,
  p_teacher_profile_id uuid,
  p_day_of_week text,
  p_start_time time,
  p_duration_minutes integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid;
  v_conflict record;
begin
  if public.weekday_index(p_day_of_week) is null then
    raise exception 'Unsupported class day: %.', p_day_of_week;
  end if;

  select id into v_teacher_id
  from public.teachers
  where profile_id = p_teacher_profile_id
  limit 1;

  if v_teacher_id is null then
    raise exception 'Selected teacher profile is not linked to an operational teacher record.';
  end if;

  select cs.day_of_week, cs.start_time, cs.duration_minutes
  into v_conflict
  from public.class_schedules cs
  where cs.status = 'active'
    and cs.teacher_profile_id = p_teacher_profile_id
    and cs.student_id is distinct from p_student_id
    and public.weekday_index(cs.day_of_week) = public.weekday_index(p_day_of_week)
    and public.time_overlaps(p_start_time, p_duration_minutes, cs.start_time, cs.duration_minutes)
  order by cs.start_time
  limit 1;

  if v_conflict.day_of_week is not null then
    raise exception 'Teacher already has a class from % to % on %.',
      to_char(v_conflict.start_time, 'HH24:MI'),
      to_char(v_conflict.start_time + make_interval(mins => coalesce(v_conflict.duration_minutes, 30)), 'HH24:MI'),
      v_conflict.day_of_week;
  end if;

  select cs.day_of_week, cs.start_time, cs.duration_minutes
  into v_conflict
  from public.class_schedules cs
  where cs.status = 'active'
    and cs.student_id = p_student_id
    and cs.teacher_profile_id is distinct from p_teacher_profile_id
    and public.weekday_index(cs.day_of_week) = public.weekday_index(p_day_of_week)
    and public.time_overlaps(p_start_time, p_duration_minutes, cs.start_time, cs.duration_minutes)
  order by cs.start_time
  limit 1;

  if v_conflict.day_of_week is not null then
    raise exception 'Student already has a class from % to % on %.',
      to_char(v_conflict.start_time, 'HH24:MI'),
      to_char(v_conflict.start_time + make_interval(mins => coalesce(v_conflict.duration_minutes, 30)), 'HH24:MI'),
      v_conflict.day_of_week;
  end if;

  select c.class_date, c.start_time, c.duration_minutes
  into v_conflict
  from public.classes c
  where c.teacher_id = v_teacher_id
    and c.student_id is distinct from p_student_id
    and c.status in ('scheduled', 'live', 'rescheduled')
    and c.class_date >= current_date
    and public.weekday_index(to_char(c.class_date, 'FMDay')) = public.weekday_index(p_day_of_week)
    and public.time_overlaps(p_start_time, p_duration_minutes, coalesce(c.start_time, '00:00'::time), c.duration_minutes)
  order by c.class_date, c.start_time
  limit 1;

  if v_conflict.class_date is not null then
    raise exception 'Teacher already has a class from % to % on %.',
      to_char(v_conflict.start_time, 'HH24:MI'),
      to_char(v_conflict.start_time + make_interval(mins => coalesce(v_conflict.duration_minutes, 30)), 'HH24:MI'),
      to_char(v_conflict.class_date, 'YYYY-MM-DD');
  end if;

  select c.class_date, c.start_time, c.duration_minutes
  into v_conflict
  from public.classes c
  where c.student_id = p_student_id
    and c.schedule_id is null
    and c.status in ('scheduled', 'live', 'rescheduled')
    and c.class_date >= current_date
    and public.weekday_index(to_char(c.class_date, 'FMDay')) = public.weekday_index(p_day_of_week)
    and public.time_overlaps(p_start_time, p_duration_minutes, coalesce(c.start_time, '00:00'::time), c.duration_minutes)
  order by c.class_date, c.start_time
  limit 1;

  if v_conflict.class_date is not null then
    raise exception 'Student already has a class from % to % on %.',
      to_char(v_conflict.start_time, 'HH24:MI'),
      to_char(v_conflict.start_time + make_interval(mins => coalesce(v_conflict.duration_minutes, 30)), 'HH24:MI'),
      to_char(v_conflict.class_date, 'YYYY-MM-DD');
  end if;
end;
$$;

create or replace function public.materialize_scheduled_classes(
  p_from_date date default current_date,
  p_to_date date default (current_date + interval '46 weeks')::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule record;
  v_date date;
  v_end_time time;
  v_count integer := 0;
  v_row_count integer;
begin
  if p_from_date is null or p_to_date is null or p_to_date < p_from_date then
    raise exception 'A valid materialization date range is required.';
  end if;

  if p_to_date > p_from_date + interval '46 weeks' then
    raise exception 'Scheduled class materialization cannot exceed 46 weeks per run.';
  end if;

  for v_schedule in
    select
      cs.*,
      t.id as operational_teacher_id
    from public.class_schedules cs
    left join public.teachers t on t.profile_id = cs.teacher_profile_id
    where cs.status = 'active'
      and cs.student_id is not null
      and cs.teacher_profile_id is not null
  loop
    if v_schedule.operational_teacher_id is null then
      raise exception 'Schedule % has teacher_profile_id % without an operational teacher record.', v_schedule.id, v_schedule.teacher_profile_id;
    end if;

    if public.weekday_index(v_schedule.day_of_week) is null then
      raise exception 'Schedule % has unsupported day_of_week value: %.', v_schedule.id, v_schedule.day_of_week;
    end if;

    v_date := p_from_date;
    while v_date <= p_to_date loop
      if extract(dow from v_date)::integer = public.weekday_index(v_schedule.day_of_week) then
        v_end_time := (v_schedule.start_time + make_interval(mins => greatest(coalesce(v_schedule.duration_minutes, 30), 1)))::time;

        insert into public.classes (
          schedule_id,
          student_id,
          teacher_id,
          program_id,
          class_date,
          start_time,
          end_time,
          duration_minutes,
          meeting_link,
          lesson_title,
          status,
          timezone,
          platform
        )
        values (
          v_schedule.id,
          v_schedule.student_id,
          v_schedule.operational_teacher_id,
          v_schedule.program_id,
          v_date,
          v_schedule.start_time,
          v_end_time,
          greatest(coalesce(v_schedule.duration_minutes, 30), 1),
          v_schedule.meeting_link,
          'Scheduled class',
          'scheduled',
          coalesce(v_schedule.timezone, 'Africa/Cairo'),
          coalesce(v_schedule.platform, 'Zoom')
        )
        on conflict (schedule_id, class_date) do update
          set student_id = excluded.student_id,
              teacher_id = excluded.teacher_id,
              program_id = excluded.program_id,
              start_time = excluded.start_time,
              end_time = excluded.end_time,
              duration_minutes = excluded.duration_minutes,
              meeting_link = excluded.meeting_link,
              timezone = excluded.timezone,
              platform = excluded.platform,
              updated_at = now()
          where public.classes.status in ('scheduled', 'rescheduled')
            and public.classes.class_date >= current_date;

        get diagnostics v_row_count = row_count;
        v_count := v_count + v_row_count;
      end if;

      v_date := v_date + 1;
    end loop;
  end loop;

  return v_count;
end;
$$;

create or replace function public.replace_student_class_schedules(
  p_student_id uuid,
  p_program_id uuid,
  p_teacher_profile_id uuid,
  p_timezone text default 'Africa/Cairo',
  p_schedules jsonb default '[]'::jsonb,
  p_from_date date default current_date,
  p_to_date date default (current_date + interval '46 weeks')::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule record;
  v_internal_conflict record;
  v_teacher_id uuid;
  v_old_schedule_ids uuid[];
  v_materialized integer;
begin
  if not public.is_admin_role() then
    raise exception 'Only admin roles can replace student schedules.';
  end if;

  if p_student_id is null or p_program_id is null or p_teacher_profile_id is null then
    raise exception 'Student, program, and teacher are required before setting a schedule.';
  end if;

  if jsonb_typeof(p_schedules) <> 'array' or jsonb_array_length(p_schedules) = 0 then
    raise exception 'Please provide at least one class schedule row.';
  end if;

  select id into v_teacher_id
  from public.teachers
  where profile_id = p_teacher_profile_id
  limit 1;

  if v_teacher_id is null then
    raise exception 'Selected teacher profile is not linked to an operational teacher record.';
  end if;

  with parsed as (
    select
      row_number() over () as row_number,
      x."dayOfWeek" as day_of_week,
      x."startTime"::time as start_time,
      greatest(coalesce(x."durationMinutes", 30), 1) as duration_minutes
    from jsonb_to_recordset(p_schedules) as x("dayOfWeek" text, "startTime" text, "durationMinutes" integer, "platform" text, "meetingLink" text)
  )
  select a.day_of_week, a.start_time, a.duration_minutes, b.start_time as conflict_start_time, b.duration_minutes as conflict_duration_minutes
  into v_internal_conflict
  from parsed a
  join parsed b on b.row_number > a.row_number
  where public.weekday_index(a.day_of_week) = public.weekday_index(b.day_of_week)
    and public.time_overlaps(a.start_time, a.duration_minutes, b.start_time, b.duration_minutes)
  limit 1;

  if v_internal_conflict.day_of_week is not null then
    raise exception 'Student schedule contains overlapping classes from % to % on %.',
      to_char(v_internal_conflict.start_time, 'HH24:MI'),
      to_char(v_internal_conflict.start_time + make_interval(mins => coalesce(v_internal_conflict.duration_minutes, 30)), 'HH24:MI'),
      v_internal_conflict.day_of_week;
  end if;

  for v_schedule in
    select
      x."dayOfWeek" as day_of_week,
      x."startTime"::time as start_time,
      greatest(coalesce(x."durationMinutes", 30), 1) as duration_minutes,
      x."platform" as platform,
      x."meetingLink" as meeting_link
    from jsonb_to_recordset(p_schedules) as x("dayOfWeek" text, "startTime" text, "durationMinutes" integer, "platform" text, "meetingLink" text)
  loop
    perform public.assert_schedule_slot_available(
      p_student_id,
      p_teacher_profile_id,
      v_schedule.day_of_week,
      v_schedule.start_time,
      v_schedule.duration_minutes
    );
  end loop;

  select array_agg(id) into v_old_schedule_ids
  from public.class_schedules
  where student_id = p_student_id
    and status = 'active';

  update public.class_schedules
  set status = 'archived',
      updated_at = now()
  where student_id = p_student_id
    and status = 'active';

  if coalesce(array_length(v_old_schedule_ids, 1), 0) > 0 then
    update public.classes
    set status = 'rescheduled',
        updated_at = now()
    where schedule_id = any(v_old_schedule_ids)
      and class_date >= current_date
      and status = 'scheduled';
  end if;

  insert into public.class_schedules (
    student_id,
    program_id,
    teacher_profile_id,
    day_of_week,
    start_time,
    duration_minutes,
    timezone,
    platform,
    meeting_link,
    status
  )
  select
    p_student_id,
    p_program_id,
    p_teacher_profile_id,
    x."dayOfWeek",
    x."startTime"::time,
    greatest(coalesce(x."durationMinutes", 30), 1),
    coalesce(nullif(p_timezone, ''), 'Africa/Cairo'),
    coalesce(nullif(x."platform", ''), 'Zoom'),
    nullif(x."meetingLink", ''),
    'active'
  from jsonb_to_recordset(p_schedules) as x("dayOfWeek" text, "startTime" text, "durationMinutes" integer, "platform" text, "meetingLink" text);

  update public.students
  set program_id = p_program_id,
      assigned_teacher_id = v_teacher_id,
      timezone = coalesce(nullif(p_timezone, ''), timezone, 'Africa/Cairo'),
      updated_at = now()
  where id = p_student_id;

  v_materialized := public.materialize_scheduled_classes(p_from_date, p_to_date);
  return v_materialized;
end;
$$;

create or replace function public.class_scheduled_start_at(p_class public.classes)
returns timestamptz
language sql
stable
as $$
  select (
    p_class.class_date::timestamp + coalesce(p_class.start_time, '00:00'::time)
  ) at time zone coalesce(
    p_class.timezone,
    (select cs.timezone from public.class_schedules cs where cs.id = p_class.schedule_id),
    'Africa/Cairo'
  );
$$;

create or replace function public.update_teacher_class_lifecycle(
  p_class_id uuid,
  p_action text,
  p_notes text default null,
  p_scheduled_start_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid;
  v_class public.classes%rowtype;
  v_status text;
  v_scheduled_start_at timestamptz;
begin
  v_teacher_id := public.current_teacher_id();

  if v_teacher_id is null then
    raise exception 'Teacher session is required before class check-in.';
  end if;

  select * into v_class
  from public.classes
  where id = p_class_id
    and teacher_id = v_teacher_id;

  if v_class.id is null then
    raise exception 'A valid assigned concrete class record is required before class check-in.';
  end if;

  if v_class.status = 'cancelled' then
    raise exception 'Cancelled classes cannot be started or ended.';
  end if;

  if p_action not in ('ready', 'joined', 'live', 'completed') then
    raise exception 'Unsupported class lifecycle action: %.', p_action;
  end if;

  v_scheduled_start_at := coalesce(p_scheduled_start_at, public.class_scheduled_start_at(v_class));
  v_status := p_action;

  insert into public.teacher_session_checkins (
    class_id,
    teacher_id,
    scheduled_start_at,
    ready_at,
    joined_at,
    started_at,
    ended_at,
    status,
    notes
  )
  values (
    v_class.id,
    v_teacher_id,
    v_scheduled_start_at,
    case when p_action = 'ready' then now() else null end,
    case when p_action = 'joined' then now() else null end,
    case when p_action = 'live' then now() else null end,
    case when p_action = 'completed' then now() else null end,
    v_status,
    p_notes
  )
  on conflict (class_id, teacher_id) do update
    set ready_at = coalesce(public.teacher_session_checkins.ready_at, excluded.ready_at),
        joined_at = coalesce(public.teacher_session_checkins.joined_at, excluded.joined_at),
        started_at = coalesce(public.teacher_session_checkins.started_at, excluded.started_at),
        ended_at = coalesce(public.teacher_session_checkins.ended_at, excluded.ended_at),
        status = excluded.status,
        notes = coalesce(excluded.notes, public.teacher_session_checkins.notes),
        updated_at = now();

  if p_action = 'live' then
    update public.classes
    set status = 'live',
        updated_at = now()
    where id = v_class.id
      and status in ('scheduled', 'rescheduled');
  elsif p_action = 'completed' then
    update public.classes
    set status = 'completed',
        updated_at = now()
    where id = v_class.id
      and status in ('scheduled', 'rescheduled', 'live');
  end if;

  select * into v_class from public.classes where id = p_class_id;

  return jsonb_build_object(
    'classId', v_class.id,
    'classStatus', v_class.status,
    'checkinStatus', v_status
  );
end;
$$;

grant execute on function public.materialize_scheduled_classes(date, date) to authenticated;
grant execute on function public.replace_student_class_schedules(uuid, uuid, uuid, text, jsonb, date, date) to authenticated;
grant execute on function public.update_teacher_class_lifecycle(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.mark_message_read(uuid) to authenticated;
grant execute on function public.mark_all_messages_read() to authenticated;

comment on table public.homework_assignments is 'Teacher-created homework assignments. Submissions are stored separately in homework_submissions.';
comment on column public.classes.schedule_id is 'Recurring schedule source for materialized concrete class occurrences.';
comment on column public.classes.next_lesson_plan is 'Teacher report field for the planned next lesson; separate from homework instructions.';
