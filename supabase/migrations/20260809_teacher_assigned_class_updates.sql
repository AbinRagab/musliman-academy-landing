alter table public.classes enable row level security;

drop policy if exists "Teachers can update assigned classes" on public.classes;

create policy "Teachers can update assigned classes"
on public.classes
for update
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());
