insert into public.permissions (key, label, description) values
  ('manage_students', 'Manage Students', 'Create, update, assign, and archive student records.'),
  ('manage_teachers', 'Manage Teachers', 'Create and update teacher profiles and availability.'),
  ('manage_free_trials', 'Manage Free Trials', 'Schedule, assign, and follow up on free trial classes.'),
  ('manage_classes', 'Manage Classes', 'Create, reschedule, and update academy classes.'),
  ('manage_attendance', 'Manage Attendance', 'Mark and update class attendance.'),
  ('manage_evaluations', 'Manage Evaluations', 'Create and review student progress evaluations.'),
  ('manage_payments', 'Manage Payments', 'Create invoices and update payment records.'),
  ('view_reports', 'View Reports', 'View operational, academic, and financial reports.'),
  ('manage_accounts', 'Manage Accounts', 'Create accounts, assign roles, and manage permissions.'),
  ('manage_settings', 'Manage Settings', 'Manage academy system settings.')
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description;

insert into public.role_permissions (role, permission_key)
select role, permission_key
from (
  values
    ('super_admin'::public.user_role, 'manage_students'),
    ('super_admin'::public.user_role, 'manage_teachers'),
    ('super_admin'::public.user_role, 'manage_free_trials'),
    ('super_admin'::public.user_role, 'manage_classes'),
    ('super_admin'::public.user_role, 'manage_attendance'),
    ('super_admin'::public.user_role, 'manage_evaluations'),
    ('super_admin'::public.user_role, 'manage_payments'),
    ('super_admin'::public.user_role, 'view_reports'),
    ('super_admin'::public.user_role, 'manage_accounts'),
    ('super_admin'::public.user_role, 'manage_settings'),
    ('admin'::public.user_role, 'manage_students'),
    ('admin'::public.user_role, 'manage_teachers'),
    ('admin'::public.user_role, 'manage_free_trials'),
    ('admin'::public.user_role, 'manage_classes'),
    ('admin'::public.user_role, 'manage_attendance'),
    ('admin'::public.user_role, 'manage_evaluations'),
    ('admin'::public.user_role, 'manage_payments'),
    ('admin'::public.user_role, 'view_reports'),
    ('admin'::public.user_role, 'manage_accounts'),
    ('admissions'::public.user_role, 'manage_free_trials'),
    ('admissions'::public.user_role, 'manage_students'),
    ('admissions'::public.user_role, 'view_reports'),
    ('academic_manager'::public.user_role, 'manage_students'),
    ('academic_manager'::public.user_role, 'manage_teachers'),
    ('academic_manager'::public.user_role, 'manage_classes'),
    ('academic_manager'::public.user_role, 'manage_attendance'),
    ('academic_manager'::public.user_role, 'manage_evaluations'),
    ('academic_manager'::public.user_role, 'view_reports'),
    ('teacher'::public.user_role, 'manage_attendance'),
    ('teacher'::public.user_role, 'manage_evaluations'),
    ('teacher'::public.user_role, 'view_reports'),
    ('finance'::public.user_role, 'manage_payments'),
    ('finance'::public.user_role, 'view_reports'),
    ('viewer'::public.user_role, 'view_reports')
) as defaults(role, permission_key)
on conflict (role, permission_key) do nothing;

insert into public.programs (name, slug, description, program_type) values
  ('Quran Reading', 'quran-reading', 'Step-by-step Quran reading for non-Arabic speakers.', 'quran'),
  ('Tarteel Qaidah', 'tarteel-qaidah', 'Foundational Arabic letters and Quran reading preparation.', 'quran'),
  ('Quran Memorization', 'quran-memorization', 'Structured memorization with revision tracking.', 'quran'),
  ('Tajweed', 'tajweed', 'Rules and practice for accurate Quran recitation.', 'tajweed'),
  ('Quran Tafseer', 'quran-tafseer', 'Age-appropriate Quran meanings and reflections.', 'quran'),
  ('Arabic Language', 'arabic-language', 'Arabic reading, vocabulary, grammar, and conversation.', 'arabic'),
  ('Islamic Studies', 'islamic-studies', 'Aqidah, worship, seerah, and daily Islamic knowledge.', 'islamic_studies'),
  ('Islamic Values for Children', 'islamic-values-children', 'Character, manners, dua, and values for young learners.', 'children_values'),
  ('Teacher Training', 'teacher-training', 'Training teachers to teach Quran and Arabic online.', 'teacher_training')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  program_type = excluded.program_type;

-- Sample profiles are intentionally not inserted here.
-- Create actual users in Supabase Authentication first, then insert matching profile rows.
-- Example after creating a user in Supabase Auth:
--
-- insert into public.profiles (id, full_name, email, role, status)
-- values (
--   'AUTH_USER_UUID_FROM_SUPABASE',
--   'Musliman Super Admin',
--   'admin@muslimanacademy.com',
--   'super_admin',
--   'active'
-- );
