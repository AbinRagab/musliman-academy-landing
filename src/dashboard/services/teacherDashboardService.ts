import { supabase } from '../../lib/supabaseClient';
import { getStudentDisplayName } from './displayNameUtils';
import { applyTeacherIdFilter, getCurrentTeacherContext } from './teacherOperationsService';

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
  studentId?: string | null;
  classId?: string | null;
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
  contextError?: string | null;
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
    contextError: null,
    todaysClasses: [],
    assignedStudents: [],
    evaluationQueue: [],
  };

  if (!supabase) {
    return emptyData;
  }

  try {
    const context = await getCurrentTeacherContext();
    const teacherId = context?.teacherId;

    if (!context || !teacherId) {
      return {
        ...emptyData,
        contextError: 'Teacher record is not linked to your account. Please contact admin.',
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const [{ data: students }, { data: classes }, { data: trials }, { data: completedClasses }] = await Promise.all([
      applyTeacherIdFilter(
        supabase.from('students').select('id, student_name, program_id, level, status, assigned_teacher_id'),
        'assigned_teacher_id',
        context,
      ),
      applyTeacherIdFilter(
        supabase.from('classes').select('id, student_id, teacher_id, program_id, class_date, start_time, meeting_link, lesson_covered, homework, status'),
        'teacher_id',
        context,
      ).gte('class_date', today).lte('class_date', today),
      applyTeacherIdFilter(
        supabase.from('free_trials').select('id, teacher_id, status'),
        'teacher_id',
        context,
      ).eq('status', 'scheduled'),
      applyTeacherIdFilter(
        supabase.from('classes').select('id, student_id, teacher_id, program_id, class_date, start_time, status'),
        'teacher_id',
        context,
      ).eq('status', 'completed').order('class_date', { ascending: false }),
    ]);

    if (import.meta.env.DEV) {
      console.info('Teacher dashboard query result:', {
        authUserId: context.authUserId,
        profileId: context.teacherProfileId,
        teacherId: context.teacherId,
        lookupIds: context.teacherLookupIds,
        assignedStudents: students?.length || 0,
        todaysClasses: classes?.length || 0,
        trials: trials?.length || 0,
      });
    }

    const studentRows = students || [];
    const classRows = classes || [];
    const completedClassRows = completedClasses || [];
    const studentIds = Array.from(new Set([
      ...studentRows.map((student) => student.id),
      ...classRows.map((classRow) => classRow.student_id),
      ...completedClassRows.map((classRow) => classRow.student_id),
    ].filter(Boolean))) as string[];
    const programIds = Array.from(new Set([
      ...studentRows.map((student) => student.program_id),
      ...classRows.map((classRow) => classRow.program_id),
      ...completedClassRows.map((classRow) => classRow.program_id),
    ].filter(Boolean))) as string[];
    const [studentResult, programResult, attendanceResult, evaluationResult] = await Promise.all([
      studentIds.length ? supabase.from('students').select('id, student_name, level, status').in('id', studentIds) : Promise.resolve({ data: [] }),
      programIds.length ? supabase.from('programs').select('id, name').in('id', programIds) : Promise.resolve({ data: [] }),
      classRows.length ? supabase.from('attendance').select('class_id, status').in('class_id', classRows.map((classRow) => classRow.id)) : Promise.resolve({ data: [] }),
      completedClassRows.length ? supabase.from('evaluations').select('class_id, id').in('class_id', completedClassRows.map((classRow) => classRow.id)) : Promise.resolve({ data: [] }),
    ]);

    const studentById = new Map((studentResult.data || []).map((student) => [student.id, student]));
    const programById = new Map((programResult.data || []).map((program) => [program.id, program.name]));
    const attendanceClassIds = new Set((attendanceResult.data || []).map((attendance) => attendance.class_id));
    const evaluatedClassIds = new Set((evaluationResult.data || []).map((evaluation) => evaluation.class_id));

    const todaysClasses = classRows.map((classRow): TeacherDashboardClass => {
      const student = classRow.student_id ? studentById.get(classRow.student_id) : null;
      const program = classRow.program_id ? programById.get(classRow.program_id) || 'Program' : 'Program';
      const status = classRow.status || 'scheduled';

      return {
        id: classRow.id,
        time: formatTime(classRow.start_time),
        student: getStudentDisplayName(student),
        studentId: classRow.student_id || null,
        program,
        status,
        platform: classRow.meeting_link ? 'Online classroom' : 'Meeting link pending',
        meetingLink: classRow.meeting_link || undefined,
        reportStatus: classRow.lesson_covered || classRow.homework ? 'Submitted' : status === 'completed' ? 'Needs Report' : 'Not Due',
        attendanceStatus: attendanceClassIds.has(classRow.id) ? 'Submitted' : status === 'completed' ? 'Pending' : 'Not Started',
        scheduledStartAt: `${classRow.class_date || today}T${classRow.start_time || '00:00:00'}`,
      };
    });

    const assignedStudents = studentRows.map((student): TeacherDashboardStudent => ({
      id: student.id,
      student: getStudentDisplayName(student),
      program: student.program_id ? programById.get(student.program_id) || 'Program not assigned' : 'Program not assigned',
      level: student.level || 'Level not set',
      nextClass: nextClassLabel(todaysClasses.find((classItem) => classItem.studentId === student.id)),
      attendance: 'Calculated from attendance',
      progress: student.status === 'needs_support' ? 'Needs support' : 'On track',
      status: student.status || 'active',
    }));

    const evaluationQueue = completedClassRows
      .filter((classRow) => !evaluatedClassIds.has(classRow.id))
      .map((classRow): TeacherDashboardEvaluation => {
      const student = classRow.student_id ? studentById.get(classRow.student_id) : null;
      const program = classRow.program_id ? programById.get(classRow.program_id) || 'Program' : 'Program';

      return {
        id: classRow.id,
        studentId: classRow.student_id,
        classId: classRow.id,
        student: getStudentDisplayName(student),
        program,
        relatedClass: `${classRow.class_date || 'Class date'} ${classRow.start_time || ''}`.trim(),
        recitation: 0,
        tajweed: 0,
        understanding: 0,
        status: 'ready',
      };
    });

    return {
      stats: [
        { label: 'Assigned Students', value: assignedStudents.length, trend: 'Active assigned records', icon: 'student' },
        { label: "Today's Classes", value: todaysClasses.length, trend: 'Scheduled for today', icon: 'calendar' },
        { label: 'Upcoming Free Trials', value: (trials || []).length, trend: 'Assigned trials', icon: 'gift' },
        { label: 'Pending Evaluations', value: evaluationQueue.length, trend: 'Awaiting teacher submission', icon: 'chart' },
      ],
      contextError: null,
      todaysClasses,
      assignedStudents,
      evaluationQueue,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Teacher dashboard data fetch failed:', error);
    }
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
