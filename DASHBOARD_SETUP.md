# Musliman Academy Dashboard Setup

## Environment

Create `.env` in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Only the anon key belongs in the Vite frontend. Do not expose the Supabase service role key in local frontend env files, Vercel frontend env vars, or client code.

## Database Setup

For a fresh database, run `supabase/schema.sql` first, then `supabase/seed.sql`, then every migration in timestamp order:

```text
20260724_leads_crm_pipeline.sql
20260724_public_lead_types.sql
20260726_private_storage_uploads.sql
20260726_z_homework_upload_rls_fix.sql
20260729_notifications_compliance.sql
20260809_programs_read_policies.sql
20260809_student_assignment_update_policy.sql
20260809_teacher_assigned_class_updates.sql
20260809_teacher_assignment_linking_fix.sql
20260809_teacher_operational_ids.sql
20260810_class_schedules.sql
20260816_marketing_attribution_fields.sql
20260823095000_reconcile_dashboard_prerequisites.sql
20260823100000_dashboard_data_contract_cleanup.sql
20260823105000_class_status_live.sql
20260823110000_class_lifecycle_engine.sql
```

`schema.sql` is the baseline schema. Migrations are additive fixes and must not be skipped on an existing project.

## Existing Production Reconciliation

The current production Supabase database was found to be partially migrated: the base schema and `20260816_marketing_attribution_fields.sql` are already present, but Supabase migration history only records `20260816 marketing_attribution_fields` and several dashboard prerequisite objects are missing.

Do not replay all historical migrations against that production database. Instead, run the reconciliation migration first, then Phase 1:

```text
20260823095000_reconcile_dashboard_prerequisites.sql
20260823100000_dashboard_data_contract_cleanup.sql
20260823105000_class_status_live.sql
20260823110000_class_lifecycle_engine.sql
```

The reconciliation migration restores missing dashboard prerequisites without reapplying the 20260816 marketing attribution columns. It creates or reconciles lead CRM support objects, notification/compliance tables, `class_schedules`, `public.current_teacher_id()`, operational teacher-id foreign keys, indexes, triggers, and RLS policies required before Phase 1.

The reconciliation migration may abort intentionally if it finds ambiguous teacher mappings, unmappable teacher references, duplicate teacher profile links, duplicate notification keys, duplicate teacher check-ins, or duplicate teacher warning keys. Clean those records manually before retrying.

## Latest Phase 1 Migration

`20260823100000_dashboard_data_contract_cleanup.sql` adds:

- `profiles.timezone` and `profiles.preferred_contact_method`.
- Optional `payment_packages`.
- `payments.package_id`, `sessions_included`, `sessions_remaining`, `receipt_url`, and `receipt_file_path`.
- Unique constraints to prevent duplicate attendance and duplicate class/student/teacher evaluations.
- RLS cleanup so teacher operational tables use `public.current_teacher_id()`.

If the unique constraints fail because duplicate rows already exist, clean duplicate attendance/evaluation records and rerun the migration.

## Class Lifecycle Engine

Run `20260823105000_class_status_live.sql` before `20260823110000_class_lifecycle_engine.sql`.

The lifecycle migration adds:

- `classes.schedule_id` linking concrete class occurrences to recurring `class_schedules`.
- `classes_schedule_date_unique` to prevent duplicate materialized occurrences.
- `public.materialize_scheduled_classes(from_date, to_date)` for idempotent rolling class generation.
- `public.replace_student_class_schedules(...)` for atomic schedule replacement with teacher/student overlap validation.
- `public.update_teacher_class_lifecycle(...)` so Ready/Join/Start/End updates check-ins and class status together.
- `homework_assignments` so assigning homework is separate from student `homework_submissions`.
- `20260823120000_admin_operations_completion.sql` adds admin review/follow-up state, atomic trial conversion, one-off class reschedule/cancel RPCs, `academy_settings`, `payment_session_usage`, teacher profile fields, and a local notification-cycle cron function.

Recurring schedules remain the source of timetable rules. Attendance, reports, homework, evaluations, and teacher check-ins must use concrete `classes.id` rows.

## Payment Session Consumption

The canonical rule is implemented in `public.record_payment_session_usage(class_id)`:

- Consumes one paid session for completed/present, completed/late, completed/absent, or `student_absent` class outcomes.
- Does not consume a paid session for `cancelled`, `teacher_absent`, `rescheduled`, `excused`, or `cancelled` attendance.
- Writes one row to `payment_session_usage` with `unique(payment_id, class_id)` so the same class cannot decrement a package twice.
- Decrements `payments.sessions_remaining` only after the usage ledger insert succeeds.

## Teacher IDs

Use these ids consistently:

- Auth/account identity: `profiles.id`.
- Operational teacher records: `teachers.id`.
- Operational references must store `teachers.id`: `students.assigned_teacher_id`, `classes.teacher_id`, `attendance.teacher_id`, `evaluations.teacher_id`, and `free_trials.teacher_id`.
- `class_schedules.teacher_profile_id` intentionally stores `profiles.id` for the current recurring schedule architecture.

Frontend code should resolve ids through `teachersService` / `teacherOperationsService`, not by guessing.

## Storage Buckets

Private upload migrations configure these buckets/policies where available:

- `homework-submissions`
- `class-materials`
- `payment-documents`
- `teacher-documents`
- `profile-images`

TODO: Historical storage RLS still needs a dedicated audit. This Phase 1 patch does not change storage policies.

## RLS Expectations

- Admin roles manage academy operational data.
- Teachers access assigned students, classes, trials, attendance, evaluations, homework, and check-ins through operational `teachers.id`.
- Students access only their own student records, classes, attendance, evaluations, payments, messages, homework, and notifications.
- Do not use service role credentials from frontend code to bypass RLS.

## Edge Functions

Deploy the account creation and public lead functions:

```bash
npx supabase functions deploy create-user
npx supabase functions deploy submit-lead
npx supabase functions deploy teacher-compliance-check
npx supabase functions deploy process-scheduled-notifications
npx supabase functions deploy send-notification
npx supabase functions deploy send-test-notification
npx supabase functions deploy notification-provider-status
```

Supabase provides reserved runtime values such as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Do not add service role keys to the Vite app.

Required Edge Function secrets by name only:

- `RESEND_API_KEY` or `SENDGRID_API_KEY` or SMTP variables such as `SMTP_HOST`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

`notification-provider-status` returns only `{ emailConfigured, whatsappConfigured }`.

## Cron and Realtime

- Apply migrations in timestamp order. Do not run remote migrations from the frontend project.
- Enable Supabase Realtime for `public.in_app_notifications` so the topbar bell updates without refresh.
- The latest migration attempts to schedule `public.run_dashboard_notification_cycle()` every 5 minutes via `pg_cron` when the extension is available. If Supabase does not allow the migration to create the extension/job, configure the same 5-minute job manually in the Supabase dashboard.
- To process provider-backed email/WhatsApp events, schedule `teacher-compliance-check` or `process-scheduled-notifications` every 5 minutes in Supabase Scheduled Functions.

## Local Validation

Run:

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

Then sign in at:

```text
http://localhost:5173/dashboard/login
```

Role redirects:

- `super_admin`, `admin`, `admissions`, `academic_manager`, `viewer` -> `/dashboard/admin`
- `finance` -> `/dashboard/admin/payments`
- `teacher` -> `/dashboard/teacher`
- `student` -> `/dashboard/student`

## Data Validation Checklist

- Create or confirm a `profiles` row for each auth user.
- Confirm teacher users have a linked `teachers.profile_id`.
- Confirm student assignments store `teachers.id`, not `profiles.id`.
- Confirm recurring schedules store `class_schedules.teacher_profile_id`.
- Confirm student dashboard sections show real data, empty states, or errors without mock fallback data.
- Confirm payments use `payments` plus optional `payment_packages`, not a nonexistent `packages` table.
- Confirm messages use `messages` for direct communication and `in_app_notifications` for system alerts.
