alter table public.leads
  add column if not exists lead_type text default 'student',
  add column if not exists program_name text;

create index if not exists leads_lead_type_idx on public.leads(lead_type);
create index if not exists leads_form_type_idx on public.leads(form_type);
