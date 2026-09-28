-- Keep database authorization aligned with the dashboard role matrix.
-- UI route guards improve UX, while these policies remain the security boundary.

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists "Admins can read permissions" on public.permissions;
create policy "Admins can read permissions" on public.permissions
  for select to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Admins can manage permissions" on public.permissions;
create policy "Admins can manage permissions" on public.permissions
  for all to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin'))
  with check (public.get_current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Admins can read role permissions" on public.role_permissions;
create policy "Admins can read role permissions" on public.role_permissions
  for select to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Admins can manage role permissions" on public.role_permissions;
create policy "Admins can manage role permissions" on public.role_permissions
  for all to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin'))
  with check (public.get_current_user_role() in ('super_admin', 'admin'));

-- Admissions is limited to CRM and free-trial workflows.
drop policy if exists "Admin admissions can manage leads" on public.leads;
drop policy if exists "Admin admissions academic roles manage leads" on public.leads;
create policy "Admin admissions manage leads" on public.leads
  for all to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin', 'admissions'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'admissions'));

drop policy if exists "Admin admissions academic roles manage lead activity" on public.lead_activity_logs;
create policy "Admin admissions manage lead activity" on public.lead_activity_logs
  for all to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin', 'admissions'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'admissions'));

drop policy if exists "Admin roles can update student teacher assignments" on public.students;
create policy "Academic roles can update student teacher assignments" on public.students
  for update to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'));

drop policy if exists "Admin academic roles can manage class schedules" on public.class_schedules;
create policy "Academic roles can manage class schedules" on public.class_schedules
  for all to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'));

-- Match stored defaults to the restricted admissions role.
delete from public.role_permissions
where role = 'admissions'
  and permission_key in ('manage_students', 'view_reports');

insert into public.role_permissions (role, permission_key)
values ('admissions', 'manage_free_trials')
on conflict (role, permission_key) do nothing;

-- System settings are reserved for full administrators.
drop policy if exists "Admins manage academy settings" on public.academy_settings;
create policy "Full admins manage academy settings" on public.academy_settings
  for all to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin'))
  with check (public.get_current_user_role() in ('super_admin', 'admin'));

-- Payment session administration belongs to finance and full administrators.
drop policy if exists "Admins manage payment session usage" on public.payment_session_usage;
create policy "Finance roles manage payment session usage" on public.payment_session_usage
  for all to authenticated
  using (public.get_current_user_role() in ('super_admin', 'admin', 'finance'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'finance'));
