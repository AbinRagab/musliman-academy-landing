import { supabase } from '../../lib/supabaseClient';
import type { DashboardRole } from '../types';

export type GlobalSearchResult = {
  id: string;
  label: string;
  description: string;
  path: string;
  type: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for search.');
  }
  return supabase;
}

function matchesQuery(value: unknown, query: string) {
  return String(value || '').toLowerCase().includes(query.toLowerCase());
}

export async function searchDashboard(role: DashboardRole, query: string): Promise<GlobalSearchResult[]> {
  const client = requireSupabase();
  const term = query.trim();
  if (term.length < 2) return [];

  if (role === 'admin') {
    const [students, leads, teachers, classes] = await Promise.all([
      client.from('students').select('id, student_name, status').ilike('student_name', `%${term}%`).limit(5),
      client.from('leads').select('id, full_name, status').ilike('full_name', `%${term}%`).limit(5),
      client.from('teachers').select('id, full_name, status').ilike('full_name', `%${term}%`).limit(5),
      client.from('classes').select('id, class_date, start_time, status, lesson_title').or(`lesson_title.ilike.%${term}%,status.ilike.%${term}%`).limit(5),
    ]);
    throwFirstError([students.error, leads.error, teachers.error, classes.error]);
    return [
      ...(students.data || []).map((row) => result(row.id, row.student_name, `Student - ${row.status}`, `/dashboard/admin/students/${row.id}`, 'student')),
      ...(leads.data || []).map((row) => result(row.id, row.full_name, `Lead - ${row.status}`, '/dashboard/admin/leads', 'lead')),
      ...(teachers.data || []).map((row) => result(row.id, row.full_name, `Teacher - ${row.status}`, '/dashboard/admin/teachers', 'teacher')),
      ...(classes.data || []).map((row) => result(row.id, row.lesson_title || `${row.class_date} ${row.start_time || ''}`, `Class - ${row.status}`, '/dashboard/admin/classes', 'class')),
    ];
  }

  if (role === 'teacher') {
    const [students, classes, trials] = await Promise.all([
      client.from('students').select('id, student_name, status').ilike('student_name', `%${term}%`).limit(5),
      client.from('classes').select('id, class_date, start_time, status, lesson_title').or(`lesson_title.ilike.%${term}%,status.ilike.%${term}%`).limit(5),
      client.from('free_trials').select('id, trial_date, trial_time, status, result').or(`status.ilike.%${term}%,result.ilike.%${term}%`).limit(5),
    ]);
    throwFirstError([students.error, classes.error, trials.error]);
    return [
      ...(students.data || []).map((row) => result(row.id, row.student_name, `Student - ${row.status}`, '/dashboard/teacher/students', 'student')),
      ...(classes.data || []).map((row) => result(row.id, row.lesson_title || `${row.class_date} ${row.start_time || ''}`, `Class - ${row.status}`, '/dashboard/teacher/classes', 'class')),
      ...(trials.data || []).map((row) => result(row.id, `${row.trial_date} ${row.trial_time || ''}`, `Trial - ${row.status}`, '/dashboard/teacher/free-trials', 'trial')),
    ];
  }

  const [classes, homework, messages] = await Promise.all([
    client.from('classes').select('id, class_date, start_time, status, lesson_title').or(`lesson_title.ilike.%${term}%,status.ilike.%${term}%`).limit(5),
    client.from('homework_assignments').select('id, title, status').ilike('title', `%${term}%`).limit(5),
    client.from('messages').select('id, subject, body').or(`subject.ilike.%${term}%,body.ilike.%${term}%`).limit(5),
  ]);
  throwFirstError([classes.error, homework.error, messages.error]);
  return [
    ...(classes.data || []).map((row) => result(row.id, row.lesson_title || `${row.class_date} ${row.start_time || ''}`, `Class - ${row.status}`, '/dashboard/student/classes', 'class')),
    ...(homework.data || []).filter((row) => matchesQuery(row.title, term)).map((row) => result(row.id, row.title, `Homework - ${row.status}`, '/dashboard/student/homework', 'homework')),
    ...(messages.data || []).map((row) => result(row.id, row.subject || 'Message', String(row.body || '').slice(0, 80), '/dashboard/student/messages', 'message')),
  ];
}

function result(id: string, label: string, description: string, path: string, type: string): GlobalSearchResult {
  return { id, label: label || type, description, path, type };
}

function throwFirstError(errors: Array<{ message: string } | null | undefined>) {
  const error = errors.find(Boolean);
  if (error) throw error;
}
