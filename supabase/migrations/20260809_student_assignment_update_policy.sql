alter table if exists public.students
  add column if not exists assigned_teacher_id uuid;

alter table if exists public.students drop constraint if exists students_assigned_teacher_id_fkey;
alter table if exists public.students
  add constraint students_assigned_teacher_id_fkey
  foreign key (assigned_teacher_id) references public.teachers(id) not valid;

create index if not exists students_assigned_teacher_id_idx on public.students(assigned_teacher_id);

drop policy if exists "Admin roles can update student teacher assignments" on public.students;
create policy "Admin roles can update student teacher assignments"
on public.students
for update
to authenticated
using (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions'))
with check (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions'));
