insert into storage.buckets (id, name, public)
values ('homework-submissions', 'homework-submissions', false)
on conflict (id) do update set
  public = false;

alter table public.homework_submissions
  add column if not exists uploaded_by uuid references auth.users(id);

create index if not exists homework_submissions_uploaded_by_idx
  on public.homework_submissions(uploaded_by);

drop policy if exists "Students upload own homework files" on storage.objects;
drop policy if exists "Students view own homework files" on storage.objects;
drop policy if exists "Teachers view assigned homework files" on storage.objects;
drop policy if exists "Authenticated users upload own homework files" on storage.objects;
drop policy if exists "Authenticated users view own homework files" on storage.objects;

create policy "Authenticated users upload own homework files" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'homework-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated users view own homework files" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'homework-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Students can submit homework" on public.homework_submissions;
drop policy if exists "Students can view own homework submissions" on public.homework_submissions;
drop policy if exists "Authenticated users insert own homework submissions" on public.homework_submissions;
drop policy if exists "Authenticated users view own homework submissions" on public.homework_submissions;

create policy "Authenticated users insert own homework submissions" on public.homework_submissions
  for insert
  to authenticated
  with check (uploaded_by = auth.uid());

create policy "Authenticated users view own homework submissions" on public.homework_submissions
  for select
  to authenticated
  using (uploaded_by = auth.uid());
