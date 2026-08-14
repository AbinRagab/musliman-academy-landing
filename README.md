# Musliman Academy Platform

Musliman Academy Platform is a single React and Vite application for the academy's public website and authenticated portals. The project now includes the multilingual landing website, Admin Dashboard, Teacher Portal, Student Portal, Supabase authentication, database integrations, storage-aware workflows, migrations, and Edge Functions.

The repository intentionally remains one application. Public URLs and dashboard routes are preserved while the source tree is organized by product area.

## Product areas

- Public multilingual landing website with RTL support, program content, testimonials, FAQs, WhatsApp entry points, and lead capture.
- Admin Dashboard for CRM leads, accounts and roles, students, teachers, classes, scheduling, attendance, payments, compliance, reports, and settings.
- Teacher Portal for assigned students, schedules, classes, attendance, evaluations, reports, messages, profile, and settings.
- Student Portal for dashboard overview, schedule, classes, free trial flow, attendance, homework, progress, messages, payments, profile, and settings.
- Supabase-backed authentication and role-based access control for admin, teacher, and student experiences.

## Supported languages

The public website supports English, Arabic, Spanish, German, Italian, Urdu, and Turkish. RTL behavior is preserved for RTL languages through the existing i18n setup.

## Architecture

```text
src/
  app/          Application shell, top-level routes, and providers
  landing/      Public website code, landing data, and lead services
  dashboard/    Auth, admin, teacher, student, shared dashboard components, layouts, services, styles
  shared/       Reusable UI primitives shared across product areas
  i18n/         Translation setup and resources
  lib/          Supabase client and external integration clients
  main.tsx      Vite entrypoint
```

Dashboard routes are lazy-loaded from the main app shell so the public landing page does not load the full dashboard bundle on first render.

## Environment variables

Create a local `.env` file with the required public Supabase values. Do not commit real credentials.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Supabase Edge Functions may require additional server-side secrets configured in Supabase, not in the frontend repository.

## Local setup

```bash
npm ci
npm run dev
```

## Quality commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

Use `npm run format` to apply Prettier formatting.

## Supabase setup

Use the files under `supabase/` for database schema, migrations, policies, and Edge Functions. The frontend expects the existing Supabase tables, RLS policies, and function names to remain compatible.

Current architecture work does not change the database schema or RLS policies.

## Deployment

Build the Vite app with:

```bash
npm run build
```

Deploy the generated `dist/` output to the existing hosting target. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the deployment environment. Supabase Edge Function secrets should be configured in Supabase.

## Security considerations

Known security findings are documented in `SECURITY_REVIEW.md`. Current priorities include tightening profile update policies, adding abuse protection to the public lead endpoint, validating homework ownership in RLS policies, and turning the base Supabase schema into a complete initial migration.

Recommended repository display name: `musliman-academy-platform`. The remote repository name has not been changed.
