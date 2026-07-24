alter table public.leads
  add column if not exists assigned_teacher_id uuid references public.profiles(id),
  add column if not exists lead_priority text default 'normal',
  add column if not exists lost_reason text,
  add column if not exists converted_student_id uuid references public.students(id);

create table if not exists public.lead_activity_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  action_type text not null,
  description text,
  old_value text,
  new_value text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

create index if not exists leads_assigned_teacher_id_idx on public.leads(assigned_teacher_id);
create index if not exists leads_next_follow_up_at_idx on public.leads(next_follow_up_at);
create index if not exists leads_lead_priority_idx on public.leads(lead_priority);
create index if not exists lead_activity_logs_lead_id_idx on public.lead_activity_logs(lead_id);

alter table public.lead_activity_logs enable row level security;

drop policy if exists "Admin admissions academic roles manage leads" on public.leads;
create policy "Admin admissions academic roles manage leads" on public.leads
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'admissions', 'academic_manager'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'admissions', 'academic_manager'));

drop policy if exists "Teachers can view assigned leads" on public.leads;
create policy "Teachers can view assigned leads" on public.leads
  for select using (assigned_teacher_id = auth.uid());

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
        and l.assigned_teacher_id = auth.uid()
    )
  );

drop policy if exists "Teachers can insert assigned trial activity" on public.lead_activity_logs;
create policy "Teachers can insert assigned trial activity" on public.lead_activity_logs
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = lead_activity_logs.lead_id
        and l.assigned_teacher_id = auth.uid()
    )
  );

drop policy if exists "Teachers can update assigned free trials" on public.free_trials;
create policy "Teachers can update assigned free trials" on public.free_trials
  for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
