# Security Review

This document records security findings discovered during the architecture review. No Supabase schema or RLS policy changes were made as part of this refactor.

## 1. Self-profile updates may allow sensitive field changes

- Severity: High
- Affected file or policy: `supabase/schema.sql`, profile self-update RLS policy such as `Users can update their own profile`
- Risk: If the policy allows users to update all columns on their own profile row, a user may be able to change sensitive fields such as `role` or `status`, leading to privilege escalation or account-state tampering.
- Recommended fix: Restrict self-service profile updates to non-sensitive columns only. Move sensitive fields such as `role`, `status`, and administrative metadata behind admin-only server-side operations or tightly scoped RLS policies.
- Verification steps: Attempt an authenticated update to `profiles.role` and `profiles.status` as a non-admin user. The update should fail, while allowed profile fields such as display name or phone should still update if intended.

## 2. Public lead submission endpoint needs abuse protection

- Severity: Medium
- Affected file or policy: `supabase/functions/submit-lead/index.ts`
- Risk: The public `submit-lead` Edge Function can be abused for spam, CRM pollution, notification flooding, or resource exhaustion if it does not enforce rate limiting and bot protection.
- Recommended fix: Add rate limiting keyed by IP and normalized contact fields, add bot protection such as Turnstile or reCAPTCHA, validate allowed origins where practical, and log rejected attempts without storing secrets.
- Verification steps: Send repeated submissions from the same client and confirm excess attempts are rejected. Confirm legitimate submissions still reach the CRM path.

## 3. Homework insertion policy should validate student and class ownership

- Severity: High
- Affected file or policy: Homework-related insert policies in Supabase schema or migrations
- Risk: If homework insertion only checks authentication, a user may submit homework for a `student_id` or `class_id` that does not belong to them, polluting academic records or exposing workflow assumptions.
- Recommended fix: Add RLS checks that verify the submitted `student_id` belongs to the authenticated student profile or assigned teacher/admin role, and that `class_id` is associated with that same student or teacher context.
- Verification steps: As a student user, attempt to insert homework for another student's `student_id` or unrelated `class_id`. The insert should fail. Repeat with valid ownership and confirm the insert succeeds.

## 4. Base Supabase schema should become a complete initial migration

- Severity: Medium
- Affected file or policy: `supabase/schema.sql` and `supabase/migrations/*`
- Risk: A partial or drifted base schema makes new environment setup fragile and can hide production-only differences in tables, policies, functions, indexes, triggers, and storage buckets.
- Recommended fix: Create a complete baseline migration from a reviewed schema snapshot, then layer future changes as incremental migrations. Keep generated snapshots free of credentials and environment-specific values.
- Verification steps: Rebuild a fresh local Supabase environment using migrations only, then compare tables, constraints, indexes, functions, triggers, storage policies, and RLS policies with the intended reference environment.
