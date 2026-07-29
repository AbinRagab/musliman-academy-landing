import { supabase } from '../../lib/supabaseClient';

export type AdminDashboardClass = {
  id: string;
  time: string;
  className: string;
  teacher: string;
  students: string;
  meeting: string;
  attendanceSubmitted: string;
  teacherReport: string;
  homeworkSet: string;
  status: string;
};

export type AdminDashboardData = {
  stats: Array<{ label: string; value: string | number; trend: string; icon: string }>;
  health: Array<{ title: string; value: string | number; meta: string }>;
  recentActivity: Array<{ title: string; meta: string; icon: string }>;
  todayClasses: AdminDashboardClass[];
};

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const emptyData: AdminDashboardData = {
    stats: buildStats({}),
    health: buildHealth({}),
    recentActivity: [],
    todayClasses: [],
  };

  if (!supabase) {
    return emptyData;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const [
      newLeads,
      scheduledTrials,
      enrolledStudents,
      activeStudents,
      todayClasses,
      pendingPayments,
      attendanceIssues,
      pendingReports,
      upcomingTrials,
      classRows,
    ] = await Promise.all([
      countRows('leads', (query) => query.eq('status', 'new')),
      countRows('free_trials', (query) => query.eq('status', 'scheduled')),
      countRows('students', (query) => query.eq('status', 'enrolled')),
      countRows('students', (query) => query.eq('status', 'active')),
      countRows('classes', (query) => query.gte('class_date', today).lte('class_date', today)),
      countRows('payments', (query) => query.in('status', ['pending', 'overdue'])),
      countRows('attendance', (query) => query.in('status', ['absent', 'late'])),
      countRows('teacher_class_reports', (query) => query.in('status', ['pending', 'needs_review'])),
      countRows('free_trials', (query) => query.eq('status', 'scheduled')),
      fetchTodayClasses(today),
    ]);

    const counts = {
      newLeads,
      scheduledTrials,
      enrolledStudents,
      activeStudents,
      todayClasses,
      pendingPayments,
      attendanceIssues,
      pendingReports,
      upcomingTrials,
    };

    return {
      stats: buildStats(counts),
      health: buildHealth(counts),
      recentActivity: await fetchRecentActivity(),
      todayClasses: classRows,
    };
  } catch {
    return emptyData;
  }
}

async function countRows(table: string, applyFilter?: (query: any) => any) {
  if (!supabase) {
    return 0;
  }

  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    if (applyFilter) {
      query = applyFilter(query);
    }

    const { count, error } = await query;
    return error ? 0 : count || 0;
  } catch {
    return 0;
  }
}

function buildStats(counts: Partial<Record<string, number>>) {
  return [
    { label: 'New Leads', value: counts.newLeads || 0, trend: 'Admissions queue', icon: 'phone' },
    { label: 'Trials Scheduled', value: counts.scheduledTrials || 0, trend: 'Scheduled trial records', icon: 'gift' },
    { label: 'Active Students', value: counts.activeStudents || 0, trend: 'Enrolled learners', icon: 'users' },
    { label: 'Today Classes', value: counts.todayClasses || 0, trend: 'Live schedule', icon: 'calendar' },
    { label: 'Pending Payments', value: counts.pendingPayments || 0, trend: 'Finance follow-up', icon: 'award' },
    { label: 'Attendance Issues', value: counts.attendanceIssues || 0, trend: 'Needs review', icon: 'clipboard' },
    { label: 'Pending Reports', value: counts.pendingReports || 0, trend: 'Teacher reports', icon: 'report' },
    { label: 'Upcoming Trials', value: counts.upcomingTrials || 0, trend: 'Upcoming trial records', icon: 'clock' },
  ];
}

function buildHealth(counts: Partial<Record<string, number>>) {
  return [
    { title: 'Admissions', value: counts.newLeads || 0, meta: 'New leads awaiting contact' },
    { title: 'Trials', value: counts.scheduledTrials || 0, meta: 'Scheduled trial sessions' },
    { title: 'Academics', value: counts.pendingReports || 0, meta: 'Teacher reports pending' },
    { title: 'Finance', value: counts.pendingPayments || 0, meta: 'Payments needing follow-up' },
  ];
}

async function fetchTodayClasses(today: string): Promise<AdminDashboardClass[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .gte('class_date', today)
    .lte('class_date', today)
    .order('start_time', { ascending: true });

  if (error || !data?.length) {
    return [];
  }

  const teacherIds = Array.from(new Set(data.map((classRow) => classRow.teacher_id).filter(Boolean))) as string[];
  const studentIds = Array.from(new Set(data.map((classRow) => classRow.student_id).filter(Boolean))) as string[];
  const [teachersResult, studentsResult, attendanceResult, reportsResult] = await Promise.all([
    teacherIds.length ? supabase.from('profiles').select('id, full_name').in('id', teacherIds) : Promise.resolve({ data: [] }),
    studentIds.length ? supabase.from('students').select('id, student_name').in('id', studentIds) : Promise.resolve({ data: [] }),
    supabase.from('attendance').select('class_id').in('class_id', data.map((classRow) => classRow.id)),
    supabase.from('teacher_class_reports').select('class_id').in('class_id', data.map((classRow) => classRow.id)),
  ]);

  const teacherById = new Map((teachersResult.data || []).map((teacher) => [teacher.id, teacher.full_name]));
  const studentById = new Map((studentsResult.data || []).map((student) => [student.id, student.student_name]));
  const attendanceClassIds = new Set((attendanceResult.data || []).map((record) => record.class_id));
  const reportClassIds = new Set((reportsResult.data || []).map((record) => record.class_id));

  return data.map((classRow): AdminDashboardClass => ({
    id: classRow.id,
    time: formatTime(classRow.scheduled_start_at || classRow.start_time),
    className: classRow.class_title || classRow.lesson_title || 'Class session',
    teacher: classRow.teacher_id ? teacherById.get(classRow.teacher_id) || 'Teacher' : 'Unassigned',
    students: classRow.student_id ? studentById.get(classRow.student_id) || 'Student' : 'No student assigned',
    meeting: classRow.meeting_link || 'Meeting link pending',
    attendanceSubmitted: attendanceClassIds.has(classRow.id) ? 'submitted' : 'pending',
    teacherReport: reportClassIds.has(classRow.id) ? 'submitted' : classRow.status === 'completed' ? 'needs report' : 'not due',
    homeworkSet: classRow.homework ? 'set' : 'pending',
    status: classRow.status || 'scheduled',
  }));
}

async function fetchRecentActivity() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('notification_logs')
    .select('status, template_key, channel, created_at')
    .order('created_at', { ascending: false })
    .limit(4);

  if (error || !data?.length) {
    return [];
  }

  return data.map((log) => ({
    title: log.template_key || 'Notification event',
    meta: `${log.channel || 'in_app'} - ${log.status || 'recorded'}`,
    icon: 'bell',
  }));
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
