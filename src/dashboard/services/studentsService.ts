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
  | 'attendance'
  | 'homework'
  | 'evaluations'
  | 'teacher-notes'
  | 'progress'
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
  { id: 'classes', label: 'Class History' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'homework', label: 'Homework' },
  { id: 'evaluations', label: 'Evaluations' },
  { id: 'teacher-notes', label: 'Teacher Notes' },
  { id: 'progress', label: 'Progress' },
  { id: 'payments', label: 'Payments' },
  { id: 'messages', label: 'Messages / Notes' },
  { id: 'settings', label: 'Settings / Preferences' },
];

export function canEditStudentField(role: AuthRole | null | undefined, field: StudentRecordField) {
  return Boolean(role && field.editableBy.includes(role));
}

const emptyStudentRecord: StudentRecord = {
  id: '',
  name: 'Student record',
  status: 'No record',
  program: 'Program not assigned',
  level: 'Level not set',
  teacher: 'Unassigned',
  nextClass: 'Schedule pending',
  attendanceRate: '0%',
  progressPercentage: '0%',
  sections: {
    overview: [
      {
        id: 'summary',
        title: 'Student Summary',
        owner: 'System',
        description: 'Calculated overview from enrollment, classes, attendance, evaluations, and payments.',
        fields: [
          { key: 'attendance_rate', label: 'Attendance rate', value: '0%', owner: 'System', editableBy: systemRoles },
          { key: 'completed_lessons', label: 'Completed lessons', value: '0', owner: 'System', editableBy: systemRoles },
          { key: 'progress_percentage', label: 'Progress percentage', value: '0%', owner: 'System', editableBy: systemRoles },
          { key: 'next_class_date', label: 'Next class date', value: 'Schedule pending', owner: 'System', editableBy: systemRoles },
          { key: 'payment_status', label: 'Payment status', value: 'No payment record', owner: 'System', editableBy: systemRoles },
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
          { key: 'student_name', label: 'Student name', value: '', owner: 'Admin', editableBy: adminRoles },
          { key: 'parent_name', label: 'Parent name', value: '', owner: 'Admin', editableBy: adminRoles },
          { key: 'parent_whatsapp', label: 'Parent WhatsApp', value: '', owner: 'Admin', editableBy: adminRoles },
          { key: 'parent_email', label: 'Parent email', value: '', owner: 'Admin', editableBy: adminRoles },
          { key: 'country', label: 'Country', value: '', owner: 'Admin', editableBy: adminRoles },
          { key: 'age', label: 'Age', value: '', owner: 'Admin', editableBy: adminRoles },
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
          { key: 'current_program', label: 'Current program', value: 'Program not assigned', owner: 'Admin', editableBy: adminRoles },
          { key: 'approved_level', label: 'Approved level', value: 'Level not set', owner: 'Admin', editableBy: adminRoles },
          { key: 'assigned_teacher', label: 'Assigned teacher', value: 'Unassigned', owner: 'Admin', editableBy: adminRoles },
          { key: 'schedule_days', label: 'Schedule days', value: 'Schedule pending', owner: 'Admin', editableBy: adminRoles },
          { key: 'class_time', label: 'Class time', value: 'Time pending', owner: 'Admin', editableBy: adminRoles },
          { key: 'timezone', label: 'Timezone', value: 'Timezone pending', owner: 'Admin', editableBy: adminRoles },
          { key: 'start_date', label: 'Start date', value: '', owner: 'Admin', editableBy: adminRoles, input: 'date' },
          { key: 'meeting_link', label: 'Meeting link', value: 'Meeting link pending', owner: 'Admin', editableBy: adminRoles },
          { key: 'schedule_notes', label: 'Schedule notes', value: '', owner: 'Admin', editableBy: adminRoles, input: 'textarea' },
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
          { key: 'reading_level', label: 'Reading level', value: 'Not recorded', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'tajweed_level', label: 'Tajweed level', value: 'Not recorded', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'arabic_level', label: 'Arabic level', value: 'Not recorded', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'student_engagement', label: 'Student engagement', value: 'Not recorded', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'recommended_level', label: 'Recommended level', value: 'Not set', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'teacher_feedback', label: 'Teacher feedback', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'recommendation', label: 'Recommendation', value: 'No recommendation yet', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'trial_result', label: 'Trial result', value: 'No trial result', owner: 'Teacher', editableBy: teacherEditRoles },
        ],
      },
    ],
    classes: [
      {
        id: 'class_attendance',
        title: 'Class History',
        owner: 'Teacher',
        description: 'Teacher records lesson coverage, class report notes, and next lesson planning for assigned students.',
        fields: [
          { key: 'lesson_covered', label: 'Lesson covered', value: 'No lesson report yet', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'class_notes', label: 'Class notes', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'participation', label: 'Student participation', value: 'Not recorded', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'next_lesson_plan', label: 'Next lesson plan', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
        ],
      },
    ],
    attendance: [
      {
        id: 'attendance_records',
        title: 'Attendance',
        owner: 'Teacher',
        description: 'Teacher marks attendance for assigned classes only.',
        fields: [
          { key: 'attendance', label: 'Attendance', value: 'No attendance records', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'attendance_note', label: 'Attendance note', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'attendance_rate', label: 'Attendance rate', value: '0%', owner: 'System', editableBy: systemRoles },
        ],
      },
    ],
    homework: [
      {
        id: 'homework_notes',
        title: 'Homework',
        owner: 'Teacher',
        description: 'Teacher sets homework notes and review feedback.',
        fields: [
          { key: 'homework', label: 'Homework assigned', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'homework_feedback', label: 'Homework feedback', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'homework_status', label: 'Homework status', value: 'No homework records', owner: 'Teacher', editableBy: teacherEditRoles },
        ],
      },
    ],
    evaluations: [
      {
        id: 'evaluations',
        title: 'Evaluations',
        owner: 'Teacher',
        description: 'Teacher adds evaluation scores and recommendations. System derives progress metrics.',
        fields: [
          { key: 'recitation_rating', label: 'Recitation rating', value: 'Not scored', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'tajweed_rating', label: 'Tajweed rating', value: 'Not scored', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'understanding_rating', label: 'Understanding rating', value: 'Not scored', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'behavior_rating', label: 'Behavior / engagement rating', value: 'Not scored', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'progress_notes', label: 'Progress notes', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'teacher_recommendation', label: 'Teacher recommendation', value: 'No recommendation yet', owner: 'Teacher', editableBy: teacherEditRoles },
        ],
      },
    ],
    'teacher-notes': [
      {
        id: 'teacher_notes',
        title: 'Teacher Notes',
        owner: 'Teacher',
        description: 'Private teacher notes for academic follow-up and academy review.',
        fields: [
          { key: 'teacher_note', label: 'Teacher note', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'support_needed', label: 'Support needed', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
        ],
      },
    ],
    progress: [
      {
        id: 'progress_summary',
        title: 'Progress',
        owner: 'System',
        description: 'Progress summary calculated from attendance, homework, evaluations, and class reports.',
        fields: [
          { key: 'progress_percentage', label: 'Progress percentage', value: '0%', owner: 'System', editableBy: systemRoles },
          { key: 'current_focus', label: 'Current focus', value: 'No focus area recorded', owner: 'Teacher', editableBy: teacherEditRoles },
          { key: 'next_milestone', label: 'Next milestone', value: 'No milestone recorded', owner: 'Teacher', editableBy: teacherEditRoles },
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
          { key: 'package', label: 'Package', value: 'No package record', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'currency', label: 'Currency', value: '', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'amount', label: 'Amount', value: '0', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'payment_status', label: 'Payment status', value: 'No payment record', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'payment_date', label: 'Payment date', value: '', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'next_due_date', label: 'Next due date', value: '', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'teacher_cost', label: 'Teacher cost', value: '0', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'net_revenue', label: 'Net revenue', value: '0', owner: 'Finance', editableBy: financeEditRoles },
          { key: 'invoice_notes', label: 'Invoice notes', value: '', owner: 'Finance', editableBy: financeEditRoles, input: 'textarea' },
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
          { key: 'admin_note', label: 'Admin note', value: '', owner: 'Admin', editableBy: adminRoles, input: 'textarea' },
          { key: 'teacher_note', label: 'Teacher note', value: '', owner: 'Teacher', editableBy: teacherEditRoles, input: 'textarea' },
          { key: 'last_message', label: 'Last message', value: 'No messages recorded', owner: 'System', editableBy: systemRoles },
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
          { key: 'preferred_contact_method', label: 'Preferred contact method', value: 'Academy messages', owner: 'Student', editableBy: studentEditRoles },
          { key: 'notification_preferences', label: 'Notification preferences', value: 'Default academy notifications', owner: 'Student', editableBy: studentEditRoles },
          { key: 'language_preference', label: 'Language preference', value: 'Not set', owner: 'Student', editableBy: studentEditRoles },
          { key: 'timezone', label: 'Timezone', value: 'Not set', owner: 'Student', editableBy: studentEditRoles },
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
  if (!studentId) {
    return emptyStudentRecord;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('students')
    .select('id, student_name, parent_name, whatsapp, country, age, program_id, level, assigned_teacher_id, schedule_notes, start_date, status')
    .eq('id', studentId)
    .maybeSingle();

  if (error || !data) {
    return emptyStudentRecord;
  }

  return {
    ...emptyStudentRecord,
    id: data.id,
    name: data.student_name || emptyStudentRecord.name,
    status: data.status || emptyStudentRecord.status,
    level: data.level || emptyStudentRecord.level,
    sections: {
      ...emptyStudentRecord.sections,
      personal: emptyStudentRecord.sections.personal.map((section) => ({
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
