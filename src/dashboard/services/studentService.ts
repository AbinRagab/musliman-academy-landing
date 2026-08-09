import { supabase } from '../../lib/supabaseClient';
import { resolveTeacherNamesById } from './teachersService';

export type StudentPortalProfile = {
  id: string;
  profileId?: string | null;
  name: string;
  initials: string;
  parentName: string;
  parentWhatsapp: string;
  parentEmail: string;
  country: string;
  age: string;
  program: string;
  level: string;
  teacher: string;
  teacherId?: string | null;
  startDate: string;
  timezone: string;
  preferredContact: string;
  enrollmentStatus: string;
  attendanceRate: string;
  completedLessons: number;
  overallProgress: number;
};

export type StudentClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'rescheduled' | 'student_absent' | 'teacher_absent';
export type StudentAttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'cancelled' | 'pending';

export type StudentClassSession = {
  id: string;
  title: string;
  program: string;
  level: string;
  teacher: string;
  date: string;
  time: string;
  endTime?: string;
  timezone: string;
  platform: string;
  meetingLink?: string | null;
  status: StudentClassStatus;
  attendanceStatus?: StudentAttendanceStatus;
  lessonCovered?: string;
  homeworkAssigned?: string;
  teacherNotes?: string;
  materialsLink?: string | null;
  recordingLink?: string | null;
};

export type TrialStatus = 'scheduled' | 'completed' | 'no_show' | 'rescheduled' | 'converted' | 'not_converted' | 'enrolled';

export type StudentTrial = {
  id: string;
  status: TrialStatus;
  program: string;
  teacher: string;
  date: string;
  time: string;
  timezone: string;
  meetingLink?: string | null;
  result: string;
  teacherFeedback: string;
  recommendedLevel: string;
  recommendation: string;
  enrollmentDate?: string;
};

export type StudentHomeworkItem = {
  id: string;
  classId?: string;
  title: string;
  relatedClass: string;
  teacher: string;
  dueDate: string;
  instructions: string;
  status: 'pending' | 'submitted' | 'reviewed' | 'overdue';
  attachmentUrl?: string | null;
  submissionUrl?: string | null;
  filePath?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  notes?: string | null;
  submittedAt?: string;
  teacherFeedback?: string;
};

export type StudentAttendanceRecord = {
  id: string;
  classDate: string;
  className: string;
  teacher: string;
  status: StudentAttendanceStatus;
  notes: string;
  programId?: string | null;
  program: string;
};

export type StudentProgressTopic = {
  id: string;
  topic: string;
  classDate: string;
  teacher: string;
  score: string;
  feedback: string;
};

export type StudentSkillRating = {
  label: string;
  value: number;
  note: string;
};

export type StudentMessage = {
  id: string;
  sender: string;
  senderRole: 'Teacher' | 'Admin' | 'Payments' | 'Class Updates' | 'Homework';
  subject: string;
  preview: string;
  body: string;
  dateTime: string;
  unread: boolean;
  relatedClass?: string;
  program?: string;
};

export type StudentPayment = {
  id: string;
  packageName: string;
  sessions: number;
  remainingSessions: number;
  startDate: string;
  validUntil: string;
  status: string;
  paidAmount: string;
  dueAmount: string;
  nextDueDate: string;
  currency: string;
  method: string;
  paymentDate: string;
  invoiceUrl?: string | null;
  receiptUrl?: string | null;
};

export type StudentSettings = {
  displayName: string;
  email: string;
  whatsapp: string;
  preferredClassTime: string;
  preferredLanguage: string;
  timezone: string;
  notifications: Record<string, boolean>;
  parentCommunication: Record<string, boolean>;
};

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const emptyStudentSettings: StudentSettings = {
  displayName: '',
  email: '',
  whatsapp: '',
  preferredClassTime: '',
  preferredLanguage: '',
  timezone: defaultTimezone,
  notifications: {
    classReminders: true,
    homeworkReminders: true,
    paymentReminders: true,
    progressReports: true,
    whatsappNotifications: true,
    emailNotifications: false,
  },
  parentCommunication: {
    parentClassReminders: true,
    parentAbsenceAlerts: true,
    parentProgressReports: true,
  },
};

export const emptyStudentTrial: StudentTrial = {
  id: '',
  status: 'not_converted',
  program: 'No program assigned',
  teacher: 'No teacher assigned',
  date: 'Not scheduled',
  time: 'Not scheduled',
  timezone: defaultTimezone,
  meetingLink: null,
  result: 'No trial record yet',
  teacherFeedback: 'No teacher feedback yet',
  recommendedLevel: 'Not set',
  recommendation: 'No recommendation yet',
};

function buildInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST';
}

export function createEmptyStudentProfile(overrides: Partial<StudentPortalProfile> = {}): StudentPortalProfile {
  const name = overrides.name || 'Student';

  return {
    id: overrides.id || '',
    profileId: overrides.profileId || null,
    name,
    initials: overrides.initials || buildInitials(name),
    parentName: '',
    parentWhatsapp: '',
    parentEmail: '',
    country: '',
    age: '',
    program: 'No program assigned',
    level: 'Level not set',
    teacher: 'No teacher assigned',
    teacherId: null,
    startDate: '',
    timezone: defaultTimezone,
    preferredContact: 'Academy messages',
    enrollmentStatus: 'No student record',
    attendanceRate: '0%',
    completedLessons: 0,
    overallProgress: 0,
    ...overrides,
  };
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not scheduled';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(value?: string | null) {
  if (!value) {
    return 'Time pending';
  }

  if (/^\d{2}:\d{2}/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    const parsed = new Date();
    parsed.setHours(hours, minutes, 0, 0);
    return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function normalizeClassStatus(status?: string | null): StudentClassSession['status'] {
  if (status === 'live' || status === 'completed' || status === 'cancelled' || status === 'rescheduled' || status === 'student_absent' || status === 'teacher_absent') {
    return status;
  }

  return 'scheduled';
}

function normalizeAttendanceStatus(status?: string | null): StudentAttendanceStatus {
  if (status === 'present' || status === 'absent' || status === 'late' || status === 'excused' || status === 'cancelled') {
    return status;
  }

  return 'pending';
}

export function getUpcomingClasses(classes: StudentClassSession[]) {
  return classes.filter((session) => session.status === 'scheduled' || session.status === 'live');
}

export function getNextClass(classes: StudentClassSession[]) {
  return getUpcomingClasses(classes)[0] || null;
}

export function getHomeworkForClass(classSession: StudentClassSession, homeworkItems: StudentHomeworkItem[] = []) {
  const matchingHomework = homeworkItems.find((homework) => (
    homework.classId === classSession.id
    || homework.relatedClass === classSession.title
    || classSession.title.includes(homework.relatedClass)
    || homework.relatedClass.includes(classSession.title)
  ));

  if (matchingHomework) {
    return matchingHomework;
  }

  if (!classSession.homeworkAssigned) {
    return null;
  }

  return {
    id: `class-homework-${classSession.id}`,
    title: `${classSession.title} homework`,
    relatedClass: classSession.title,
    classId: classSession.id,
    teacher: classSession.teacher,
    dueDate: classSession.date,
    instructions: classSession.homeworkAssigned,
    status: classSession.status === 'completed' ? 'submitted' : 'pending',
  } satisfies StudentHomeworkItem;
}

export function openExternalLink(url?: string | null) {
  if (!url) {
    return false;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

async function getCurrentProfile() {
  if (!supabase) {
    return { userId: null, profile: null };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id || null;

  if (!userId) {
    return { userId: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, timezone, preferred_contact_method')
    .eq('id', userId)
    .maybeSingle();

  return { userId, profile };
}

export async function resolveCurrentStudentProfile() {
  if (!supabase) {
    return createEmptyStudentProfile();
  }

  try {
    const { userId, profile } = await getCurrentProfile();

    if (!userId) {
      return createEmptyStudentProfile();
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (error || !student) {
      const name = profile?.full_name || 'Student';
      return createEmptyStudentProfile({
        profileId: userId,
        name,
        initials: buildInitials(name),
        parentEmail: profile?.email || '',
        parentWhatsapp: profile?.phone || '',
        timezone: profile?.timezone || defaultTimezone,
        preferredContact: profile?.preferred_contact_method || 'Academy messages',
      });
    }

    const [programResult, teacherResult] = await Promise.all([
      student.program_id ? supabase.from('programs').select('id, name').eq('id', student.program_id).maybeSingle() : Promise.resolve({ data: null }),
      student.assigned_teacher_id ? resolveTeacherNamesById([student.assigned_teacher_id]) : Promise.resolve(new Map<string, string>()),
    ]);

    const name = student.student_name || profile?.full_name || 'Student';

    return createEmptyStudentProfile({
      id: student.id,
      profileId: student.profile_id,
      name,
      initials: buildInitials(name),
      parentName: student.parent_name || '',
      parentWhatsapp: student.parent_whatsapp || student.whatsapp || profile?.phone || '',
      parentEmail: student.parent_email || profile?.email || '',
      country: student.country || '',
      age: student.age ? String(student.age) : '',
      program: programResult.data?.name || student.program_name || 'No program assigned',
      level: student.current_level || student.level || 'Level not set',
      teacher: student.assigned_teacher_id ? teacherResult.get(student.assigned_teacher_id) || 'No teacher assigned' : 'No teacher assigned',
      teacherId: student.assigned_teacher_id || null,
      startDate: formatDate(student.enrollment_date || student.start_date),
      timezone: student.timezone || profile?.timezone || defaultTimezone,
      preferredContact: student.preferred_contact_method || profile?.preferred_contact_method || 'Academy messages',
      enrollmentStatus: student.status || 'active',
    });
  } catch {
    return createEmptyStudentProfile();
  }
}

async function fetchClassesForProfile(profile: StudentPortalProfile) {
  if (!supabase || !profile.id) {
    return [];
  }

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('student_id', profile.id)
    .order('class_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error || !data?.length) {
    return [];
  }

  const teacherIds = Array.from(new Set(data.map((session) => session.teacher_id).filter(Boolean))) as string[];
  const programIds = Array.from(new Set(data.map((session) => session.program_id).filter(Boolean))) as string[];
  const [teacherById, programResult] = await Promise.all([
    resolveTeacherNamesById(teacherIds),
    programIds.length ? supabase.from('programs').select('id, name').in('id', programIds) : Promise.resolve({ data: [] }),
  ]);

  const programById = new Map((programResult.data || []).map((program) => [program.id, program.name]));

  return data.map((session): StudentClassSession => {
    const program = session.program_id ? programById.get(session.program_id) || profile.program : profile.program;

    return {
      id: session.id,
      title: session.class_title || session.lesson_title || program,
      program,
      level: profile.level,
      teacher: session.teacher_id ? teacherById.get(session.teacher_id) || profile.teacher : profile.teacher,
      date: formatDate(session.scheduled_start_at || session.class_date),
      time: formatTime(session.scheduled_start_at || session.start_time),
      endTime: formatTime(session.scheduled_end_at || session.end_time),
      timezone: session.timezone || profile.timezone,
      platform: session.platform || (session.meeting_link ? 'Online classroom' : 'Meeting link pending'),
      meetingLink: session.meeting_link || null,
      status: normalizeClassStatus(session.status),
      attendanceStatus: normalizeAttendanceStatus(session.attendance_status),
      lessonCovered: session.lesson_notes || session.lesson_covered || undefined,
      homeworkAssigned: session.homework || undefined,
      teacherNotes: session.teacher_notes || undefined,
      materialsLink: session.materials_link || null,
      recordingLink: session.recording_link || null,
    };
  });
}

async function fetchLatestTrial(profile: StudentPortalProfile): Promise<StudentTrial> {
  if (!supabase || !profile.id) {
    return emptyStudentTrial;
  }

  const { data, error } = await supabase
    .from('free_trials')
    .select('*')
    .or(`student_id.eq.${profile.id},lead_id.eq.${profile.id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return emptyStudentTrial;
  }

  return {
    id: data.id,
    status: data.status || 'scheduled',
    program: profile.program,
    teacher: profile.teacher,
    date: formatDate(data.scheduled_at || data.trial_date),
    time: formatTime(data.scheduled_at || data.trial_time),
    timezone: data.timezone || profile.timezone,
    meetingLink: data.meeting_link || null,
    result: data.result || data.status || 'Trial scheduled',
    teacherFeedback: data.teacher_feedback || 'No teacher feedback yet',
    recommendedLevel: data.recommended_level || 'Not set',
    recommendation: data.recommendation || 'No recommendation yet',
    enrollmentDate: profile.startDate || undefined,
  };
}

export async function fetchStudentDashboardData() {
  const profile = await resolveCurrentStudentProfile();
  const classes = await fetchClassesForProfile(profile);
  const upcomingClasses = getUpcomingClasses(classes).slice(0, 5);
  const trial = await fetchLatestTrial(profile);

  return {
    profile,
    nextClass: getNextClass(classes),
    upcomingClasses,
    trial,
    homework: [] as StudentHomeworkItem[],
    payments: [] as StudentPayment[],
    messages: [] as StudentMessage[],
  };
}

export async function requestStudentSupportUpdate(payload: Record<string, string>) {
  if (!supabase) {
    return { success: false, payload };
  }

  const { userId } = await getCurrentProfile();
  const { error } = await supabase.from('messages').insert({
    sender_id: userId,
    recipient_role: 'admin',
    subject: payload.subject || 'Student profile update request',
    body: payload.message || JSON.stringify(payload),
    status: 'unread',
  });

  return { success: !error, payload, error };
}

export async function saveStudentSettings(settings: StudentSettings) {
  if (!supabase) {
    return { success: false, settings };
  }

  const { userId } = await getCurrentProfile();
  if (!userId) {
    return { success: false, settings };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: settings.displayName,
      email: settings.email,
      phone: settings.whatsapp,
      timezone: settings.timezone,
    })
    .eq('id', userId);

  return { success: !error, settings, error };
}
