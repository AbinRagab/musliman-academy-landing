import { supabase } from '../../lib/supabaseClient';
import { getAcademyTodayDate } from './dateUtils';
import { getSignedFileUrl, PAYMENT_DOCUMENTS_BUCKET } from './storageService';
import { resolveOperationalTeacherId } from './teachersService';

type Row = Record<string, any>;

export type AdminOpsRow = Record<string, string | number | boolean | null | undefined>;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

function formatDateTime(date?: string | null, time?: string | null) {
  const parts = [date || 'Date not set', time ? String(time).slice(0, 5) : 'Time not set'];
  return parts.join(' ');
}

function nameFromProfile(profile?: Row | Row[] | null, fallback = 'Not assigned') {
  const row = Array.isArray(profile) ? profile[0] : profile;
  return row?.full_name || row?.email || fallback;
}

function nameFromTeacher(teacher?: Row | Row[] | null, fallback = 'Teacher not assigned') {
  const row = Array.isArray(teacher) ? teacher[0] : teacher;
  return row?.profiles?.full_name || row?.full_name || fallback;
}

function nameFromStudent(student?: Row | Row[] | null, fallback = 'Student not assigned') {
  const row = Array.isArray(student) ? student[0] : student;
  return row?.student_name || row?.profiles?.full_name || fallback;
}

function nameFromProgram(program?: Row | Row[] | null, fallback = 'Program not assigned') {
  const row = Array.isArray(program) ? program[0] : program;
  return row?.name || fallback;
}

export async function fetchAdminTrialRows(): Promise<AdminOpsRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('free_trials')
    .select(`
      id, lead_id, student_id, teacher_id, program_id, trial_date, trial_time, meeting_link,
      status, teacher_feedback, parent_feedback, result, updated_at,
      leads:lead_id(id, full_name, whatsapp, status, program_name),
      students:student_id(id, student_name, whatsapp),
      teachers:teacher_id(id, full_name, profiles:profile_id(full_name, email)),
      programs:program_id(id, name)
    `)
    .order('trial_date', { ascending: false, nullsFirst: false })
    .order('trial_time', { ascending: true, nullsFirst: false });

  if (error) throw error;

  return (data || []).map((trial: Row) => {
    const lead = Array.isArray(trial.leads) ? trial.leads[0] : trial.leads;
    const student = Array.isArray(trial.students) ? trial.students[0] : trial.students;
    return {
      id: trial.id,
      leadId: trial.lead_id,
      studentId: trial.student_id,
      teacherId: trial.teacher_id,
      programId: trial.program_id,
      student: student?.student_name || lead?.full_name || 'Trial learner',
      lead: lead?.full_name || 'Lead not linked',
      whatsapp: student?.whatsapp || lead?.whatsapp || 'Not provided',
      program: nameFromProgram(trial.programs, lead?.program_name || 'Program not assigned'),
      teacher: nameFromTeacher(trial.teachers),
      trialDate: trial.trial_date || '',
      trialTime: trial.trial_time ? String(trial.trial_time).slice(0, 5) : '',
      dateTime: formatDateTime(trial.trial_date, trial.trial_time),
      meetingLink: trial.meeting_link || '',
      status: trial.status || 'scheduled',
      teacherFeedback: trial.teacher_feedback || 'No teacher feedback recorded',
      parentFeedback: trial.parent_feedback || 'No parent feedback recorded',
      result: trial.result || 'No result recorded',
      recommendedLevel: trial.result || 'Not recorded',
    };
  });
}

export async function assignTrialTeacher(trialId: string, teacherIdOrProfileId: string) {
  const client = requireSupabase();
  const teacherId = await resolveOperationalTeacherId(teacherIdOrProfileId);
  if (!teacherId) throw new Error('Select a valid operational teacher.');

  const { data, error } = await client
    .from('free_trials')
    .update({ teacher_id: teacherId, updated_at: new Date().toISOString() })
    .eq('id', trialId)
    .select('id, lead_id, teacher_id')
    .single();

  if (error) throw error;

  if (data?.lead_id) {
    await client.from('leads').update({ assigned_teacher_id: teacherId }).eq('id', data.lead_id);
    await client.from('lead_activity_logs').insert({
      lead_id: data.lead_id,
      action_type: 'trial_teacher_assigned',
      description: 'Teacher assigned to free trial.',
      new_value: teacherId,
    });
  }

  return data;
}

export async function rescheduleTrial(trialId: string, payload: { trialDate: string; trialTime: string; meetingLink?: string }) {
  const client = requireSupabase();
  if (!payload.trialDate || !payload.trialTime) throw new Error('Trial date and time are required.');

  const { data, error } = await client
    .from('free_trials')
    .update({
      trial_date: payload.trialDate,
      trial_time: payload.trialTime,
      meeting_link: payload.meetingLink || null,
      status: 'rescheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', trialId)
    .select('id, lead_id')
    .single();

  if (error) throw error;
  if (data?.lead_id) {
    await client.from('leads').update({ status: 'trial_scheduled' }).eq('id', data.lead_id);
    await client.from('lead_activity_logs').insert({
      lead_id: data.lead_id,
      action_type: 'trial_rescheduled',
      description: `Trial rescheduled to ${payload.trialDate} ${payload.trialTime}.`,
    });
  }
  return data;
}

export async function updateTrialOutcome(trialId: string, status: 'completed' | 'no_show', result?: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('free_trials')
    .update({ status, result: result || status, updated_at: new Date().toISOString() })
    .eq('id', trialId)
    .select('id, lead_id')
    .single();

  if (error) throw error;
  if (data?.lead_id) {
    await client.from('leads').update({ status: status === 'completed' ? 'trial_completed' : 'no_response' }).eq('id', data.lead_id);
    await client.from('lead_activity_logs').insert({
      lead_id: data.lead_id,
      action_type: `trial_${status}`,
      description: status === 'completed' ? 'Free trial marked completed.' : 'Free trial marked no-show.',
    });
  }
  return data;
}

export async function convertTrialToStudent(trialId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('convert_trial_to_student', { p_trial_id: trialId });
  if (error) throw error;
  return data;
}

export async function fetchAdminClassRows(): Promise<AdminOpsRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('classes')
    .select(`
      id, schedule_id, student_id, teacher_id, program_id, class_date, start_time, end_time,
      duration_minutes, meeting_link, lesson_title, lesson_covered, homework, next_lesson_plan,
      status, cancellation_reason, cancelled_at, rescheduled_at,
      students:student_id(id, student_name),
      teachers:teacher_id(id, full_name, profiles:profile_id(full_name, email)),
      programs:program_id(id, name),
      attendance:attendance(id, status, admin_review_status),
      homework_assignments:homework_assignments(id, status)
    `)
    .order('class_date', { ascending: false })
    .order('start_time', { ascending: false, nullsFirst: false })
    .limit(250);

  if (error) throw error;

  return (data || []).map((classRow: Row) => {
    const attendance = Array.isArray(classRow.attendance) ? classRow.attendance[0] : classRow.attendance;
    const assignments = Array.isArray(classRow.homework_assignments) ? classRow.homework_assignments : [];
    const reportSubmitted = Boolean(classRow.lesson_covered || classRow.next_lesson_plan || classRow.homework);
    return {
      id: classRow.id,
      scheduleId: classRow.schedule_id,
      studentId: classRow.student_id,
      teacherId: classRow.teacher_id,
      programId: classRow.program_id,
      className: `${nameFromProgram(classRow.programs, 'Class')} with ${nameFromStudent(classRow.students)}`,
      time: formatDateTime(classRow.class_date, classRow.start_time),
      classDate: classRow.class_date || '',
      startTime: classRow.start_time ? String(classRow.start_time).slice(0, 5) : '',
      durationMinutes: classRow.duration_minutes || 30,
      teacher: nameFromTeacher(classRow.teachers),
      students: nameFromStudent(classRow.students),
      program: nameFromProgram(classRow.programs),
      meeting: classRow.meeting_link || '',
      meetingLink: classRow.meeting_link || '',
      status: classRow.status || 'scheduled',
      attendanceSubmitted: attendance ? attendance.status : 'pending',
      attendanceState: attendance ? attendance.status : 'pending',
      reportSubmitted: reportSubmitted ? 'Submitted' : 'Pending',
      homeworkSet: assignments.length ? 'Assigned' : classRow.homework ? 'Legacy note' : 'Not set',
      lesson: classRow.lesson_covered || classRow.lesson_title || 'Not recorded',
      nextLessonPlan: classRow.next_lesson_plan || '',
      cancellationReason: classRow.cancellation_reason || '',
    };
  });
}

export async function rescheduleClassOccurrence(classId: string, payload: { classDate: string; startTime: string; durationMinutes: number; meetingLink?: string; reason?: string }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('reschedule_class_occurrence', {
    p_class_id: classId,
    p_class_date: payload.classDate,
    p_start_time: payload.startTime,
    p_duration_minutes: payload.durationMinutes,
    p_meeting_link: payload.meetingLink || null,
    p_reason: payload.reason || null,
  });
  if (error) throw error;
  return data;
}

export async function cancelClassOccurrence(classId: string, reason: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('cancel_class_occurrence', { p_class_id: classId, p_reason: reason || null });
  if (error) throw error;
  return data;
}

export async function saveAdminHomework(classRow: AdminOpsRow, payload: { title: string; instructions: string; dueAt?: string }) {
  const client = requireSupabase();
  if (!classRow.id || !classRow.studentId || !classRow.teacherId) {
    throw new Error('Class, student, and teacher are required before assigning homework.');
  }
  const { data, error } = await client.from('homework_assignments').upsert({
    class_id: classRow.id,
    student_id: classRow.studentId,
    teacher_id: classRow.teacherId,
    title: payload.title,
    instructions: payload.instructions,
    due_at: payload.dueAt || null,
    status: 'assigned',
  }, { onConflict: 'class_id,student_id,teacher_id' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function fetchAdminAttendanceRows(): Promise<AdminOpsRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('attendance')
    .select(`
      id, class_id, student_id, teacher_id, status, notes, marked_at, admin_review_status,
      follow_up_status, correction_note,
      classes:class_id(id, class_date, start_time, program_id, lesson_title, status),
      students:student_id(id, student_name),
      teachers:teacher_id(id, full_name, profiles:profile_id(full_name, email)),
      profiles:marked_by(id, full_name, email)
    `)
    .order('marked_at', { ascending: false })
    .limit(250);

  if (error) throw error;

  const programIds = Array.from(new Set((data || []).map((record: Row) => record.classes?.program_id).filter(Boolean)));
  const { data: programs } = programIds.length
    ? await client.from('programs').select('id, name').in('id', programIds)
    : { data: [] };
  const programById = new Map((programs || []).map((program: Row) => [program.id, program.name]));

  return (data || []).map((record: Row) => ({
    id: record.id,
    classId: record.class_id,
    studentId: record.student_id,
    teacherId: record.teacher_id,
    student: nameFromStudent(record.students),
    teacher: nameFromTeacher(record.teachers),
    program: record.classes?.program_id ? programById.get(record.classes.program_id) || 'Program not assigned' : 'Program not assigned',
    className: record.classes?.lesson_title || formatDateTime(record.classes?.class_date, record.classes?.start_time),
    classDate: record.classes?.class_date || '',
    classTime: record.classes?.start_time ? String(record.classes.start_time).slice(0, 5) : '',
    status: record.status,
    notes: record.notes || 'No notes',
    markedAt: record.marked_at || '',
    submittedAt: record.marked_at || '',
    submittedBy: nameFromProfile(record.profiles, 'Teacher'),
    adminReviewStatus: record.admin_review_status || 'pending',
    followUpStatus: record.follow_up_status || ((record.status === 'absent' || record.status === 'late') ? 'open' : 'not_required'),
    correctionNote: record.correction_note || '',
  }));
}

export async function reviewAttendance(attendanceId: string, reviewStatus: 'confirmed' | 'correction_requested', note?: string) {
  const client = requireSupabase();
  const patch: Row = {
    admin_review_status: reviewStatus,
    reviewed_at: new Date().toISOString(),
  };
  if (reviewStatus === 'correction_requested') {
    patch.correction_requested_at = new Date().toISOString();
    patch.correction_note = note || null;
    patch.follow_up_status = 'open';
  }
  const { data, error } = await client.from('attendance').update(patch).eq('id', attendanceId).select('*').single();
  if (error) throw error;
  return data;
}

export async function markAttendanceFollowUpDone(attendanceId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('attendance')
    .update({ follow_up_status: 'done', reviewed_at: new Date().toISOString() })
    .eq('id', attendanceId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createAdminMessage(payload: {
  receiverId?: string | null;
  subject: string;
  body: string;
  relatedStudentId?: string | null;
  relatedClassId?: string | null;
  relatedTrialId?: string | null;
  category?: string;
}) {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user?.id) throw new Error('You must be signed in to send messages.');

  const receiverId = payload.receiverId || await resolveAdminRecipient();
  const { data, error } = await client.from('messages').insert({
    sender_id: userData.user.id,
    receiver_id: receiverId,
    subject: payload.subject,
    body: payload.body,
    related_student_id: payload.relatedStudentId || null,
    related_class_id: payload.relatedClassId || null,
    related_trial_id: payload.relatedTrialId || null,
    category: payload.category || 'admin_request',
  }).select('*').single();
  if (error) throw error;
  return data;
}

async function resolveAdminRecipient() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .in('role', ['super_admin', 'admin', 'academic_manager'])
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error('No active admin recipient is configured.');
  return data.id;
}

export async function fetchAdminPaymentRows(): Promise<AdminOpsRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('payments')
    .select(`
      id, student_id, program_id, package_id, currency, amount, payment_method, payment_date,
      next_due_date, status, sessions_included, sessions_remaining, teacher_cost, net_revenue,
      receipt_url, receipt_file_path, invoice_url, invoice_file_path, notes, created_at,
      students:student_id(id, student_name),
      programs:program_id(id, name),
      payment_packages:package_id(id, name, sessions_count)
    `)
    .order('next_due_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) throw error;

  return (data || []).map((payment: Row) => ({
    id: payment.id,
    studentId: payment.student_id,
    programId: payment.program_id,
    packageId: payment.package_id,
    student: nameFromStudent(payment.students),
    program: nameFromProgram(payment.programs),
    packageName: payment.payment_packages?.name || payment.notes || 'Package not selected',
    amount: payment.amount ?? 0,
    currency: payment.currency || 'USD',
    paymentMethod: payment.payment_method || '',
    paidDate: payment.payment_date || '',
    nextDue: payment.next_due_date || '',
    status: payment.status || 'pending',
    sessionsIncluded: payment.sessions_included ?? payment.payment_packages?.sessions_count ?? 0,
    remainingSessions: payment.sessions_remaining ?? 0,
    teacherCost: payment.teacher_cost ?? 0,
    netRevenue: payment.net_revenue ?? 0,
    receiptUrl: payment.receipt_url || '',
    receiptFilePath: payment.receipt_file_path || '',
    invoiceUrl: payment.invoice_url || '',
    invoiceFilePath: payment.invoice_file_path || '',
    notes: payment.notes || '',
  }));
}

export async function saveAdminPayment(payload: AdminOpsRow) {
  const client = requireSupabase();
  if (!payload.studentId) throw new Error('Student is required.');
  if (!payload.amount) throw new Error('Amount is required.');
  const body = {
    student_id: payload.studentId,
    program_id: payload.programId || null,
    package_id: payload.packageId || null,
    currency: String(payload.currency || 'USD').toUpperCase(),
    amount: Number(payload.amount),
    payment_method: payload.paymentMethod || null,
    payment_date: payload.paidDate || null,
    next_due_date: payload.nextDue || null,
    status: payload.status || 'pending',
    sessions_included: Number(payload.sessionsIncluded || 0),
    sessions_remaining: Number(payload.remainingSessions || payload.sessionsIncluded || 0),
    teacher_cost: Number(payload.teacherCost || 0),
    net_revenue: Number(payload.netRevenue || 0),
    receipt_url: payload.receiptUrl || null,
    receipt_file_path: payload.receiptFilePath || null,
    invoice_url: payload.invoiceUrl || null,
    invoice_file_path: payload.invoiceFilePath || null,
    notes: payload.notes || null,
  };
  const query = payload.id
    ? client.from('payments').update(body).eq('id', payload.id).select('*').single()
    : client.from('payments').insert(body).select('*').single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updatePaymentStatus(paymentId: string, status: string) {
  const client = requireSupabase();
  const patch: Row = { status, updated_at: new Date().toISOString() };
  if (status === 'refunded') patch.refunded_at = new Date().toISOString();
  if (status === 'cancelled') patch.cancelled_at = new Date().toISOString();
  const { data, error } = await client.from('payments').update(patch).eq('id', paymentId).select('*').single();
  if (error) throw error;
  return data;
}

export async function openPaymentReceipt(row: AdminOpsRow) {
  if (row.receiptFilePath) {
    return getSignedFileUrl(PAYMENT_DOCUMENTS_BUCKET, String(row.receiptFilePath));
  }
  if (row.receiptUrl) return String(row.receiptUrl);
  throw new Error('No receipt is attached to this payment.');
}

export async function fetchAdminReportRows(): Promise<AdminOpsRow[]> {
  const client = requireSupabase();
  const today = getAcademyTodayDate();
  const [
    leads,
    students,
    trials,
    classes,
    attendance,
    evaluations,
    warnings,
    payments,
  ] = await Promise.all([
    client.from('leads').select('id, status, program_id, created_at'),
    client.from('students').select('id, status, program_id, assigned_teacher_id'),
    client.from('free_trials').select('id, status, program_id, teacher_id, trial_date'),
    client.from('classes').select('id, status, program_id, teacher_id, lesson_covered, homework, next_lesson_plan, class_date'),
    client.from('attendance').select('id, status, class_id'),
    client.from('evaluations').select('id, class_id, teacher_id, student_id'),
    client.from('teacher_warnings').select('id, teacher_id, status, warning_type'),
    client.from('payments').select('id, status, amount, teacher_cost, net_revenue, currency, program_id'),
  ]);

  const errors = [leads, students, trials, classes, attendance, evaluations, warnings, payments].map((result) => result.error).filter(Boolean);
  if (errors.length) throw errors[0];

  const leadRows = leads.data || [];
  const studentRows = students.data || [];
  const trialRows = trials.data || [];
  const classRows = classes.data || [];
  const attendanceRows = attendance.data || [];
  const evaluationRows = evaluations.data || [];
  const warningRows = warnings.data || [];
  const paymentRows = payments.data || [];
  const reportCompletion = classRows.length
    ? Math.round((classRows.filter((row: Row) => row.lesson_covered || row.homework || row.next_lesson_plan).length / classRows.length) * 100)
    : 0;
  const evaluatedClassIds = new Set(evaluationRows.map((row: Row) => row.class_id).filter(Boolean));
  const completedClasses = classRows.filter((row: Row) => row.status === 'completed');
  const attendanceCount = attendanceRows.length;
  const presentOrLate = attendanceRows.filter((row: Row) => row.status === 'present' || row.status === 'late').length;
  const paidRows = paymentRows.filter((row: Row) => row.status === 'paid');
  const gross = paidRows.reduce((sum: number, row: Row) => sum + Number(row.amount || 0), 0);
  const teacherCost = paidRows.reduce((sum: number, row: Row) => sum + Number(row.teacher_cost || 0), 0);

  return [
    metric('Admissions', 'Leads', leadRows.length, 'completed', today),
    metric('Admissions', 'Contacted', leadRows.filter((row: Row) => row.status === 'contacted').length, 'completed', today),
    metric('Admissions', 'Trials scheduled', trialRows.filter((row: Row) => row.status === 'scheduled' || row.status === 'rescheduled').length, 'scheduled', today),
    metric('Admissions', 'Trials completed', trialRows.filter((row: Row) => row.status === 'completed' || row.status === 'converted').length, 'completed', today),
    metric('Admissions', 'Enrolled', leadRows.filter((row: Row) => row.status === 'enrolled').length, 'completed', today),
    metric('Admissions', 'Conversion rate', percent(leadRows.filter((row: Row) => row.status === 'enrolled').length, leadRows.length), 'completed', today),
    metric('Academic', 'Active students', studentRows.filter((row: Row) => row.status === 'active').length, 'active', today),
    metric('Academic', 'Completed classes', completedClasses.length, 'completed', today),
    metric('Academic', 'Class report completion', `${reportCompletion}%`, reportCompletion >= 80 ? 'completed' : 'pending', today),
    metric('Academic', 'Evaluation completion', percent(completedClasses.filter((row: Row) => evaluatedClassIds.has(row.id)).length, completedClasses.length), 'completed', today),
    metric('Academic', 'Pending evaluations', completedClasses.filter((row: Row) => !evaluatedClassIds.has(row.id)).length, 'pending', today),
    metric('Attendance', 'Present', attendanceRows.filter((row: Row) => row.status === 'present').length, 'present', today),
    metric('Attendance', 'Absent', attendanceRows.filter((row: Row) => row.status === 'absent').length, 'absent', today),
    metric('Attendance', 'Late', attendanceRows.filter((row: Row) => row.status === 'late').length, 'late', today),
    metric('Attendance', 'Excused', attendanceRows.filter((row: Row) => row.status === 'excused').length, 'completed', today),
    metric('Attendance', 'Attendance percentage', percent(presentOrLate, attendanceCount), 'completed', today),
    metric('Teachers', 'Students assigned', studentRows.filter((row: Row) => row.assigned_teacher_id).length, 'active', today),
    metric('Teachers', 'Classes completed', completedClasses.length, 'completed', today),
    metric('Teachers', 'Late/no-show warnings', warningRows.length, warningRows.length ? 'pending' : 'completed', today),
    metric('Teachers', 'Report completion', `${reportCompletion}%`, reportCompletion >= 80 ? 'completed' : 'pending', today),
    metric('Finance', 'Paid', paymentRows.filter((row: Row) => row.status === 'paid').length, 'paid', today),
    metric('Finance', 'Pending', paymentRows.filter((row: Row) => row.status === 'pending').length, 'pending', today),
    metric('Finance', 'Overdue', paymentRows.filter((row: Row) => row.status === 'overdue').length, 'overdue', today),
    metric('Finance', 'Gross revenue', gross, 'paid', today),
    metric('Finance', 'Teacher cost', teacherCost, 'paid', today),
    metric('Finance', 'Net revenue', gross - teacherCost, 'paid', today),
  ];
}

function metric(category: string, report: string, value: string | number, status: string, period: string): AdminOpsRow {
  return {
    id: `${category}-${report}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category,
    report,
    owner: category === 'Finance' ? 'Finance' : category === 'Academic' || category === 'Teachers' ? 'Academic Manager' : 'Admin',
    period,
    status,
    metric: String(value),
    exportFormat: 'CSV',
  };
}

function percent(part: number, total: number) {
  return total ? `${Math.round((part / total) * 100)}%` : '0%';
}

export async function fetchAcademySettingsRows(): Promise<AdminOpsRow[]> {
  const client = requireSupabase();
  const { data: settings, error: settingsError } = await client.from('academy_settings').select('key, value, updated_at').order('key');
  if (settingsError) throw settingsError;
  const { data: permissions, error: permissionsError } = await client.from('role_permissions').select('role, permission_key');
  if (permissionsError) throw permissionsError;

  const permissionAreas = ['leads', 'students', 'teachers', 'free-trials', 'classes', 'attendance', 'payments', 'reports', 'settings'];
  const permissionRows = permissionAreas.map((area) => ({
    id: `permission-${area}`,
    area,
    superAdmin: true,
    admin: (permissions || []).some((row: Row) => row.role === 'admin' && String(row.permission_key).includes(area)),
    teacher: ['classes', 'attendance'].includes(area),
    student: ['classes', 'attendance', 'payments'].includes(area),
    finance: area === 'payments',
    status: 'active',
  }));

  const settingRows = (settings || []).map((setting: Row) => ({
    id: `setting-${setting.key}`,
    area: setting.key,
    superAdmin: true,
    admin: true,
    teacher: false,
    student: false,
    finance: String(setting.key).includes('payment'),
    status: 'active',
    value: JSON.stringify(setting.value || {}),
    updatedAt: setting.updated_at || '',
  }));

  return [...permissionRows, ...settingRows];
}

export async function saveAcademySetting(key: string, value: Record<string, unknown>) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('set_academy_setting', { p_key: key, p_value: value });
  if (error) throw error;
  return data;
}

export async function upsertProgram(payload: { id?: string; name: string; description?: string; status?: string }) {
  const client = requireSupabase();
  const body = {
    name: payload.name,
    slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: payload.description || null,
    status: payload.status || 'active',
  };
  const query = payload.id
    ? client.from('programs').update(body).eq('id', payload.id).select('*').single()
    : client.from('programs').insert(body).select('*').single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateTeacherAvailability(teacherId: string, availability: Record<string, unknown>, timezone: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('teachers')
    .update({
      availability_json: availability,
      availability: JSON.stringify({ timezone, weekly: availability }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', teacherId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeacherStatus(teacherId: string, status: 'active' | 'inactive') {
  const client = requireSupabase();
  const { data: teacher, error } = await client
    .from('teachers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', teacherId)
    .select('id, profile_id, status')
    .single();
  if (error) throw error;

  if (teacher?.profile_id) {
    await client.from('profiles').update({ status: status === 'active' ? 'active' : 'inactive' }).eq('id', teacher.profile_id);
  }

  if (status === 'inactive') {
    await client.from('class_schedules').update({ status: 'archived' }).eq('teacher_profile_id', teacher.profile_id).eq('status', 'active');
    await client.from('classes').update({ status: 'cancelled', cancellation_reason: 'Teacher deactivated', cancelled_at: new Date().toISOString() }).eq('teacher_id', teacherId).in('status', ['scheduled', 'rescheduled']);
  }

  return teacher;
}
