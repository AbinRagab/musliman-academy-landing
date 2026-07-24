import { supabase } from '../../lib/supabaseClient';
import type { AuthRole } from '../auth/AuthProvider';

export type StudentManagementRow = {
  id: string;
  name: string;
  program: string;
  teacher: string;
  level: string;
  attendance: string;
  status: string;
  nextClass: string;
};

export type StudentRecordTab =
  | 'overview'
  | 'personal'
  | 'academic'
  | 'trial'
  | 'classes'
  | 'evaluations'
  | 'payments'
  | 'messages'
  | 'settings';

export type StudentRecordOwner = 'Admin' | 'Teacher' | 'Finance' | 'Student' | 'System';

export type StudentRecordField = {
  key: string;
  label: string;
  value: string;
  owner: StudentRecordOwner;
  editableBy: AuthRole[];
  input?: 'text' | 'select' | 'date' | 'textarea';
};

export type StudentRecordSection = {
  id: string;
  title: string;
  owner: StudentRecordOwner;
  description: string;
  fields: StudentRecordField[];
};

export type StudentRecord = {
  id: string;
  name: string;
  status: string;
  program: string;
  level: string;
  teacher: string;
  nextClass: string;
  attendanceRate: string;
  progressPercentage: string;
  sections: Record<StudentRecordTab, StudentRecordSection[]>;
};

const adminRoles: AuthRole[] = ['super_admin', 'admin', 'admissions', 'academic_manager'];
const teacherEditRoles: AuthRole[] = ['teacher'];
const financeEditRoles: AuthRole[] = ['finance', 'super_admin', 'admin'];
const studentEditRoles: AuthRole[] = ['student'];
const systemRoles: AuthRole[] = [];

export const studentRecordTabs: Array<{ id: StudentRecordTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal & Parent Info' },
  { id: 'academic', label: 'Academic Setup' },
  { id: 'trial', label: 'Trial Feedback' },
  { id: 'classes', label: 'Classes & Attendance' },
  { id: 'evaluations', label: 'Evaluations & Progress' },
  { id: 'payments', label: 'Payments' },
  { id: 'messages', label: 'Messages / Notes' },
  { id: 'settings', label: 'Settings / Preferences' },
];

export function canEditStudentField(role: AuthRole | null | undefined, field: StudentRecordField) {
  return Boolean(role && field.editableBy.includes(role));
}

const mockStudentRecord: StudentRecord = {
  id: 'mock-yusuf',
  name: 'Yusuf Ahmed',
  status: 'active',
  program: 'Quran Reading',
  level: 'Level 3',
  teacher: 'Ust. Maryam Ali',
  nextClass: 'Mon 05:00 PM',
  attendanceRate: '96%',
  progressPercentage: '74%',
  sections: {
    overview: [
      {
        id: 'summary',
        title: 'Student Summary',
        owner: 'System',
        description: 'Calculated overview from enrollment, classes, attendance, evaluations, and payments.',
        fields: [
          { key: 'attendance_rate', label: 'Attendance rate', value: '96%', owner: 'System', editableBy: systemRoles },
          { key: 'completed_lessons', label: 'Completed lessons', value: '31', owner: 'System', editableBy: systemRoles },
          { key: 'progress_percentage', label: 'Progress percentage', value: '74%', owner: 'System', editableBy: systemRoles },
          { key: 'next_class_date', label: 'Next class date', value: 'Jul 27, 2026', owner: 'System', editableBy: systemRoles },
          { key: 'payment_status', label: 'Payment status', value: 'Paid', owner: 'System', editableBy: systemRoles },
        ],
      },
    ],
    personal: [
      {
        id: 'personal_parent',
        title: 'Personal & Parent Info',
        owner: 'Admin',
        description: 'Admin or Admissions manages personal data gathered from lead review and parent contact.',
        fields: [
          { key: 'student_name', label: 'Student name', value: 'Yusuf Ahmed', owner: 'Admin', editableBy: adminRoles },
          { key: 'parent_name', label: 'Parent name', value: 'Ahmed Hassan', owner: 'Admin', editableBy: adminRoles },
          { key: 'parent_whatsapp', label: 'Parent WhatsApp', value: '+20 100 000 0000', owner: 'Admin', editableBy: adminRoles },
          { key: 'parent_email', label: 'Parent email', value: 'parent.yusuf@example.com', owner: 'Admin', editableBy: adminRoles },
          { key: 'country', label: 'Country', value: 'Egypt', owner: 'Admin', editableBy: adminRoles },
          { key: 'age', label: 'Age', value: '11', owner: 'Admin', editableBy: adminRoles },
        ],
      },
    ],
    academic: [
      {
        id: 'academic_setup',
        title: 'Academic Setup',
        owner: 'Admin',
        description: 'Admin approves final level, schedule, teacher assignment, meeting link, and enrollment settings.',
        fields: [
          { key: 'current_program', label: 'Current program', value: 'Quran Reading', owner: 'Admin', editableBy: adminRoles },
          { key: 'approved_level', label: 'Approved level', value: 'Level 3', owner: 'Admin', editableBy: adminRoles },
          { key: 'assigned_teacher', label: 'Assigned teacher', value: 'Ust. Maryam Ali', owner: 'Admin', editableBy: adminRoles },
          { key: 'schedule_days', label: 'Schedule days', value: 'Monday, Wednesday, Saturday', owner: 'Admin', editableBy: adminRoles },
          { key: 'class_time', label: 'Class time', value: '05:00 PM', owner: 'Admin', editableBy: adminRoles },
          { key: 'timezone', label: 'Timezone', value: 'Africa/Cairo', owner: 'Admin', editableBy: adminRoles },
          { key: 'start_date', label: 'Start date', value: 'Apr 08, 2026', owner: 'Admin', editableBy: adminRoles, input: 'date' },
          { key: 'meeting_link', label: 'Meeting link', value: 'Available before class', owner: 'Admin', editableBy: adminRoles },
          { key: 'schedule_notes', label: 'Schedule notes', value: 'Evening sessions after school.', owner: 'Admin', editableBy: adminRoles, input: 'textarea' },
        ],
      },
    ],
    trial: [
      {
        id: 'trial_feedback',
        title: 'Trial Feedback',
        owner: 'Teacher',
        description: 'Teacher records educational assessment for assigned trial/student only. Admin can view and approve final level.',
        fields: [
          { key: 'reading_level', label: 'Reading level', value: 'Intermediate', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'tajweed_level', label: 'Tajweed level', value: 'Level 2', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'arabic_level', label: 'Arabic level', value: 'Beginner', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'student_engagement', label: 'Student engagement', value: 'Excellent', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'recommended_level', label: 'Recommended level', value: 'Level 3', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'teacher_feedback', label: 'Teacher feedback', value: 'Good reading confidence; needs steady Tajweed revision.', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'recommendation', label: 'Recommendation', value: 'Recommended to enroll', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'trial_result', label: 'Trial result', value: 'completed', owner: 'Teacher', editableBy: teacherEditRoles },
        ],
      },
    ],
    classes: [
      {
        id: 'class_attendance',
        title: 'Classes & Attendance',
        owner: 'Teacher',
        description: 'Teacher marks attendance and adds class report fields for assigned students.',
        fields: [
          { key: 'attendance', label: 'Attendance', value: 'present', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'lesson_covered', label: 'Lesson covered', value: 'Madd letters review', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'homework', label: 'Homework', value: 'Upload two-minute revision audio.', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'class_notes', label: 'Class notes', value: 'Strong pace and careful repetition.', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'participation', label: 'Student participation', value: 'Excellent', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'next_lesson_plan', label: 'Next lesson plan', value: 'Apply Madd rules in Surah Al-Mulk.', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
        ],
      },
    ],
    evaluations: [
      {
        id: 'evaluations_progress',
        title: 'Evaluations & Progress',
        owner: 'Teacher',
        description: 'Teacher adds evaluation scores and progress notes. System derives progress metrics.',
        fields: [
          { key: 'recitation_rating', label: 'Recitation rating', value: '5/5', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'tajweed_rating', label: 'Tajweed rating', value: '4/5', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'understanding_rating', label: 'Understanding rating', value: '5/5', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'behavior_rating', label: 'Behavior / engagement rating', value: '5/5', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'progress_notes', label: 'Progress notes', value: 'Continue slow recitation practice.', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'teacher_recommendation', label: 'Teacher recommendation', value: 'Ready for next lesson unit.', owner: 'Teacher', editableBy: teacherEditRoles },
        ],
      },
    ],
    payments: [
      {
        id: 'payment_setup',
        title: 'Payments',
        owner: 'Finance',
        description: 'Finance edits package, payment status, payment dates, cost, revenue, and invoice notes only.',
        fields: [
          { key: 'package', label: 'Package', value: '12 Sessions', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'currency', label: 'Currency', value: 'USD', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'amount', label: 'Amount', value: '$120', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'payment_status', label: 'Payment status', value: 'paid', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'payment_date', label: 'Payment date', value: 'Jul 01, 2026', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'next_due_date', label: 'Next due date', value: 'Aug 01, 2026', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'teacher_cost', label: 'Teacher cost', value: '$54', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'net_revenue', label: 'Net revenue', value: '$66', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'invoice_notes', label: 'Invoice notes', value: 'Monthly renewal reminder scheduled.', owner: 'Finance', editableBy: financeEditRoles, input: 'textarea' },
        ],
      },
    ],
    messages: [
      {
        id: 'messages_notes',
        title: 'Messages / Notes',
        owner: 'Admin',
        description: 'Admin and teachers add internal notes; students view approved messages.',
        fields: [
          { key: 'admin_note', label: 'Admin note', value: 'Parent prefers WhatsApp updates.', owner: 'Admin', editableBy: adminRoles, input: 'textarea' },
          { key: 'teacher_note', label: 'Teacher note', value: 'Needs revision on elongation timing.', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'last_message', label: 'Last message', value: 'Homework reminder sent Jul 23.', owner: 'System', editableBy: systemRoles },
        ],
      },
    ],
    settings: [
      {
        id: 'settings_preferences',
        title: 'Settings / Preferences',
        owner: 'Student',
        description: 'Student/parent can edit limited preferences or request contact updates.',
        fields: [
          { key: 'preferred_contact_method', label: 'Preferred contact method', value: 'WhatsApp', owner: 'Student', editableBy: studentEditRoles },
          { key: 'notification_preferences', label: 'Notification preferences', value: 'Class and homework reminders enabled', owner: 'Student', editableBy: studentEditRoles },
          { key: 'language_preference', label: 'Language preference', value: 'English with Arabic terms', owner: 'Student', editableBy: studentEditRoles },
          { key: 'timezone', label: 'Timezone', value: 'Africa/Cairo', owner: 'Student', editableBy: studentEditRoles },
          { key: 'whatsapp_update_request', label: 'WhatsApp update request', value: 'No open request', owner: 'Student', editableBy: studentEditRoles },
        ],
      },
    ],
  },
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

export async function fetchStudentManagementRows() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('students')
    .select('id, student_name, program_id, assigned_teacher_id, level, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const programIds = Array.from(new Set((data || []).map((student) => student.program_id).filter(Boolean))) as string[];
  const teacherIds = Array.from(new Set((data || []).map((student) => student.assigned_teacher_id).filter(Boolean))) as string[];
  const [{ data: programs }, { data: teachers }] = await Promise.all([
    programIds.length ? client.from('programs').select('id, name').in('id', programIds) : Promise.resolve({ data: [] }),
    teacherIds.length ? client.from('profiles').select('id, full_name').in('id', teacherIds) : Promise.resolve({ data: [] }),
  ]);

  const programById = new Map((programs || []).map((program) => [program.id, program.name]));
  const teacherById = new Map((teachers || []).map((teacher) => [teacher.id, teacher.full_name]));

  return (data || []).map((student) => ({
    id: student.id,
    name: student.student_name,
    program: student.program_id ? programById.get(student.program_id) || 'Program not assigned' : 'Program not assigned',
    teacher: student.assigned_teacher_id ? teacherById.get(student.assigned_teacher_id) || 'Assigned teacher' : 'Unassigned',
    level: student.level || 'Placement pending',
    attendance: 'New',
    status: student.status || 'active',
    nextClass: 'Schedule pending',
  })) satisfies StudentManagementRow[];
}

export async function fetchStudentRecord(studentId?: string | null) {
  if (!studentId || studentId.startsWith('mock')) {
    return mockStudentRecord;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('students')
    .select('id, student_name, parent_name, whatsapp, country, age, program_id, level, assigned_teacher_id, schedule_notes, start_date, status')
    .eq('id', studentId)
    .maybeSingle();

  if (error || !data) {
    return mockStudentRecord;
  }

  return {
    ...mockStudentRecord,
    id: data.id,
    name: data.student_name || mockStudentRecord.name,
    status: data.status || mockStudentRecord.status,
    level: data.level || mockStudentRecord.level,
    sections: {
      ...mockStudentRecord.sections,
      personal: mockStudentRecord.sections.personal.map((section) => ({
        ...section,
        fields: section.fields.map((field) => {
          const valueByKey: Record<string, string | null | undefined> = {
            student_name: data.student_name,
            parent_name: data.parent_name,
            parent_whatsapp: data.whatsapp,
            country: data.country,
            age: data.age,
          };

          return valueByKey[field.key] ? { ...field, value: String(valueByKey[field.key]) } : field;
        }),
      })),
    },
  } satisfies StudentRecord;
}

export async function updateStudentPersonalInfo(studentId: string, payload: Record<string, string>) {
  if (studentId.startsWith('mock')) {
    return { success: true, payload };
  }

  const client = requireSupabase();
  const updatePayload = {
    student_name: payload.student_name,
    parent_name: payload.parent_name,
    whatsapp: payload.parent_whatsapp,
    country: payload.country,
    age: payload.age,
  };
  const { data, error } = await client.from('students').update(updatePayload).eq('id', studentId).select('*').single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateStudentAcademicSetup(studentId: string, payload: Record<string, string>) {
  if (studentId.startsWith('mock')) {
    return { success: true, payload };
  }

  const client = requireSupabase();
  const updatePayload = {
    level: payload.approved_level,
    start_date: payload.start_date,
    schedule_notes: [
      payload.schedule_notes,
      payload.schedule_days ? `Schedule days: ${payload.schedule_days}` : '',
      payload.class_time ? `Class time: ${payload.class_time}` : '',
      payload.timezone ? `Timezone: ${payload.timezone}` : '',
      payload.meeting_link ? `Meeting link: ${payload.meeting_link}` : '',
    ].filter(Boolean).join('\n'),
  };
  const { data, error } = await client.from('students').update(updatePayload).eq('id', studentId).select('*').single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateStudentPreferences(studentId: string, payload: Record<string, string>) {
  return { success: true, studentId, payload };
}
