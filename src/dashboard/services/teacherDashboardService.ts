import { supabase } from '../../lib/supabaseClient';

export type TeacherDashboardClass = {
  id: string;
  time: string;
  student: string;
  studentId?: string | null;
  program: string;
  status: string;
  platform: string;
  meetingLink?: string;
  reportStatus: string;
  attendanceStatus: string;
  scheduledStartAt: string;
};

export type TeacherDashboardStudent = {
  id: string;
  student: string;
  program: string;
  level: string;
  nextClass: string;
  attendance: string;
  progress: string;
  status: string;
};

export type TeacherDashboardEvaluation = {
  id: string;
  student: string;
  program: string;
  relatedClass: string;
  recitation: number;
  tajweed: number;
  understanding: number;
  status: string;
};

export type TeacherDashboardStats = Array<{
  label: string;
  value: string | number;
  trend: string;
  icon: string;
}>;

export type TeacherDashboardData = {
  stats: TeacherDashboardStats;
  todaysClasses: TeacherDashboardClass[];
  assignedStudents: TeacherDashboardStudent[];
  evaluationQueue: TeacherDashboardEvaluation[];
};

export async function fetchTeacherDashboardData(): Promise<TeacherDashboardData> {
  const emptyData: TeacherDashboardData = {
    stats: [
      { label: 'Assigned Students', value: 0, trend: 'Active assigned records', icon: 'student' },
      { label: "Today's Classes", value: 0, trend: 'Scheduled for today', icon: 'calendar' },
      { label: 'Upcoming Free Trials', value: 0, trend: 'Assigned trials', icon: 'gift' },
      { label: 'Pending Evaluations', value: 0, trend: 'Awaiting teacher submission', icon: 'chart' },
    ],
    todaysClasses: [],
    assignedStudents: [],
    evaluationQueue: [],
  };

  if (!supabase) {
    return emptyData;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const teacherId = sessionData.session?.user.id;

    if (!teacherId) {
      return emptyData;
    }

    const today = new Date().toISOString().slice(0, 10);
    const [{ data: students }, { data: classes }, { data: trials }, { data: evaluations }] = await Promise.all([
      supabase.from('students').select('*').eq('assigned_teacher_id', teacherId),
      supabase.from('classes').select('*').eq('teacher_id', teacherId).gte('class_date', today).lte('class_date', today),
      supabase.from('free_trials').select('*').eq('teacher_id', teacherId).eq('status', 'scheduled'),
      supabase.from('evaluations').select('*').eq('teacher_id', teacherId).in('status', ['ready', 'draft', 'needs_review']),
    ]);

    const studentRows = students || [];
    const classRows = classes || [];
    const studentIds = Array.from(new Set([...studentRows.map((student) => student.id), ...classRows.map((classRow) => classRow.student_id)].filter(Boolean))) as string[];
    const programIds = Array.from(new Set([...studentRows.map((student) => student.program_id), ...classRows.map((classRow) => classRow.program_id)].filter(Boolean))) as string[];
    const [studentResult, programResult, attendanceResult, reportsResult] = await Promise.all([
      studentIds.length ? supabase.from('students').select('id, student_name, level, status').in('id', studentIds) : Promise.resolve({ data: [] }),
      programIds.length ? supabase.from('programs').select('id, name').in('id', programIds) : Promise.resolve({ data: [] }),
      classRows.length ? supabase.from('attendance').select('class_id, status').in('class_id', classRows.map((classRow) => classRow.id)) : Promise.resolve({ data: [] }),
      classRows.length ? supabase.from('teacher_class_reports').select('class_id, id').in('class_id', classRows.map((classRow) => classRow.id)) : Promise.resolve({ data: [] }),
    ]);

    const studentById = new Map((studentResult.data || []).map((student) => [student.id, student]));
    const programById = new Map((programResult.data || []).map((program) => [program.id, program.name]));
    const attendanceClassIds = new Set((attendanceResult.data || []).map((attendance) => attendance.class_id));
    const reportClassIds = new Set((reportsResult.data || []).map((report) => report.class_id));

    const todaysClasses = classRows.map((classRow): TeacherDashboardClass => {
      const student = classRow.student_id ? studentById.get(classRow.student_id) : null;
      const program = classRow.program_id ? programById.get(classRow.program_id) || 'Program' : 'Program';
      const status = classRow.status || 'scheduled';

      return {
        id: classRow.id,
        time: formatTime(classRow.scheduled_start_at || classRow.start_time),
        student: student?.student_name || 'Student',
        studentId: classRow.student_id || null,
        program,
        status,
        platform: classRow.platform || (classRow.meeting_link ? 'Online classroom' : 'Meeting link pending'),
        meetingLink: classRow.meeting_link || undefined,
        reportStatus: reportClassIds.has(classRow.id) ? 'Submitted' : status === 'completed' ? 'Needs Report' : 'Not Due',
        attendanceStatus: attendanceClassIds.has(classRow.id) ? 'Submitted' : status === 'completed' ? 'Pending' : 'Not Started',
        scheduledStartAt: classRow.scheduled_start_at || `${today}T${classRow.start_time || '00:00:00'}`,
      };
    });

    const assignedStudents = studentRows.map((student): TeacherDashboardStudent => ({
      id: student.id,
      student: student.student_name || 'Student',
      program: student.program_id ? programById.get(student.program_id) || 'Program not assigned' : 'Program not assigned',
      level: student.current_level || student.level || 'Level not set',
      nextClass: nextClassLabel(todaysClasses.find((classItem) => classItem.studentId === student.id)),
      attendance: 'Calculated from attendance',
      progress: student.status === 'needs_support' ? 'Needs support' : 'On track',
      status: student.status || 'active',
    }));

    const evaluationQueue = (evaluations || []).map((evaluation): TeacherDashboardEvaluation => {
      const student = evaluation.student_id ? studentById.get(evaluation.student_id) : null;

      return {
        id: evaluation.id,
        student: student?.student_name || 'Student',
        program: evaluation.program_name || 'Program',
        relatedClass: evaluation.class_id || 'Class record',
        recitation: Number(evaluation.reading_score || evaluation.recitation || 0),
        tajweed: Number(evaluation.tajweed_score || evaluation.tajweed || 0),
        understanding: Number(evaluation.understanding_score || evaluation.understanding || 0),
        status: evaluation.status || 'ready',
      };
    });

    return {
      stats: [
        { label: 'Assigned Students', value: assignedStudents.length, trend: 'Active assigned records', icon: 'student' },
        { label: "Today's Classes", value: todaysClasses.length, trend: 'Scheduled for today', icon: 'calendar' },
        { label: 'Upcoming Free Trials', value: (trials || []).length, trend: 'Assigned trials', icon: 'gift' },
        { label: 'Pending Evaluations', value: evaluationQueue.length, trend: 'Awaiting teacher submission', icon: 'chart' },
      ],
      todaysClasses,
      assignedStudents,
      evaluationQueue,
    };
  } catch {
    return emptyData;
  }
}

function nextClassLabel(classItem?: TeacherDashboardClass) {
  if (!classItem) {
    return 'No class scheduled';
  }

  return `Today ${classItem.time}`;
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
