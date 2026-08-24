import { supabase } from '../../lib/supabaseClient';
import type { AuthRole } from '../auth/AuthProvider';
import {
  fetchActiveClassSchedulesByStudentIds,
  getNextClass,
  replaceStudentClassSchedules,
} from './classSchedulesService';
import { getStudentDisplayName } from './displayNameUtils';
import { fetchPrograms } from './programsService';
import { fetchActiveTeacherOptions, resolveOperationalTeacherId, resolveTeacherNamesById, resolveTeacherProfileId } from './teachersService';
import { getAcademyTodayDate, getNowIso } from './dateUtils';
import type {
  StudentActionTeacher,
  StudentAttendanceRecord,
  StudentManagementRow,
  StudentPaymentRecord,
  StudentProgramOption,
  StudentRecord,
  StudentRecordField,
  StudentRecordSection,
  StudentRecordTab,
  StudentSchedulePayload,
} from './students/studentTypes';

export type {
  StudentActionTeacher,
  StudentAttendanceRecord,
  StudentManagementRow,
  StudentPaymentRecord,
  StudentProgramOption,
  StudentRecord,
  StudentRecordField,
  StudentRecordOwner,
  StudentRecordSection,
  StudentRecordTab,
  StudentSchedulePayload,
} from './students/studentTypes';

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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function logNonBlockingAssignmentStep(
  label: string,
  operation: PromiseLike<{ error: { message?: string } | null }>,
) {
  const { error } = await operation;

  if (error && import.meta.env.DEV) {
    console.warn(`Teacher assignment ${label} sync failed:`, error);
  }
}

export async function fetchStudentManagementRows() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('students')
    .select('id, student_name, program_id, assigned_teacher_id, level, status, schedule_notes, start_date, created_at, programs:program_id(id, name, slug)')
    .order('created_at', { ascending: false });

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Student management rows fetch failed:', error);
    }
    throw error;
  }

  const teacherIds = Array.from(new Set((data || []).map((student) => student.assigned_teacher_id).filter(Boolean))) as string[];
  const teacherById = await resolveTeacherNamesById(teacherIds);
  const scheduleRows = await fetchActiveClassSchedulesByStudentIds((data || []).map((student) => student.id));
  const schedulesByStudentId = new Map<string, typeof scheduleRows>();

  scheduleRows.forEach((schedule) => {
    const current = schedulesByStudentId.get(schedule.student_id) || [];
    current.push(schedule);
    schedulesByStudentId.set(schedule.student_id, current);
  });

  return (data || []).map((student) => {
    const joinedProgram = Array.isArray(student.programs) ? student.programs[0] : student.programs;
    const programName = joinedProgram?.name || 'Program not assigned';
    const nextSchedule = getNextClass(schedulesByStudentId.get(student.id) || []);

    return {
      id: student.id,
      name: getStudentDisplayName(student),
      programId: student.program_id,
      program: programName,
      assignedTeacherId: student.assigned_teacher_id,
      teacher: student.assigned_teacher_id ? teacherById.get(student.assigned_teacher_id) || 'Unassigned' : 'Unassigned',
      level: student.level || 'Placement pending',
      attendance: 'New',
      status: student.status || 'active',
      nextClass: nextSchedule ? nextSchedule.label : 'Schedule pending',
      scheduleNotes: student.schedule_notes,
      startDate: student.start_date,
    };
  }) satisfies StudentManagementRow[];
}

export async function fetchStudentActionLookups() {
  const [teacherOptions, programs] = await Promise.all([
    fetchActiveTeacherOptions(),
    fetchPrograms(),
  ]);

  return {
    teachers: teacherOptions.map((teacher) => ({
      id: teacher.profileId || teacher.id,
      teacherId: teacher.id,
      profileId: teacher.profileId || '',
      full_name: teacher.full_name,
      email: teacher.email,
      specialization: teacher.specialization || null,
      availability: teacher.availability || null,
    }) satisfies StudentActionTeacher).filter((teacher) => teacher.profileId),
    programs: programs as StudentProgramOption[],
  };
}

export async function assignStudentTeacher(studentId: string, selectedTeacherProfileId: string, note?: string) {
  const client = requireSupabase();

  if (!studentId || !uuidPattern.test(studentId)) {
    throw new Error('A valid student record is required before assigning a teacher.');
  }

  if (!selectedTeacherProfileId || !uuidPattern.test(selectedTeacherProfileId)) {
    throw new Error('Select a valid teacher before saving.');
  }

  const operationalTeacherId = await resolveOperationalTeacherId(selectedTeacherProfileId);

  if (!operationalTeacherId) {
    throw new Error('Selected teacher is not a valid teacher record.');
  }

  const { data: selectedTeacher, error: selectedTeacherError } = await client
    .from('teachers')
    .select('id, profile_id, full_name, status')
    .eq('profile_id', selectedTeacherProfileId)
    .maybeSingle();

  if (selectedTeacherError) {
    throw selectedTeacherError;
  }

  if (!selectedTeacher?.id || !selectedTeacher.profile_id) {
    throw new Error('Selected teacher record was not found.');
  }

  const { data: currentStudent, error: currentStudentError } = await client
    .from('students')
    .select('id, lead_id, student_name, program_id, assigned_teacher_id')
    .eq('id', studentId)
    .maybeSingle();

  if (currentStudentError) {
    throw currentStudentError;
  }

  if (!currentStudent?.id) {
    throw new Error('Student record was not found.');
  }

  const { data: currentProgram, error: currentProgramError } = currentStudent.program_id
    ? await client
      .from('programs')
      .select('id, name, slug, status')
      .eq('id', currentStudent.program_id)
      .maybeSingle()
    : { data: null, error: null };

  if (currentProgramError && import.meta.env.DEV) {
    console.warn('Assign teacher current program lookup failed:', currentProgramError);
  }

  const assignmentPayload = {
    assigned_teacher_id: operationalTeacherId,
    updated_at: getNowIso(),
  };

  if (import.meta.env.DEV) {
    console.log('Assign teacher save', {
      studentId,
      selectedTeacherProfileId,
      updatePayload: assignmentPayload,
      student: currentStudent,
      selectedTeacher,
      currentProgram,
      note: note || null,
    });
  }

  const { data, error } = await client
    .from('students')
    .update(assignmentPayload)
    .eq('id', studentId)
    .select()
    .single();

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Assign teacher failed', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        studentId,
        selectedTeacherProfileId,
        updatePayload: assignmentPayload,
      });
    }
    throw error;
  }

  if (!data) {
    throw new Error('Assignment failed: student not found or update blocked.');
  }

  const { data: verifiedStudent, error: verifyError } = await client
    .from('students')
    .select('id, assigned_teacher_id')
    .eq('id', studentId)
    .maybeSingle();

  if (verifyError) {
    if (import.meta.env.DEV) {
      console.error('Assign teacher verification failed', {
        studentId,
        selectedTeacherProfileId,
        operationalTeacherId,
        error: verifyError,
      });
    }
    throw verifyError;
  }

  if (verifiedStudent?.assigned_teacher_id !== operationalTeacherId) {
    if (import.meta.env.DEV) {
      console.error('Assign teacher verification mismatch', {
        studentId,
        selectedTeacherProfileId,
        operationalTeacherId,
        verifiedAssignedTeacherId: verifiedStudent?.assigned_teacher_id || null,
      });
    }
    throw new Error('Assignment saved but verification failed.');
  }

  const today = getAcademyTodayDate();
  await logNonBlockingAssignmentStep(
    'classes',
    client
      .from('classes')
      .update({ teacher_id: operationalTeacherId, updated_at: getNowIso() })
      .eq('student_id', studentId)
      .gte('class_date', today)
      .is('teacher_id', null),
  );

  if (currentStudent?.lead_id) {
    await logNonBlockingAssignmentStep(
      'lead',
      client.from('leads').update({ assigned_teacher_id: operationalTeacherId }).eq('id', currentStudent.lead_id),
    );
    await logNonBlockingAssignmentStep(
      'lead free trials',
      client.from('free_trials').update({ teacher_id: operationalTeacherId }).eq('lead_id', currentStudent.lead_id),
    );
  }

  await logNonBlockingAssignmentStep(
    'student free trials',
    client.from('free_trials').update({ teacher_id: operationalTeacherId }).eq('student_id', studentId),
  );

  try {
    const teacherProfileId = await resolveTeacherProfileId(operationalTeacherId);
    const { error: notificationError } = teacherProfileId
      ? await client.from('in_app_notifications').insert({
        recipient_id: teacherProfileId,
        title: 'New student assigned',
        message: 'A student has been assigned to you. Please review the student record and upcoming schedule.',
        type: 'class',
        related_entity_type: 'student',
        related_entity_id: studentId,
      })
      : { error: null };

    if (notificationError && import.meta.env.DEV) {
      console.info('Teacher assignment notification was not created:', notificationError.message);
    }
  } catch (notificationError) {
    if (import.meta.env.DEV) {
      console.info('Teacher assignment notification lookup failed:', notificationError);
    }
  }

  return data;
}

export async function updateStudentProgram(studentId: string, programId: string, note?: string) {
  const client = requireSupabase();
  const { data: currentStudent, error: currentStudentError } = await client
    .from('students')
    .select('program_id, schedule_notes')
    .eq('id', studentId)
    .maybeSingle();

  if (currentStudentError) {
    throw currentStudentError;
  }

  const scheduleNotes = [
    currentStudent?.schedule_notes || '',
    note ? `Program update note: ${note}` : '',
  ].filter(Boolean).join('\n');

  const { data, error } = await client
    .from('students')
    .update({
      program_id: programId,
      schedule_notes: scheduleNotes || currentStudent?.schedule_notes || null,
    })
    .eq('id', studentId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateStudentSetup(studentId: string, payload: {
  programId?: string | null;
  teacherProfileId?: string | null;
  level?: string;
  classDays?: string;
  classTime?: string;
  timezone?: string;
  paymentStatus?: string;
  startDate?: string;
  notes?: string;
}) {
  const client = requireSupabase();
  const selectedTeacherProfileId = payload.teacherProfileId || null;
  const operationalTeacherId = await resolveOperationalTeacherId(selectedTeacherProfileId);

  const scheduleNotes = [
    payload.notes,
    payload.classDays ? `Class days: ${payload.classDays}` : '',
    payload.classTime ? `Class time: ${payload.classTime}` : '',
    payload.timezone ? `Timezone: ${payload.timezone}` : '',
    payload.paymentStatus ? `Package/payment status: ${payload.paymentStatus}` : '',
  ].filter(Boolean).join('\n');
  const updatePayload = {
    program_id: payload.programId || null,
    assigned_teacher_id: operationalTeacherId,
    level: payload.level || null,
    start_date: payload.startDate || null,
    schedule_notes: scheduleNotes || null,
    status: 'active',
  };
  const { data, error } = await client.from('students').update(updatePayload).eq('id', studentId).select('*').single();

  if (error) {
    throw error;
  }

  if (payload.startDate && payload.classTime) {
    if (!operationalTeacherId) {
      throw new Error('Assign a teacher before saving schedule.');
    }

    await client.from('classes').upsert({
      student_id: studentId,
      teacher_id: operationalTeacherId,
      program_id: payload.programId || null,
      class_date: payload.startDate,
      start_time: payload.classTime,
      end_time: calculateEndTime(payload.classTime, 30),
      duration_minutes: 30,
      meeting_link: null,
      lesson_title: 'Initial scheduled class',
      status: 'scheduled',
    }, { onConflict: 'id' });
  }

  return data;
}

export async function updateStudentSchedule(studentId: string, payload: {
  teacherProfileId?: string | null;
  programId?: string | null;
  schedules?: StudentSchedulePayload[];
  timezone?: string;
  startDate?: string;
  notes?: string;
}) {
  const client = requireSupabase();
  const selectedTeacherProfileId = payload.teacherProfileId || null;
  const operationalTeacherId = await resolveOperationalTeacherId(selectedTeacherProfileId);

  if (!payload.programId) {
    throw new Error('Program is required before setting a schedule.');
  }

  if (!selectedTeacherProfileId || !operationalTeacherId) {
    throw new Error('Teacher is required before setting a schedule.');
  }

  if (!payload.schedules?.length) {
    throw new Error('Please add at least one class day.');
  }

  const scheduleNotes = [
    payload.notes,
    payload.timezone ? `Timezone: ${payload.timezone}` : '',
  ].filter(Boolean).join('\n');

  const { data, error } = await client.from('students').update({
    program_id: payload.programId || null,
    assigned_teacher_id: operationalTeacherId,
    schedule_notes: scheduleNotes || null,
    start_date: payload.startDate || null,
    updated_at: getNowIso(),
  }).eq('id', studentId).select('*').single();

  if (error) {
    throw error;
  }

  await replaceStudentClassSchedules({
    studentId,
    programId: payload.programId,
    teacherProfileId: selectedTeacherProfileId,
    timezone: payload.timezone || 'Africa/Cairo',
    schedules: payload.schedules || [],
  });

  return data;
}

function calculateEndTime(startTime: string, durationMinutes: number) {
  const [hours = 0, minutes = 0] = startTime.split(':').map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  start.setMinutes(start.getMinutes() + durationMinutes);
  return start.toTimeString().slice(0, 8);
}

function buildScheduledClassRows(studentId: string, payload: {
  teacherId?: string | null;
  programId?: string | null;
  classDays?: string;
  classTime?: string;
  durationMinutes?: number;
  meetingLink?: string;
  startDate?: string;
  notes?: string;
}) {
  const durationMinutes = payload.durationMinutes || 30;
  const startDate = payload.startDate || getAcademyTodayDate();
  const classTime = payload.classTime || '00:00';
  const scheduledDates = getUpcomingClassDates(startDate, payload.classDays);

  return scheduledDates.map((classDate, index) => ({
    student_id: studentId,
    teacher_id: payload.teacherId || null,
    program_id: payload.programId || null,
    class_date: classDate,
    start_time: classTime,
    end_time: calculateEndTime(classTime, durationMinutes),
    duration_minutes: durationMinutes,
    meeting_link: payload.meetingLink || null,
    lesson_title: index === 0 ? 'Scheduled class' : 'Recurring scheduled class',
    lesson_covered: null,
    homework: null,
    status: 'scheduled',
  }));
}

function getUpcomingClassDates(startDate: string, classDays?: string) {
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return [getAcademyTodayDate()];
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const requestedDays = new Set((classDays || '')
    .toLowerCase()
    .split(/[,;/\s]+/)
    .map((day) => day.trim())
    .filter(Boolean));
  const hasDayRule = requestedDays.size > 0;
  const dates: string[] = [];

  for (let offset = 0; offset < 28 && dates.length < 12; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);
    const dayName = dayNames[candidate.getDay()];
    const matchesRule = !hasDayRule || requestedDays.has(dayName) || requestedDays.has(dayName.slice(0, 3));

    if (matchesRule) {
      dates.push(candidate.toISOString().slice(0, 10));
    }
  }

  return dates.length ? dates : [start.toISOString().slice(0, 10)];
}

export async function updateStudentLevel(studentId: string, level: string, note?: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('students')
    .update({ level, schedule_notes: note ? `Level update note: ${note}` : undefined })
    .eq('id', studentId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const { error: historyError } = await client.from('student_level_history').insert({
    student_id: studentId,
    new_level: level,
    reason: note || null,
  });

  if (historyError && import.meta.env.DEV) {
    console.info('student_level_history is not configured:', historyError.message);
  }

  return data;
}

export async function deactivateStudent(studentId: string, reason: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('students')
    .update({ status: 'inactive', schedule_notes: `Deactivation reason: ${reason}` })
    .eq('id', studentId)
    .select('id, profile_id')
    .single();

  if (error) {
    throw error;
  }

  if (data.profile_id) {
    await client.from('profiles').update({ status: 'inactive' }).eq('id', data.profile_id);
  }

  return data;
}

export async function fetchStudentAttendanceRecords(studentId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('attendance')
    .select('id, class_id, status, notes, marked_at')
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false });

  if (error) {
    throw error;
  }

  const classIds = Array.from(new Set((data || []).map((record) => record.class_id).filter(Boolean))) as string[];
  const { data: classes } = classIds.length
    ? await client.from('classes').select('id, class_date, start_time').in('id', classIds)
    : { data: [] };
  const classById = new Map((classes || []).map((classRow) => [classRow.id, classRow]));

  return (data || []).map((record) => {
    const classRow = record.class_id ? classById.get(record.class_id) : null;
    return {
      ...record,
      classDate: classRow?.class_date || null,
      classTime: classRow?.start_time || null,
    } satisfies StudentAttendanceRecord;
  });
}

export async function fetchStudentPaymentRecords(studentId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('payments')
    .select('id, currency, amount, payment_method, payment_date, next_due_date, status, notes')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as StudentPaymentRecord[];
}

export async function fetchStudentRecord(studentId?: string | null) {
  if (!studentId) {
    return emptyStudentRecord;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('students')
    .select('id, profile_id, student_name, parent_name, whatsapp, country, age, program_id, level, assigned_teacher_id, schedule_notes, start_date, status, programs:program_id(id, name), profiles:profile_id(id, email, phone, timezone, preferred_language, preferred_class_time, notification_preferences, parent_communication_preferences)')
    .eq('id', studentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return emptyStudentRecord;
  }

  const [teacherNames, classes, attendance, homeworkAssignments, evaluations, payments, messages] = await Promise.all([
    data.assigned_teacher_id ? resolveTeacherNamesById([data.assigned_teacher_id]) : Promise.resolve(new Map<string, string>()),
    client.from('classes').select('id, class_date, start_time, status, lesson_covered, homework, next_lesson_plan').eq('student_id', studentId).order('class_date', { ascending: false }).limit(20),
    client.from('attendance').select('id, status, notes, marked_at').eq('student_id', studentId).order('marked_at', { ascending: false }).limit(20),
    client.from('homework_assignments').select('id, title, status, due_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
    client.from('evaluations').select('id, recitation_rating, tajweed_rating, understanding_rating, behavior_rating, progress_feedback, teacher_notes, created_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
    client.from('payments').select('id, currency, amount, status, sessions_included, sessions_remaining, next_due_date, teacher_cost, net_revenue, notes').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
    data.profile_id ? client.from('messages').select('id, subject, body, read_at, created_at').or(`sender_id.eq.${data.profile_id},receiver_id.eq.${data.profile_id}`).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
  ]);

  const classRows = classes.data || [];
  const attendanceRows = attendance.data || [];
  const evaluationRows = evaluations.data || [];
  const paymentRows = payments.data || [];
  const activeAttendance = attendanceRows.filter((record) => !['excused', 'cancelled'].includes(String(record.status)));
  const presentCount = activeAttendance.filter((record) => record.status === 'present' || record.status === 'late').length;
  const attendanceRate = activeAttendance.length ? `${Math.round((presentCount / activeAttendance.length) * 100)}%` : '0%';
  const completedClasses = classRows.filter((record) => record.status === 'completed');
  const ratingValues = evaluationRows.flatMap((evaluation) => [
    evaluation.recitation_rating,
    evaluation.tajweed_rating,
    evaluation.understanding_rating,
    evaluation.behavior_rating,
  ]).map(Number).filter((value) => Number.isFinite(value));
  const progressPercentage = ratingValues.length ? `${Math.round((ratingValues.reduce((sum, value) => sum + value, 0) / (ratingValues.length * 5)) * 100)}%` : '0%';
  const nextClass = classRows.find((record) => ['scheduled', 'live', 'rescheduled'].includes(String(record.status)));
  const latestPayment = paymentRows[0];
  const latestEvaluation = evaluationRows[0];
  const program = Array.isArray(data.programs) ? data.programs[0] : data.programs;
  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const teacherName = data.assigned_teacher_id ? teacherNames.get(data.assigned_teacher_id) || 'No teacher assigned' : 'No teacher assigned';
  const valueByKey: Record<string, string> = {
    student_name: data.student_name || '',
    parent_name: data.parent_name || '',
    parent_whatsapp: data.whatsapp || profile?.phone || '',
    country: data.country || '',
    age: data.age || '',
    current_program: program?.name || 'Program not assigned',
    approved_level: data.level || 'Level not set',
    assigned_teacher: teacherName,
    schedule_days: data.schedule_notes || '',
    class_time: nextClass?.start_time || '',
    timezone: profile?.timezone || 'Africa/Cairo',
    meeting_link: '',
    trial_status: 'See trials tab',
    trial_feedback: latestEvaluation?.teacher_notes || '',
    recommended_level: data.level || '',
    class_attendance: `${completedClasses.length} completed classes`,
    class_report: classRows.find((record) => record.lesson_covered)?.lesson_covered || 'No class report recorded',
    next_lesson_plan: classRows.find((record) => record.next_lesson_plan)?.next_lesson_plan || '',
    attendance: attendanceRows[0]?.status || 'No attendance records',
    attendance_note: attendanceRows[0]?.notes || '',
    attendance_rate: attendanceRate,
    homework: homeworkAssignments.data?.[0]?.title || 'No homework assigned',
    homework_status: homeworkAssignments.data?.[0]?.status || 'No homework status',
    recitation_rating: String(latestEvaluation?.recitation_rating || ''),
    tajweed_rating: String(latestEvaluation?.tajweed_rating || ''),
    understanding_rating: String(latestEvaluation?.understanding_rating || ''),
    behavior_rating: String(latestEvaluation?.behavior_rating || ''),
    progress_feedback: latestEvaluation?.progress_feedback || '',
    teacher_notes: latestEvaluation?.teacher_notes || '',
    completed_lessons: String(completedClasses.length),
    overall_progress: progressPercentage,
    package_name: latestPayment?.notes || 'No package record',
    payment_status: latestPayment?.status || 'No payment record',
    sessions_included: String(latestPayment?.sessions_included ?? ''),
    sessions_remaining: String(latestPayment?.sessions_remaining ?? ''),
    next_due_date: latestPayment?.next_due_date || '',
    teacher_cost: String(latestPayment?.teacher_cost ?? ''),
    net_revenue: String(latestPayment?.net_revenue ?? ''),
    invoice_notes: latestPayment?.notes || '',
    latest_message: messages.data?.[0]?.subject || 'No messages',
    preferred_language: profile?.preferred_language || '',
    preferred_class_time: profile?.preferred_class_time || '',
  };

  return {
    ...emptyStudentRecord,
    id: data.id,
    name: getStudentDisplayName(data) || emptyStudentRecord.name,
    status: data.status || emptyStudentRecord.status,
    program: program?.name || emptyStudentRecord.program,
    level: data.level || emptyStudentRecord.level,
    teacher: teacherName,
    nextClass: nextClass ? `${nextClass.class_date} ${nextClass.start_time || ''}`.trim() : 'No upcoming class',
    attendanceRate,
    progressPercentage,
    sections: Object.fromEntries(Object.entries(emptyStudentRecord.sections).map(([tab, sections]) => [
        tab,
        sections.map((section) => ({
          ...section,
          fields: section.fields.map((field) => (
            valueByKey[field.key] !== undefined ? { ...field, value: String(valueByKey[field.key]) } : field
          )),
        })),
      ])) as Record<StudentRecordTab, StudentRecordSection[]>,
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

export async function updateStudentPreferences(_studentId: string, _payload: Record<string, string>) {
  throw new Error('Student preference editing is not available until preference columns are finalized.');
}
