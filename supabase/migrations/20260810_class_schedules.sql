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

create index if not exists class_schedules_student_id_idx on public.class_schedules(student_id);
create index if not exists class_schedules_teacher_profile_id_idx on public.class_schedules(teacher_profile_id);
create index if not exists class_schedules_status_idx on public.class_schedules(status);

drop trigger if exists class_schedules_set_updated_at on public.class_schedules;
create trigger class_schedules_set_updated_at
before update on public.class_schedules
for each row execute function public.set_updated_at();

alter table public.class_schedules enable row level security;

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
