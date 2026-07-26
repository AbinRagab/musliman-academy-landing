import { supabase } from '../../lib/supabaseClient';

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
  title: string;
  relatedClass: string;
  teacher: string;
  dueDate: string;
  instructions: string;
  status: 'pending' | 'submitted' | 'reviewed' | 'overdue';
  attachmentUrl?: string | null;
  submissionUrl?: string | null;
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

const mockProfile: StudentPortalProfile = {
  id: 'mock-yusuf',
  profileId: 'mock-profile-yusuf',
  name: 'Yusuf Ahmed',
  initials: 'YA',
  parentName: 'Ahmed Hassan',
  parentWhatsapp: '+20 100 000 0000',
  parentEmail: 'parent.yusuf@example.com',
  country: 'Egypt',
  age: '11',
  program: 'Quran Reading',
  level: 'Level 3',
  teacher: 'Ust. Maryam Ali',
  teacherId: 'mock-teacher-maryam',
  startDate: 'Apr 08, 2026',
  timezone: 'Africa/Cairo',
  preferredContact: 'WhatsApp',
  enrollmentStatus: 'Enrolled',
  attendanceRate: '96%',
  completedLessons: 31,
  overallProgress: 74,
};

const mockClasses: StudentClassSession[] = [
  {
    id: 'class-1',
    title: 'Quran Reading - Level 3',
    program: 'Quran Reading',
    level: 'Level 3',
    teacher: 'Ust. Maryam Ali',
    date: 'Jul 27, 2026',
    time: '05:00 PM',
    endTime: '05:40 PM',
    timezone: 'Africa/Cairo',
    platform: 'Zoom classroom',
    meetingLink: 'https://zoom.us/j/123456789',
    status: 'scheduled',
    attendanceStatus: 'pending',
    homeworkAssigned: 'Revise Surah Al-Mulk verses 1-5.',
  },
  {
    id: 'class-2',
    title: 'Tajweed Practice',
    program: 'Tajweed',
    level: 'Level 3',
    teacher: 'Ust. Maryam Ali',
    date: 'Jul 29, 2026',
    time: '05:00 PM',
    endTime: '05:40 PM',
    timezone: 'Africa/Cairo',
    platform: 'Zoom classroom',
    meetingLink: 'https://zoom.us/j/123456789',
    status: 'scheduled',
    attendanceStatus: 'pending',
    homeworkAssigned: 'Record two minutes applying Madd timing.',
  },
  {
    id: 'class-3',
    title: 'Arabic Basics',
    program: 'Arabic Language',
    level: 'Beginner',
    teacher: 'Sh. Omar Khaled',
    date: 'Aug 01, 2026',
    time: '10:00 AM',
    endTime: '10:40 AM',
    timezone: 'Africa/Cairo',
    platform: 'Zoom classroom',
    meetingLink: null,
    status: 'scheduled',
    attendanceStatus: 'pending',
  },
  {
    id: 'class-4',
    title: 'Madd Letters Review',
    program: 'Quran Reading',
    level: 'Level 3',
    teacher: 'Ust. Maryam Ali',
    date: 'Jul 22, 2026',
    time: '05:00 PM',
    timezone: 'Africa/Cairo',
    platform: 'Zoom classroom',
    status: 'completed',
    attendanceStatus: 'present',
    lessonCovered: 'Madd letters review and slow recitation practice.',
    homeworkAssigned: 'Upload a short recitation recording.',
    teacherNotes: 'Clear improvement in elongation timing.',
    recordingLink: 'https://example.com/recordings/madd-review',
  },
  {
    id: 'class-5',
    title: 'Surah Al-Mulk Revision',
    program: 'Quran Reading',
    level: 'Level 3',
    teacher: 'Ust. Maryam Ali',
    date: 'Jul 20, 2026',
    time: '05:00 PM',
    timezone: 'Africa/Cairo',
    platform: 'Zoom classroom',
    status: 'completed',
    attendanceStatus: 'late',
    lessonCovered: 'Surah Al-Mulk verses 1-5 revision.',
    homeworkAssigned: 'Repeat verses 1-5 daily.',
    teacherNotes: 'Joined 8 minutes late; lesson completed.',
  },
  {
    id: 'class-6',
    title: 'Arabic Reading Practice',
    program: 'Arabic Language',
    level: 'Beginner',
    teacher: 'Sh. Omar Khaled',
    date: 'Jul 17, 2026',
    time: '10:00 AM',
    timezone: 'Africa/Cairo',
    platform: 'Zoom classroom',
    status: 'completed',
    attendanceStatus: 'present',
    lessonCovered: 'Letter joining and short vowel practice.',
    teacherNotes: 'Completed vocabulary review.',
  },
  {
    id: 'class-7',
    title: 'Quran Reading - Level 3',
    program: 'Quran Reading',
    level: 'Level 3',
    teacher: 'Ust. Maryam Ali',
    date: 'Jul 15, 2026',
    time: '05:00 PM',
    timezone: 'Africa/Cairo',
    platform: 'Zoom classroom',
    status: 'student_absent',
    attendanceStatus: 'absent',
    lessonCovered: 'Revision missed.',
    teacherNotes: 'Parent informed absence.',
  },
  {
    id: 'class-8',
    title: 'Tajweed Practice',
    program: 'Tajweed',
    level: 'Level 3',
    teacher: 'Ust. Maryam Ali',
    date: 'Jul 13, 2026',
    time: '05:00 PM',
    timezone: 'Africa/Cairo',
    platform: 'Zoom classroom',
    status: 'rescheduled',
    attendanceStatus: 'cancelled',
    teacherNotes: 'Moved to Wednesday at parent request.',
  },
];

const mockTrial: StudentTrial = {
  id: 'trial-1',
  status: 'converted',
  program: 'Quran Reading',
  teacher: 'Ust. Maryam Ali',
  date: 'Mar 28, 2026',
  time: '04:30 PM',
  timezone: 'Africa/Cairo',
  meetingLink: 'https://zoom.us/j/123456789',
  result: 'Recommended to enroll',
  teacherFeedback: 'Good reading confidence with steady pace. Needs consistent Tajweed revision.',
  recommendedLevel: 'Level 3',
  recommendation: 'Start Quran Reading Level 3 with weekly Tajweed reinforcement.',
  enrollmentDate: 'Apr 08, 2026',
};

const mockHomework: StudentHomeworkItem[] = [
  {
    id: 'hw-1',
    title: 'Surah Al-Mulk audio revision',
    relatedClass: 'Quran Reading - Level 3',
    teacher: 'Ust. Maryam Ali',
    dueDate: 'Jul 29, 2026',
    instructions: 'Upload a two-minute audio recording for verses 1-5 with careful Madd timing.',
    status: 'pending',
    attachmentUrl: 'https://example.com/materials/al-mulk-notes.pdf',
  },
  {
    id: 'hw-2',
    title: 'Madd timing practice',
    relatedClass: 'Madd Letters Review',
    teacher: 'Ust. Maryam Ali',
    dueDate: 'Jul 24, 2026',
    instructions: 'Mark Madd letters in the provided ayat and read aloud twice.',
    status: 'submitted',
    submittedAt: 'Jul 24, 2026',
    submissionUrl: 'https://example.com/submissions/madd-audio',
  },
  {
    id: 'hw-3',
    title: 'Arabic joining worksheet',
    relatedClass: 'Arabic Reading Practice',
    teacher: 'Sh. Omar Khaled',
    dueDate: 'Jul 18, 2026',
    instructions: 'Complete the letter joining worksheet and upload a clear photo.',
    status: 'reviewed',
    submittedAt: 'Jul 18, 2026',
    teacherFeedback: 'Good accuracy. Keep practicing letter spacing.',
  },
  {
    id: 'hw-4',
    title: 'Short vowel drill',
    relatedClass: 'Arabic Basics',
    teacher: 'Sh. Omar Khaled',
    dueDate: 'Jul 21, 2026',
    instructions: 'Read ten short words with fatha, kasra, and damma.',
    status: 'overdue',
  },
];

const mockAttendance: StudentAttendanceRecord[] = [
  { id: 'att-1', classDate: 'Jul 22, 2026', className: 'Madd Letters Review', teacher: 'Ust. Maryam Ali', status: 'present', notes: 'Strong fluency in revision.', program: 'Quran Reading' },
  { id: 'att-2', classDate: 'Jul 20, 2026', className: 'Surah Al-Mulk Revision', teacher: 'Ust. Maryam Ali', status: 'late', notes: 'Joined 8 minutes late.', program: 'Quran Reading' },
  { id: 'att-3', classDate: 'Jul 17, 2026', className: 'Arabic Reading Practice', teacher: 'Sh. Omar Khaled', status: 'present', notes: 'Completed vocabulary review.', program: 'Arabic Language' },
  { id: 'att-4', classDate: 'Jul 15, 2026', className: 'Quran Reading - Level 3', teacher: 'Ust. Maryam Ali', status: 'absent', notes: 'Parent informed absence.', program: 'Quran Reading' },
  { id: 'att-5', classDate: 'Jul 13, 2026', className: 'Tajweed Practice', teacher: 'Ust. Maryam Ali', status: 'excused', notes: 'Rescheduled by academy.', program: 'Tajweed' },
];

const mockSkills: StudentSkillRating[] = [
  { label: 'Reading Accuracy', value: 82, note: 'Accurate with short ayat and improving in longer passages.' },
  { label: 'Tajweed', value: 74, note: 'Focus on Madd timing and stopping rules.' },
  { label: 'Memorization', value: 68, note: 'Daily repetition is helping retention.' },
  { label: 'Arabic Understanding', value: 62, note: 'Letter joining and vocabulary are improving.' },
  { label: 'Participation', value: 90, note: 'Consistent engagement during class.' },
  { label: 'Homework Commitment', value: 78, note: 'Most work submitted on time.' },
];

const mockTopics: StudentProgressTopic[] = [
  { id: 'topic-1', topic: 'Madd letters review', classDate: 'Jul 22, 2026', teacher: 'Ust. Maryam Ali', score: 'Excellent', feedback: 'Clear improvement in elongation timing.' },
  { id: 'topic-2', topic: 'Surah Al-Mulk revision', classDate: 'Jul 20, 2026', teacher: 'Ust. Maryam Ali', score: 'Good', feedback: 'Needs daily repetition for fluency.' },
  { id: 'topic-3', topic: 'Arabic reading practice', classDate: 'Jul 17, 2026', teacher: 'Sh. Omar Khaled', score: 'In progress', feedback: 'Letter joining is improving steadily.' },
];

const mockMessages: StudentMessage[] = [
  {
    id: 'msg-1',
    sender: 'Ust. Maryam Ali',
    senderRole: 'Teacher',
    subject: 'Strong recitation progress',
    preview: 'Yusuf showed clear improvement in Madd timing during the latest revision.',
    body: 'Assalamu Alaikum. Yusuf showed clear improvement in Madd timing during the latest revision. Please revise Surah Al-Mulk verses 1-5 before the next class and keep the same careful pace.',
    dateTime: 'Today, 04:20 PM',
    unread: true,
    relatedClass: 'Quran Reading',
    program: 'Quran Reading Level 3',
  },
  {
    id: 'msg-2',
    sender: 'Academy Scheduling',
    senderRole: 'Class Updates',
    subject: 'Saturday class time confirmed',
    preview: 'Your Saturday Arabic Basics class remains scheduled for 10:00 AM Cairo time.',
    body: 'Your Saturday Arabic Basics class remains scheduled for 10:00 AM Cairo time. The classroom link will be available from the student portal before class starts.',
    dateTime: 'Yesterday, 09:10 AM',
    unread: false,
    relatedClass: 'Arabic Basics',
    program: 'Arabic Language',
  },
  {
    id: 'msg-3',
    sender: 'Homework Center',
    senderRole: 'Homework',
    subject: 'Homework reminder',
    preview: 'Please upload the short audio revision before Wednesday class.',
    body: 'Please upload the short audio revision before Wednesday class. A two-minute recording is enough, focused on clear pronunciation and steady rhythm.',
    dateTime: 'Jul 23, 2026',
    unread: true,
    relatedClass: 'Tajweed Practice',
    program: 'Tajweed',
  },
  {
    id: 'msg-4',
    sender: 'Finance Team',
    senderRole: 'Payments',
    subject: 'Package renewal reminder',
    preview: 'Your current package has 4 sessions remaining.',
    body: 'Your current package has 4 sessions remaining. Contact the academy team when you would like to renew or adjust the package.',
    dateTime: 'Jul 21, 2026',
    unread: false,
    program: 'Quran Reading Level 3',
  },
  {
    id: 'msg-5',
    sender: 'Musliman Academy',
    senderRole: 'Admin',
    subject: 'Monthly progress summary',
    preview: 'Your monthly progress summary is ready for parent review.',
    body: 'Your monthly progress summary is ready for parent review. Attendance remains strong and lesson completion is on track for Level 3.',
    dateTime: 'Jul 20, 2026',
    unread: false,
    program: 'Quran Reading Level 3',
  },
];

const mockPayments: StudentPayment[] = [
  {
    id: 'pay-1',
    packageName: 'Quran Reading - 12 Sessions',
    sessions: 12,
    remainingSessions: 4,
    startDate: 'Jul 01, 2026',
    validUntil: 'Aug 01, 2026',
    status: 'paid',
    paidAmount: '$120',
    dueAmount: '$0',
    nextDueDate: 'Aug 01, 2026',
    currency: 'USD',
    method: 'Bank transfer',
    paymentDate: 'Jul 01, 2026',
    invoiceUrl: null,
    receiptUrl: null,
  },
];

const mockSettings: StudentSettings = {
  displayName: mockProfile.name,
  email: mockProfile.parentEmail,
  whatsapp: mockProfile.parentWhatsapp,
  preferredClassTime: 'Evening',
  preferredLanguage: 'English with Arabic terms',
  timezone: mockProfile.timezone,
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

export const studentPortalMock = {
  profile: mockProfile,
  classes: mockClasses,
  trial: mockTrial,
  homework: mockHomework,
  attendance: mockAttendance,
  skills: mockSkills,
  topics: mockTopics,
  messages: mockMessages,
  payments: mockPayments,
  settings: mockSettings,
};

export function getUpcomingClasses(classes: StudentClassSession[]) {
  return classes.filter((session) => session.status === 'scheduled' || session.status === 'live');
}

export function getNextClass(classes: StudentClassSession[]) {
  return getUpcomingClasses(classes)[0] || null;
}

export function getHomeworkForClass(classSession: StudentClassSession, homeworkItems: StudentHomeworkItem[] = studentPortalMock.homework) {
  const matchingHomework = homeworkItems.find((homework) => (
    homework.relatedClass === classSession.title
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

export async function resolveCurrentStudentProfile() {
  if (!supabase) {
    return studentPortalMock.profile;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      return studentPortalMock.profile;
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (error || !student) {
      return studentPortalMock.profile;
    }

    const [programResult, teacherResult, profileResult] = await Promise.all([
      student.program_id ? supabase.from('programs').select('id, name').eq('id', student.program_id).maybeSingle() : Promise.resolve({ data: null }),
      student.assigned_teacher_id ? supabase.from('profiles').select('id, full_name').eq('id', student.assigned_teacher_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('profiles').select('id, full_name, email, phone').eq('id', userId).maybeSingle(),
    ]);

    const name = student.student_name || profileResult.data?.full_name || studentPortalMock.profile.name;
    return {
      ...studentPortalMock.profile,
      id: student.id,
      profileId: student.profile_id,
      name,
      initials: name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'ST',
      parentName: student.parent_name || studentPortalMock.profile.parentName,
      parentWhatsapp: student.whatsapp || profileResult.data?.phone || studentPortalMock.profile.parentWhatsapp,
      parentEmail: profileResult.data?.email || studentPortalMock.profile.parentEmail,
      country: student.country || studentPortalMock.profile.country,
      age: student.age || studentPortalMock.profile.age,
      program: programResult.data?.name || studentPortalMock.profile.program,
      level: student.level || studentPortalMock.profile.level,
      teacher: teacherResult.data?.full_name || studentPortalMock.profile.teacher,
      teacherId: student.assigned_teacher_id,
      startDate: student.start_date || studentPortalMock.profile.startDate,
      enrollmentStatus: student.status || studentPortalMock.profile.enrollmentStatus,
    } satisfies StudentPortalProfile;
  } catch {
    return studentPortalMock.profile;
  }
}

export async function fetchStudentDashboardData() {
  const profile = await resolveCurrentStudentProfile();

  return {
    profile,
    nextClass: getNextClass(studentPortalMock.classes),
    upcomingClasses: getUpcomingClasses(studentPortalMock.classes).slice(0, 5),
    trial: studentPortalMock.trial,
    homework: studentPortalMock.homework,
    payments: studentPortalMock.payments,
    messages: studentPortalMock.messages,
  };
}

export async function requestStudentSupportUpdate(payload: Record<string, string>) {
  return { success: true, payload };
}

export async function saveStudentSettings(settings: StudentSettings) {
  return { success: true, settings };
}
