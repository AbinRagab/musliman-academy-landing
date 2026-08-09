-- Reinforce stable teacher linking for teacher dashboards.
-- New writes use public.teachers.id. Legacy profile-id assignments remain readable only
-- by the matching teacher while this migration converts them.

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

alter table if exists public.students drop constraint if exists students_assigned_teacher_id_fkey;
alter table if exists public.leads drop constraint if exists leads_assigned_teacher_id_fkey;
alter table if exists public.free_trials drop constraint if exists free_trials_teacher_id_fkey;
alter table if exists public.classes drop constraint if exists classes_teacher_id_fkey;
alter table if exists public.attendance drop constraint if exists attendance_teacher_id_fkey;
alter table if exists public.evaluations drop constraint if exists evaluations_teacher_id_fkey;

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

drop policy if exists "Teachers can view students assigned to them" on public.students;
create policy "Teachers can view students assigned to them" on public.students
  for select using (assigned_teacher_id = public.current_teacher_id() or assigned_teacher_id = auth.uid());

drop policy if exists "Teachers can view assigned leads" on public.leads;
create policy "Teachers can view assigned leads" on public.leads
  for select using (assigned_teacher_id = public.current_teacher_id() or assigned_teacher_id = auth.uid());

drop policy if exists "Teachers view assigned free trials" on public.free_trials;
create policy "Teachers view assigned free trials" on public.free_trials
  for select using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid());

drop policy if exists "Teachers can update assigned free trials" on public.free_trials;
create policy "Teachers can update assigned free trials" on public.free_trials
  for update using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid()) with check (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can view assigned classes" on public.classes;
create policy "Teachers can view assigned classes" on public.classes
  for select using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid());

drop policy if exists "Teachers can update assigned classes" on public.classes;
create policy "Teachers can update assigned classes" on public.classes
  for update using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid()) with check (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can view assigned attendance" on public.attendance;
create policy "Teachers can view assigned attendance" on public.attendance
  for select using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid());

drop policy if exists "Teachers can insert attendance for assigned classes" on public.attendance;
create policy "Teachers can insert attendance for assigned classes" on public.attendance
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers can update attendance for assigned classes" on public.attendance;
create policy "Teachers can update attendance for assigned classes" on public.attendance
  for update using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid()) with check (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can view assigned evaluations" on public.evaluations;
create policy "Teachers can view assigned evaluations" on public.evaluations
  for select using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid());

drop policy if exists "Teachers can insert evaluations for assigned students" on public.evaluations;
create policy "Teachers can insert evaluations for assigned students" on public.evaluations
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.students s where s.id = evaluations.student_id and s.assigned_teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers can view assigned homework submissions" on public.homework_submissions;
create policy "Teachers can view assigned homework submissions" on public.homework_submissions
  for select using (
    exists (
      select 1
      from public.classes c
      where c.id = homework_submissions.class_id
        and (c.teacher_id = public.current_teacher_id() or c.teacher_id = auth.uid())
    )
  );
