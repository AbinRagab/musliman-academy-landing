export type DashboardRole = 'admin' | 'teacher' | 'student';
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type Profile = {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
};

export type Teacher = {
  id: string;
  profile_id: string | null;
  full_name: string | null;
  status?: string | null;
};

export type Student = {
  id: string;
  profile_id?: string | null;
  student_name?: string | null;
  program_id?: string | null;
  assigned_teacher_id?: string | null;
  level?: string | null;
  status?: string | null;
};

export type Program = {
  id: string;
  name: string;
  slug?: string | null;
  status?: string | null;
};

export type Lead = {
  id: string;
  name?: string | null;
  status?: string | null;
  assigned_teacher_id?: string | null;
};

export type FreeTrial = {
  id: string;
  lead_id?: string | null;
  student_id?: string | null;
  teacher_id?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
};

export type ClassSchedule = {
  id: string;
  student_id: string;
  program_id?: string | null;
  teacher_profile_id?: string | null;
  day_of_week: string;
  start_time: string;
  duration_minutes: number;
  timezone: string;
  status: string;
};

export type AcademyClass = {
  id: string;
  student_id?: string | null;
  teacher_id?: string | null;
  program_id?: string | null;
  class_date?: string | null;
  start_time?: string | null;
  status?: string | null;
};

export type Attendance = {
  id: string;
  class_id?: string | null;
  student_id?: string | null;
  teacher_id?: string | null;
  status: string;
  notes?: string | null;
};

export type Evaluation = {
  id: string;
  student_id?: string | null;
  teacher_id?: string | null;
  class_id?: string | null;
  recitation_rating?: number | null;
  tajweed_rating?: number | null;
  understanding_rating?: number | null;
  behavior_rating?: number | null;
  progress_feedback?: string | null;
  teacher_notes?: string | null;
  created_at?: string | null;
};

export type Payment = {
  id: string;
  student_id?: string | null;
  program_id?: string | null;
  currency?: string | null;
  amount?: number | string | null;
  payment_method?: string | null;
  payment_date?: string | null;
  next_due_date?: string | null;
  status?: string | null;
  sessions_included?: number | null;
  sessions_remaining?: number | null;
  receipt_url?: string | null;
  receipt_file_path?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

export type Message = {
  id: string;
  sender_id?: string | null;
  receiver_id?: string | null;
  subject?: string | null;
  body?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};

export type Notification = {
  id: string;
  recipient_id?: string | null;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};
