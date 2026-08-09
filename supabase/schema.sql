create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('super_admin', 'admin', 'admissions', 'academic_manager', 'teacher', 'student', 'finance', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_status as enum ('active', 'inactive', 'pending', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lead_status as enum ('new', 'contacted', 'no_response', 'trial_scheduled', 'trial_completed', 'enrolled', 'lost', 'follow_up_later');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.trial_status as enum ('scheduled', 'completed', 'no_show', 'rescheduled', 'converted', 'not_converted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.class_status as enum ('scheduled', 'completed', 'cancelled', 'rescheduled', 'student_absent', 'teacher_absent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'late', 'excused', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('paid', 'pending', 'overdue', 'refunded', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.program_type as enum ('quran', 'arabic', 'tajweed', 'islamic_studies', 'children_values', 'teacher_training');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  phone text,
  role public.user_role not null,
  status public.user_status not null default 'active',
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.user_role not null,
  permission_key text references public.permissions(key) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (role, permission_key)
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  program_type public.program_type,
  status text default 'active',
  created_at timestamp with time zone default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text,
  country text,
  student_age text,
  program_id uuid references public.programs(id),
  program_name text,
  preferred_time text,
  message text,
  source text,
  form_type text,
  lead_type text default 'student',
  status public.lead_status default 'new',
  assigned_to uuid references public.profiles(id),
  last_contact_at timestamp with time zone,
  next_follow_up_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  lead_id uuid references public.leads(id),
  student_name text not null,
  parent_name text,
  whatsapp text,
  country text,
  age text,
  program_id uuid references public.programs(id),
  level text,
  assigned_teacher_id uuid,
  schedule_notes text,
  start_date date,
  status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  full_name text not null,
  gender text,
  specialization text,
  languages text[],
  hourly_rate numeric,
  availability text,
  status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.free_trials (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id),
  student_id uuid references public.students(id),
  teacher_id uuid references public.teachers(id),
  program_id uuid references public.programs(id),
  trial_date date,
  trial_time time,
  meeting_link text,
  status public.trial_status default 'scheduled',
  teacher_feedback text,
  parent_feedback text,
  result text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  teacher_id uuid references public.teachers(id),
  program_id uuid references public.programs(id),
  class_date date not null,
  start_time time,
  end_time time,
  duration_minutes int default 30,
  meeting_link text,
  lesson_title text,
  lesson_covered text,
  homework text,
  status public.class_status default 'scheduled',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  student_id uuid references public.students(id),
  teacher_id uuid references public.teachers(id),
  status public.attendance_status not null,
  notes text,
  marked_by uuid references public.profiles(id),
  marked_at timestamp with time zone default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  teacher_id uuid references public.teachers(id),
  class_id uuid references public.classes(id),
  recitation_rating int check (recitation_rating between 1 and 5),
  tajweed_rating int check (tajweed_rating between 1 and 5),
  understanding_rating int check (understanding_rating between 1 and 5),
  behavior_rating int check (behavior_rating between 1 and 5),
  progress_feedback text,
  teacher_notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  program_id uuid references public.programs(id),
  currency text default 'USD',
  amount numeric not null,
  payment_method text,
  payment_date date,
  next_due_date date,
  status public.payment_status default 'pending',
  teacher_cost numeric,
  net_revenue numeric,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  subject text,
  body text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  class_id uuid references public.classes(id),
  uploaded_by uuid references auth.users(id),
  file_url text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  notes text,
  status text default 'submitted',
  teacher_feedback text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.students drop constraint if exists students_assigned_teacher_id_fkey;
alter table public.students
  add constraint students_assigned_teacher_id_fkey
  foreign key (assigned_teacher_id) references public.teachers(id);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_assigned_to_idx on public.leads(assigned_to);
create index if not exists leads_lead_type_idx on public.leads(lead_type);
create index if not exists leads_form_type_idx on public.leads(form_type);
create index if not exists students_profile_id_idx on public.students(profile_id);
create index if not exists students_assigned_teacher_id_idx on public.students(assigned_teacher_id);
create index if not exists classes_student_id_idx on public.classes(student_id);
create index if not exists classes_teacher_id_idx on public.classes(teacher_id);
create index if not exists attendance_student_id_idx on public.attendance(student_id);
create index if not exists evaluations_student_id_idx on public.evaluations(student_id);
create index if not exists payments_student_id_idx on public.payments(student_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_receiver_id_idx on public.messages(receiver_id);
create index if not exists homework_submissions_class_id_idx on public.homework_submissions(class_id);
create index if not exists homework_submissions_file_path_idx on public.homework_submissions(file_path);
create index if not exists homework_submissions_uploaded_by_idx on public.homework_submissions(uploaded_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();

drop trigger if exists teachers_set_updated_at on public.teachers;
create trigger teachers_set_updated_at before update on public.teachers for each row execute function public.set_updated_at();

drop trigger if exists free_trials_set_updated_at on public.free_trials;
create trigger free_trials_set_updated_at before update on public.free_trials for each row execute function public.set_updated_at();

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();

drop trigger if exists homework_submissions_set_updated_at on public.homework_submissions;
create trigger homework_submissions_set_updated_at before update on public.homework_submissions for each row execute function public.set_updated_at();

create or replace function public.get_current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.teachers where profile_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'), false);
$$;

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.role_permissions rp
      where rp.role = public.get_current_user_role()
        and rp.permission_key = has_permission.permission_key
    ),
    false
  );
$$;

alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.leads enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.free_trials enable row level security;
alter table public.classes enable row level security;
alter table public.attendance enable row level security;
alter table public.evaluations enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;
alter table public.homework_submissions enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Admin roles can view all profiles" on public.profiles;
create policy "Admin roles can view all profiles" on public.profiles
  for select using (public.is_admin_role());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Super admins can manage profiles" on public.profiles;
create policy "Super admins can manage profiles" on public.profiles
  for all using (public.get_current_user_role() in ('super_admin', 'admin')) with check (public.get_current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Authenticated users can read programs" on public.programs;
create policy "Authenticated users can read programs" on public.programs
  for select to authenticated using (status is null or status = 'active');

drop policy if exists "Public can read active programs" on public.programs;
create policy "Public can read active programs" on public.programs
  for select to anon using (status is null or status = 'active');

drop policy if exists "Admin admissions can manage leads" on public.leads;
create policy "Admin admissions can manage leads" on public.leads
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'admissions')) with check (public.get_current_user_role() in ('super_admin', 'admin', 'admissions'));

drop policy if exists "Students can view their own student record" on public.students;
create policy "Students can view their own student record" on public.students
  for select using (profile_id = auth.uid());

drop policy if exists "Teachers can view students assigned to them" on public.students;
create policy "Teachers can view students assigned to them" on public.students
  for select using (assigned_teacher_id = public.current_teacher_id() or assigned_teacher_id = auth.uid());

drop policy if exists "Admin roles can view all students" on public.students;
create policy "Admin roles can view all students" on public.students
  for select using (public.is_admin_role());

drop policy if exists "Admin academic roles can manage students" on public.students;
create policy "Admin academic roles can manage students" on public.students
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager')) with check (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'));

drop policy if exists "Admin roles can update student teacher assignments" on public.students;
create policy "Admin roles can update student teacher assignments" on public.students
  for update using (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions')) with check (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager', 'admissions'));

drop policy if exists "Teachers can view own teacher record" on public.teachers;
create policy "Teachers can view own teacher record" on public.teachers
  for select using (profile_id = auth.uid());

drop policy if exists "Admin roles can manage teachers" on public.teachers;
create policy "Admin roles can manage teachers" on public.teachers
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager')) with check (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'));

drop policy if exists "Admin admissions manage free trials" on public.free_trials;
create policy "Admin admissions manage free trials" on public.free_trials
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'admissions')) with check (public.get_current_user_role() in ('super_admin', 'admin', 'admissions'));

drop policy if exists "Teachers view assigned free trials" on public.free_trials;
create policy "Teachers view assigned free trials" on public.free_trials
  for select using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid());

drop policy if exists "Students can view their own classes" on public.classes;
create policy "Students can view their own classes" on public.classes
  for select using (exists (select 1 from public.students s where s.id = classes.student_id and s.profile_id = auth.uid()));

drop policy if exists "Teachers can view assigned classes" on public.classes;
create policy "Teachers can view assigned classes" on public.classes
  for select using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid());

drop policy if exists "Teachers can update assigned classes" on public.classes;
create policy "Teachers can update assigned classes" on public.classes
  for update using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid()) with check (teacher_id = public.current_teacher_id());

drop policy if exists "Admin roles can view all classes" on public.classes;
create policy "Admin roles can view all classes" on public.classes
  for select using (public.is_admin_role());

drop policy if exists "Admin academic roles can manage classes" on public.classes;
create policy "Admin academic roles can manage classes" on public.classes
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager')) with check (public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager'));

drop policy if exists "Students can view their own attendance" on public.attendance;
create policy "Students can view their own attendance" on public.attendance
  for select using (exists (select 1 from public.students s where s.id = attendance.student_id and s.profile_id = auth.uid()));

drop policy if exists "Teachers can view assigned attendance" on public.attendance;
create policy "Teachers can view assigned attendance" on public.attendance
  for select using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid());

drop policy if exists "Teachers can insert attendance for assigned classes" on public.attendance;
create policy "Teachers can insert attendance for assigned classes" on public.attendance
  for insert with check (teacher_id = public.current_teacher_id() and exists (select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = public.current_teacher_id()));

drop policy if exists "Teachers can update attendance for assigned classes" on public.attendance;
create policy "Teachers can update attendance for assigned classes" on public.attendance
  for update using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid()) with check (teacher_id = public.current_teacher_id());

drop policy if exists "Admin roles can manage all attendance" on public.attendance;
create policy "Admin roles can manage all attendance" on public.attendance
  for all using (public.is_admin_role()) with check (public.is_admin_role());

drop policy if exists "Students can view their own evaluations" on public.evaluations;
create policy "Students can view their own evaluations" on public.evaluations
  for select using (exists (select 1 from public.students s where s.id = evaluations.student_id and s.profile_id = auth.uid()));

drop policy if exists "Teachers can view assigned evaluations" on public.evaluations;
create policy "Teachers can view assigned evaluations" on public.evaluations
  for select using (teacher_id = public.current_teacher_id() or teacher_id = auth.uid());

drop policy if exists "Teachers can insert evaluations for assigned students" on public.evaluations;
create policy "Teachers can insert evaluations for assigned students" on public.evaluations
  for insert with check (
    teacher_id = public.current_teacher_id()
    and exists (select 1 from public.students s where s.id = evaluations.student_id and s.assigned_teacher_id = public.current_teacher_id())
  );

drop policy if exists "Admin roles can manage all evaluations" on public.evaluations;
create policy "Admin roles can manage all evaluations" on public.evaluations
  for all using (public.is_admin_role()) with check (public.is_admin_role());

drop policy if exists "Students can view their own payment status" on public.payments;
create policy "Students can view their own payment status" on public.payments
  for select using (exists (select 1 from public.students s where s.id = payments.student_id and s.profile_id = auth.uid()));

drop policy if exists "Finance admin roles can manage payments" on public.payments;
create policy "Finance admin roles can manage payments" on public.payments
  for all using (public.get_current_user_role() in ('super_admin', 'admin', 'finance')) with check (public.get_current_user_role() in ('super_admin', 'admin', 'finance'));

drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages" on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages" on public.messages
  for insert with check (sender_id = auth.uid());

drop policy if exists "Students can view own homework submissions" on public.homework_submissions;
drop policy if exists "Authenticated users view own homework submissions" on public.homework_submissions;
create policy "Authenticated users view own homework submissions" on public.homework_submissions
  for select to authenticated using (uploaded_by = auth.uid());

drop policy if exists "Teachers can view assigned homework submissions" on public.homework_submissions;
create policy "Teachers can view assigned homework submissions" on public.homework_submissions
  for select using (exists (select 1 from public.classes c where c.id = homework_submissions.class_id and (c.teacher_id = public.current_teacher_id() or c.teacher_id = auth.uid())));

drop policy if exists "Students can submit homework" on public.homework_submissions;
drop policy if exists "Authenticated users insert own homework submissions" on public.homework_submissions;
create policy "Authenticated users insert own homework submissions" on public.homework_submissions
  for insert to authenticated with check (uploaded_by = auth.uid());

drop policy if exists "Admin roles can manage homework submissions" on public.homework_submissions;
create policy "Admin roles can manage homework submissions" on public.homework_submissions
  for all using (public.is_admin_role()) with check (public.is_admin_role());
