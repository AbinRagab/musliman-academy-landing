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
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.homework_submissions
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size bigint;

create index if not exists homework_submissions_file_path_idx on public.homework_submissions(file_path);
create index if not exists homework_submissions_class_id_idx on public.homework_submissions(class_id);

drop policy if exists "Students can update own homework submission notes" on public.homework_submissions;
create policy "Students can update own homework submission notes" on public.homework_submissions
  for update using (
    exists (
      select 1 from public.students s
      where s.id = homework_submissions.student_id
        and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = homework_submissions.student_id
        and s.profile_id = auth.uid()
    )
  );

drop policy if exists "Teachers can add homework feedback" on public.homework_submissions;
create policy "Teachers can add homework feedback" on public.homework_submissions
  for update using (
    exists (
      select 1
      from public.classes c
      where c.id = homework_submissions.class_id
        and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.classes c
      where c.id = homework_submissions.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "Admins manage private academy files" on storage.objects;
create policy "Admins manage private academy files" on storage.objects
  for all using (
    bucket_id in ('homework-submissions', 'class-materials', 'payment-documents', 'teacher-documents', 'profile-images')
    and public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager')
  )
  with check (
    bucket_id in ('homework-submissions', 'class-materials', 'payment-documents', 'teacher-documents', 'profile-images')
    and public.get_current_user_role() in ('super_admin', 'admin', 'academic_manager')
  );

drop policy if exists "Students upload own homework files" on storage.objects;
create policy "Students upload own homework files" on storage.objects
  for insert with check (
    bucket_id = 'homework-submissions'
    and exists (
      select 1 from public.students s
      where s.id = (storage.foldername(name))[1]::uuid
        and s.profile_id = auth.uid()
    )
  );

drop policy if exists "Students view own homework files" on storage.objects;
create policy "Students view own homework files" on storage.objects
  for select using (
    bucket_id = 'homework-submissions'
    and exists (
      select 1 from public.students s
      where s.id = (storage.foldername(name))[1]::uuid
        and s.profile_id = auth.uid()
    )
  );

drop policy if exists "Teachers view assigned homework files" on storage.objects;
create policy "Teachers view assigned homework files" on storage.objects
  for select using (
    bucket_id = 'homework-submissions'
    and exists (
      select 1 from public.students s
      where s.id = (storage.foldername(name))[1]::uuid
        and s.assigned_teacher_id = auth.uid()
    )
  );

drop policy if exists "Teachers manage assigned class materials" on storage.objects;
create policy "Teachers manage assigned class materials" on storage.objects
  for all using (
    bucket_id = 'class-materials'
    and exists (
      select 1 from public.classes c
      where c.id = (storage.foldername(name))[1]::uuid
        and c.teacher_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'class-materials'
    and exists (
      select 1 from public.classes c
      where c.id = (storage.foldername(name))[1]::uuid
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "Finance views payment documents" on storage.objects;
create policy "Finance views payment documents" on storage.objects
  for select using (
    bucket_id = 'payment-documents'
    and public.get_current_user_role() in ('finance', 'super_admin', 'admin')
  );

drop policy if exists "Finance manages payment documents" on storage.objects;
create policy "Finance manages payment documents" on storage.objects
  for all using (
    bucket_id = 'payment-documents'
    and public.get_current_user_role() in ('finance', 'super_admin', 'admin')
  )
  with check (
    bucket_id = 'payment-documents'
    and public.get_current_user_role() in ('finance', 'super_admin', 'admin')
  );

drop policy if exists "Teachers manage own documents" on storage.objects;
create policy "Teachers manage own documents" on storage.objects
  for all using (
    bucket_id = 'teacher-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'teacher-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users manage own profile images" on storage.objects;
create policy "Users manage own profile images" on storage.objects
  for all using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
