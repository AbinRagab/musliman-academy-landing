alter table public.programs enable row level security;

drop policy if exists "Authenticated users can read programs" on public.programs;
create policy "Authenticated users can read programs"
on public.programs
for select
to authenticated
using (
  status is null
  or status = 'active'
);

drop policy if exists "Public can read active programs" on public.programs;
create policy "Public can read active programs"
on public.programs
for select
to anon
using (
  status is null
  or status = 'active'
);
