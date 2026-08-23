create table if not exists public.payment_packages (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete set null,
  name text not null,
  sessions_count integer check (sessions_count is null or sessions_count >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  amount numeric(10,2) check (amount is null or amount >= 0),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists timezone text,
  add column if not exists preferred_contact_method text;

update public.profiles
set preferred_contact_method = 'academy_messages'
where lower(coalesce(preferred_contact_method, '')) in ('academy messages', 'academy_messages');

alter table public.payments
  add column if not exists package_id uuid references public.payment_packages(id) on delete set null,
  add column if not exists sessions_included integer check (sessions_included is null or sessions_included >= 0),
  add column if not exists sessions_remaining integer check (sessions_remaining is null or sessions_remaining >= 0),
  add column if not exists receipt_url text,
  add column if not exists receipt_file_path text;

comment on column public.payments.sessions_included is 'Snapshot-style payment field: sessions purchased/included at the time of payment.';
comment on column public.payments.sessions_remaining is 'Snapshot-style payment field: sessions remaining for this payment record. Do not fabricate this value in frontend code.';
comment on column public.payments.receipt_file_path is 'Canonical Supabase Storage object path for uploaded payment receipts.';
comment on column public.payments.receipt_url is 'Permanent external receipt URL only. Do not store temporary signed URLs here.';

create index if not exists payment_packages_program_id_idx on public.payment_packages(program_id);
create index if not exists payments_package_id_idx on public.payments(package_id);
create index if not exists payments_next_due_date_idx on public.payments(next_due_date);

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select class_id, student_id
    from public.attendance
    where class_id is not null
      and student_id is not null
    group by class_id, student_id
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot add attendance_class_student_unique: % duplicate class/student attendance key(s) exist. Resolve duplicates before running this migration.', duplicate_count;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'attendance_class_student_unique'
      and conrelid = 'public.attendance'::regclass
  ) then
    alter table public.attendance
      add constraint attendance_class_student_unique unique (class_id, student_id);
  end if;
end $$;

do $$
declare
  duplicate_count integer;
begin
  select count(*) into duplicate_count
  from (
    select class_id, student_id, teacher_id
    from public.evaluations
    where class_id is not null
      and student_id is not null
      and teacher_id is not null
    group by class_id, student_id, teacher_id
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception 'Cannot add evaluations_class_student_teacher_unique: % duplicate class/student/teacher evaluation key(s) exist. Resolve duplicates before running this migration.', duplicate_count;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'evaluations_class_student_teacher_unique'
      and conrelid = 'public.evaluations'::regclass
  ) then
    alter table public.evaluations
      add constraint evaluations_class_student_teacher_unique unique (class_id, student_id, teacher_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_sessions_remaining_lte_included'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_sessions_remaining_lte_included
      check (
        sessions_included is null
        or sessions_remaining is null
        or sessions_remaining <= sessions_included
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_currency_iso_3_uppercase'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_currency_iso_3_uppercase
      check (currency is null or currency ~ '^[A-Z]{3}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_packages_currency_iso_3_uppercase'
      and conrelid = 'public.payment_packages'::regclass
  ) then
    alter table public.payment_packages
      add constraint payment_packages_currency_iso_3_uppercase
      check (currency is null or currency ~ '^[A-Z]{3}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_contact_method_supported'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_preferred_contact_method_supported
      check (
        preferred_contact_method is null
        or lower(preferred_contact_method) in (
          'academy_messages',
          'whatsapp',
          'email',
          'phone'
        )
      );
  end if;
end $$;

alter table public.payment_packages enable row level security;

drop policy if exists "Authenticated users can read payment packages" on public.payment_packages;
create policy "Authenticated users can read payment packages" on public.payment_packages
  for select using (auth.role() = 'authenticated');

drop policy if exists "Finance admin roles can manage payment packages" on public.payment_packages;
create policy "Finance admin roles can manage payment packages" on public.payment_packages
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'finance'))
  with check (public.get_current_user_role() in ('super_admin', 'admin', 'finance'));

drop trigger if exists payment_packages_set_updated_at on public.payment_packages;
create trigger payment_packages_set_updated_at
before update on public.payment_packages
for each row execute function public.set_updated_at();

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

drop policy if exists "Teachers can view assigned attendance" on public.attendance;
create policy "Teachers can view assigned attendance" on public.attendance
  for select using (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = attendance.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers can insert attendance for assigned classes" on public.attendance;
create policy "Teachers can insert attendance for assigned classes" on public.attendance
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = attendance.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers can update attendance for assigned classes" on public.attendance;
create policy "Teachers can update attendance for assigned classes" on public.attendance
  for update using (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = attendance.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  ) with check (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = attendance.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers can view assigned evaluations" on public.evaluations;
create policy "Teachers can view assigned evaluations" on public.evaluations
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers can insert evaluations for assigned students" on public.evaluations;
create policy "Teachers can insert evaluations for assigned students" on public.evaluations
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = evaluations.class_id
        and c.teacher_id = public.current_teacher_id()
    )
    and exists (
      select 1 from public.students s
      where s.id = evaluations.student_id
        and s.assigned_teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers can update assigned evaluations" on public.evaluations;
create policy "Teachers can update assigned evaluations" on public.evaluations
  for update using (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = evaluations.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  ) with check (
    teacher_id = public.current_teacher_id()
    and exists (
      select 1 from public.classes c
      where c.id = evaluations.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers can view assigned homework submissions" on public.homework_submissions;
create policy "Teachers can view assigned homework submissions" on public.homework_submissions
  for select using (
    exists (
      select 1 from public.classes c
      where c.id = homework_submissions.class_id
        and c.teacher_id = public.current_teacher_id()
    )
  );

drop policy if exists "Teachers view own checkins" on public.teacher_session_checkins;
create policy "Teachers view own checkins" on public.teacher_session_checkins
  for select using (teacher_id = public.current_teacher_id());

drop policy if exists "Teachers create assigned class checkins" on public.teacher_session_checkins;
create policy "Teachers create assigned class checkins" on public.teacher_session_checkins
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  );

drop policy if exists "Teachers update own assigned class checkins" on public.teacher_session_checkins;
create policy "Teachers update own assigned class checkins" on public.teacher_session_checkins
  for update using (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  ) with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.classes c where c.id = teacher_session_checkins.class_id and c.teacher_id = public.current_teacher_id())
  );
