-- Normalize operational teacher references to public.teachers.id.
-- public.profiles.id remains the Supabase Auth/profile id; teachers.profile_id links back to it.

insert into public.teachers (profile_id, full_name, status, created_at, updated_at)
select
  p.id,
  coalesce(nullif(p.full_name, ''), p.email, 'Teacher'),
  coalesce(p.status, 'active'),
  now(),
  now()
from public.profiles p
where p.role = 'teacher'
  and not exists (
    select 1
    from public.teachers t
    where t.profile_id = p.id
  );

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

drop policy if exists "Teachers can view students assigned to them" on public.students;
create policy "Teachers can view students assigned to them" on public.students
  for select using (assigned_teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can view assigned leads" on public.leads;
create policy "Teachers can view assigned leads" on public.leads
  for select using (assigned_teacher_id = public.current_teacher_id());

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
  for update using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can view assigned evaluations" on public.evaluations;
create policy "Teachers can view assigned evaluations" on public.evaluations
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can insert evaluations for assigned students" on public.evaluations;
create policy "Teachers can insert evaluations for assigned students" on public.evaluations
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.students s where s.id = evaluations.student_id and s.assigned_teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers can view assigned homework submissions" on public.homework_submissions;
create policy "Teachers can view assigned homework submissions" on public.homework_submissions
  for select using (exists (select 1 from public.classes c where c.id = homework_submissions.class_id and c.teacher_id = public.current_teacher_id()));

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

drop policy if exists "Teachers can view own checkins" on public.teacher_session_checkins;
create policy "Teachers can view own checkins" on public.teacher_session_checkins
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can insert own checkins" on public.teacher_session_checkins;
create policy "Teachers can insert own checkins" on public.teacher_session_checkins
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers can update own checkins" on public.teacher_session_checkins;
create policy "Teachers can update own checkins" on public.teacher_session_checkins
  for update using (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  )
  with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers can view own warnings" on public.teacher_warnings;
create policy "Teachers can view own warnings" on public.teacher_warnings
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers view assigned homework files" on storage.objects;
create policy "Teachers view assigned homework files" on storage.objects
  for select using (
    bucket_id = 'homework-submissions'
    and exists (
      select 1 from public.students s
      where s.id = (storage.foldername(name))[1]::uuid
        and s.assigned_teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers manage assigned class materials" on storage.objects;
create policy "Teachers manage assigned class materials" on storage.objects
  for all using (
    bucket_id = 'class-materials'
    and exists (
      select 1 from public.classes c
      where c.id = (storage.foldername(name))[1]::uuid
        and c.teacher_id = public.current_teacher_id()
    )
  )
  with check (
    bucket_id = 'class-materials'
    and exists (
      select 1 from public.classes c
      where c.id = (storage.foldername(name))[1]::uuid
        and c.teacher_id = public.current_teacher_id()
    )
  );
