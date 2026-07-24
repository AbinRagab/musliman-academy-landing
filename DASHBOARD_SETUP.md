# Musliman Academy Dashboard Supabase Setup

## 1. Create a Supabase project

Create a new Supabase project from the Supabase dashboard. Keep the database password somewhere secure. Do not put the service role key in the frontend project.

## 2. Add local environment variables

Create a local `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Only use the anon key in Vite frontend code. Keep real `.env` values out of git.

## 3. Run the schema

Open Supabase SQL Editor and run:

```sql
-- Paste and run supabase/schema.sql
```

This creates enums, tables, indexes, helper functions, triggers, and Row Level Security policies.

## 4. Run seed data

After the schema succeeds, run:

```sql
-- Paste and run supabase/seed.sql
```

This seeds permissions, role permissions, and academy programs.

## 4.1. Run CRM pipeline migration

After the base schema and seed are complete, run the leads CRM migration:

```sql
-- Paste and run supabase/migrations/20260724_leads_crm_pipeline.sql
```

This adds lead teacher assignment, priority/lost/converted fields, lead activity logs, and RLS policies for admin/admissions/teacher lead access.

Then run the public lead classification migration:

```sql
-- Paste and run supabase/migrations/20260724_public_lead_types.sql
```

This adds `lead_type` and `program_name` to `public.leads` so public website submissions can be clearly separated as student free trial leads or teacher training applications.

## 5. Create the first admin user

In Supabase Authentication, create the first user manually with email and password.

Then insert a matching profile row using that auth user UUID:

```sql
insert into public.profiles (id, full_name, email, role, status)
values (
  'AUTH_USER_UUID_FROM_SUPABASE',
  'Musliman Super Admin',
  'admin@muslimanacademy.com',
  'super_admin',
  'active'
);
```

Use the exact UUID from `auth.users`.

## 6. Test login

Start the app locally:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/dashboard/login
```

Sign in with the Supabase Auth email and password. The app reads `public.profiles` and redirects by role:

- `super_admin`, `admin`, `admissions`, `academic_manager`, `viewer` -> `/dashboard/admin`
- `finance` -> `/dashboard/admin/payments`
- `teacher` -> `/dashboard/teacher`
- `student` -> `/dashboard/student`

## 7. Add Vercel environment variables

In Vercel, open Project Settings -> Environment Variables and add:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Redeploy after adding or changing environment variables.

## 8. Deploy create-user Edge Function

The dashboard creates Auth users through `supabase/functions/create-user/index.ts`. The frontend never receives the service role key.

Install the Supabase CLI if needed:

```bash
npm install -g supabase
```

Log in and link the project:

```bash
supabase login
supabase link --project-ref your-project-ref
```

Supabase Edge Functions automatically provide these reserved environment variables at runtime:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not set these with `supabase secrets set`; the Supabase CLI rejects reserved `SUPABASE_` secret names. The Edge Functions read the default values directly with `Deno.env.get(...)`.

Deploy the account creation function:

```bash
npx supabase functions deploy create-user
```

Deploy the public website lead submission function:

```bash
npx supabase functions deploy submit-lead
```

The `submit-lead` function is required for public website forms. It creates CRM leads with:

- `form_type = free_trial` and `lead_type = student` for Book a Free Trial.
- `form_type = teacher_training` and `lead_type = teacher_training` for Teacher Training.
- `source = website` by default.

The frontend must only use:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not add `SUPABASE_SERVICE_ROLE_KEY` to Vercel frontend environment variables.

Test from the dashboard:

1. Sign in at `/dashboard/login` as a `super_admin` or `admin`.
2. Open `/dashboard/admin/accounts`.
3. Use the Create New Account panel to create a teacher, student, admin, admissions, academic manager, finance, or viewer account.
4. Confirm the user appears in Supabase Authentication and `public.profiles`.
5. For teacher accounts, confirm a row appears in `public.teachers`.
6. For student accounts, confirm a row appears in `public.students`.

Test website lead capture:

1. Submit the public website free trial form.
2. Confirm the lead appears in `public.leads` with `status = 'new'`.
3. Confirm a `created` entry appears in `public.lead_activity_logs`.
4. Confirm the existing Google Sheet backup still receives the lead if the Apps Script endpoint is available.

## Notes

- The dashboard currently uses Supabase for authentication and profile/role loading.
- The Accounts & Roles page uses real `public.profiles` data.
- Other dashboard tables still use mock UI data in this phase.
- The frontend never uses the Supabase service role key.
- The service role key is only used as an Edge Function secret.
- RLS is enabled on CRM tables to enforce role-based access at the database layer.
