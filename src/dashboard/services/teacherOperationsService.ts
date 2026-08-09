import { supabase } from '../../lib/supabaseClient';
import { getStudentDisplayName } from './displayNameUtils';

export type TeacherContext = {
  authUserId: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: string;
  };
  teacherId: string;
  teacherProfileId: string;
  teacherLookupIds: string[];
  teacherName: string;
};

export type TeacherStudentRow = {
  id: string;
  student: string;
  program: string;
  level: string;
  nextClass: string;
  attendance: string;
  progress: string;
  status: string;
};

export type TeacherClassRow = {
  id: string;
  studentId?: string | null;
  student: string;
  programId?: string | null;
  program: string;
  dateTime: string;
  status: string;
  platform: string;
  meetingLink?: string;
  attendanceStatus: string;
  lessonCovered: string;
  homeworkAssigned: string;
  reportStatus: string;
  notes: string;
};

export type TeacherEvaluationRow = {
  id: string;
  studentId?: string | null;
  classId?: string | null;
  programId?: string | null;
  student: string;
  program: string;
  relatedClass: string;
  status: string;
};

export type TeacherOperationsData = {
  context: TeacherContext | null;
  contextError?: string | null;
  students: TeacherStudentRow[];
  classes: TeacherClassRow[];
  evaluations: TeacherEvaluationRow[];
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

export async function getCurrentTeacherContext(): Promise<TeacherContext | null> {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  const authUserId = userData.user?.id;
  if (import.meta.env.DEV) {
    console.info('Teacher context auth user id:', authUserId || null);
  }

  if (!authUserId) {
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('id', authUserId)
    .maybeSingle();

  if (profileError) {
    if (import.meta.env.DEV) {
      console.error('Teacher context profile fetch failed:', profileError);
    }
    throw profileError;
  }

  if (!profile || profile.role !== 'teacher') {
    if (import.meta.env.DEV) {
      console.warn('Teacher context profile is missing or not a teacher.', { authUserId, profile });
    }
    return null;
  }

  if (import.meta.env.DEV) {
    console.info('Teacher context profile id:', profile.id);
  }

  const { data: teacherRecord, error: teacherError } = await client
    .from('teachers')
    .select('id, profile_id, full_name, status')
    .eq('profile_id', profile.id)
    .maybeSingle();

  if (teacherError) {
    if (import.meta.env.DEV) {
      console.error('Teacher context teacher record fetch failed:', teacherError);
    }
    throw teacherError;
  }

  if (!teacherRecord) {
    if (import.meta.env.DEV) {
      console.warn('Teacher profile exists without a matching public.teachers row.', { profileId: profile.id });
    }
    return null;
  }

  return {
    authUserId,
    profile,
    teacherId: teacherRecord.id,
    teacherProfileId: teacherRecord.profile_id || profile.id,
    teacherLookupIds: Array.from(new Set([teacherRecord.id, teacherRecord.profile_id || profile.id].filter(Boolean))),
    teacherName: teacherRecord.full_name || profile.full_name,
  };
}

export function applyTeacherIdFilter<T>(query: T, column: string, context: TeacherContext): T {
  return (query as { eq: (column: string, value: string) => T }).eq(column, context.teacherId);
}

export async function fetchTeacherOperationsData(): Promise<TeacherOperationsData> {
  const client = requireSupabase();
  const context = await getCurrentTeacherContext();

  if (!context) {
    return {
      context: null,
      contextError: 'Teacher record is not linked to your account. Please contact admin.',
      students: [],
      classes: [],
      evaluations: [],
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: studentRows, error: studentsError }, { data: classRows, error: classesError }] = await Promise.all([
    applyTeacherIdFilter(
      client
        .from('students')
        .select('id, student_name, program_id, level, status, assigned_teacher_id'),
      'assigned_teacher_id',
      context,
    )
      .order('student_name', { ascending: true }),
    applyTeacherIdFilter(
      client
        .from('classes')
        .select('id, student_id, teacher_id, program_id, class_date, start_time, end_time, duration_minutes, meeting_link, lesson_title, lesson_covered, homework, status, created_at'),
      'teacher_id',
      context,
    )
      .order('class_date', { ascending: true })
      .order('start_time', { ascending: true }),
  ]);

  if (studentsError) {
    if (import.meta.env.DEV) {
      console.error('Assigned students query failed:', { teacherIds: context.teacherLookupIds, error: studentsError });
    }
    throw studentsError;
  }
  if (classesError) {
    if (import.meta.env.DEV) {
      console.error('Assigned classes query failed:', { teacherIds: context.teacherLookupIds, error: classesError });
    }
    throw classesError;
  }

  const students = studentRows || [];
  const classes = classRows || [];
  if (import.meta.env.DEV) {
    console.info('Teacher operations query result:', {
      authUserId: context.authUserId,
      profileId: context.teacherProfileId,
      teacherId: context.teacherId,
      lookupIds: context.teacherLookupIds,
      assignedStudents: students.length,
      assignedClasses: classes.length,
    });
  }
  const studentIds = Array.from(new Set([...students.map((student) => student.id), ...classes.map((classRow) => classRow.student_id)].filter(Boolean))) as string[];
  const programIds = Array.from(new Set([...students.map((student) => student.program_id), ...classes.map((classRow) => classRow.program_id)].filter(Boolean))) as string[];
  const classIds = classes.map((classRow) => classRow.id);

  const [{ data: joinedStudents }, { data: programs }, { data: attendance }, { data: evaluations }] = await Promise.all([
    studentIds.length ? client.from('students').select('id, student_name, level, status').in('id', studentIds) : Promise.resolve({ data: [] }),
    programIds.length ? client.from('programs').select('id, name').in('id', programIds) : Promise.resolve({ data: [] }),
    classIds.length ? client.from('attendance').select('class_id, student_id, status').in('class_id', classIds) : Promise.resolve({ data: [] }),
    classIds.length ? client.from('evaluations').select('id, class_id, student_id, teacher_id').in('class_id', classIds) : Promise.resolve({ data: [] }),
  ]);

  const studentById = new Map((joinedStudents || []).map((student) => [student.id, student]));
  const programById = new Map((programs || []).map((program) => [program.id, program.name]));
  const attendanceByClassId = new Map((attendance || []).map((record) => [record.class_id, record]));
  const evaluatedClassIds = new Set((evaluations || []).map((evaluation) => evaluation.class_id).filter(Boolean));
  const classRowsByStudent = new Map<string, typeof classes>();

  classes.forEach((classRow) => {
    if (!classRow.student_id) return;
    const current = classRowsByStudent.get(classRow.student_id) || [];
    current.push(classRow);
    classRowsByStudent.set(classRow.student_id, current);
  });

  const mappedClasses = classes.map((classRow): TeacherClassRow => {
    const student = classRow.student_id ? studentById.get(classRow.student_id) : null;
    const program = classRow.program_id ? programById.get(classRow.program_id) || 'Program not assigned' : 'Program not assigned';
    const attendanceRecord = attendanceByClassId.get(classRow.id);
    const status = toTitleStatus(classRow.status || 'scheduled');

    return {
      id: classRow.id,
      studentId: classRow.student_id,
      student: getStudentDisplayName(student),
      programId: classRow.program_id,
      program,
      dateTime: formatClassDateTime(classRow.class_date, classRow.start_time),
      status,
      platform: classRow.meeting_link ? 'Online classroom' : 'Meeting link pending',
      meetingLink: classRow.meeting_link || undefined,
      attendanceStatus: attendanceRecord ? 'Submitted' : classRow.status === 'completed' ? 'Pending' : 'Not Started',
      lessonCovered: classRow.lesson_covered || (classRow.status === 'completed' ? 'Lesson report pending' : 'Planned lesson'),
      homeworkAssigned: classRow.homework || (classRow.status === 'completed' ? 'Homework pending' : 'Set after class'),
      reportStatus: classRow.lesson_covered || classRow.homework ? 'Submitted' : classRow.status === 'completed' ? 'Needs Report' : 'Not Due',
      notes: classRow.lesson_title || '',
    };
  });

  const mappedStudents = students.map((student): TeacherStudentRow => {
    const studentClasses = classRowsByStudent.get(student.id) || [];
    const nextClass = studentClasses.find((classRow) => classRow.class_date >= today);
    const studentAttendance = (attendance || []).filter((record) => record.student_id === student.id);
    const presentCount = studentAttendance.filter((record) => ['present', 'late'].includes(record.status)).length;
    const attendanceRate = studentAttendance.length ? `${Math.round((presentCount / studentAttendance.length) * 100)}%` : 'No attendance yet';

    return {
      id: student.id,
      student: getStudentDisplayName(student),
      program: student.program_id ? programById.get(student.program_id) || 'Program not assigned' : 'Program not assigned',
      level: student.level || 'Level not set',
      nextClass: nextClass ? formatClassDateTime(nextClass.class_date, nextClass.start_time) : 'No class scheduled',
      attendance: attendanceRate,
      progress: studentAttendance.length && presentCount / studentAttendance.length < 0.8 ? 'Needs support' : 'On track',
      status: student.status || 'active',
    };
  });

  const mappedEvaluations = classes
    .filter((classRow) => classRow.status === 'completed' && !evaluatedClassIds.has(classRow.id))
    .map((classRow): TeacherEvaluationRow => {
      const student = classRow.student_id ? studentById.get(classRow.student_id) : null;
      const program = classRow.program_id ? programById.get(classRow.program_id) || 'Program not assigned' : 'Program not assigned';

      return {
        id: classRow.id,
        studentId: classRow.student_id,
        classId: classRow.id,
        programId: classRow.program_id,
        student: getStudentDisplayName(student),
        program,
        relatedClass: formatClassDateTime(classRow.class_date, classRow.start_time),
        status: 'ready',
      };
    });

  return {
    context,
    contextError: null,
    students: mappedStudents,
    classes: mappedClasses,
    evaluations: mappedEvaluations,
  };
}

export async function markTeacherAttendance(payload: {
  classId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}) {
  const client = requireSupabase();
  const context = await getCurrentTeacherContext();
  if (!context) {
    throw new Error('Teacher account is required.');
  }

  const attendancePayload = {
    class_id: payload.classId,
    student_id: payload.studentId,
    teacher_id: context.teacherId,
    status: payload.status,
    notes: payload.notes || null,
    marked_by: context.teacherProfileId,
    marked_at: new Date().toISOString(),
  };

  const { data: existingAttendance, error: existingAttendanceError } = await client
    .from('attendance')
    .select('id')
    .eq('class_id', attendancePayload.class_id)
    .eq('student_id', attendancePayload.student_id)
    .maybeSingle();

  if (existingAttendanceError) {
    throw existingAttendanceError;
  }

  const { error } = existingAttendance?.id
    ? await client.from('attendance').update(attendancePayload).eq('id', existingAttendance.id)
    : await client.from('attendance').insert(attendancePayload);

  if (error) {
    throw error;
  }
}

export async function saveTeacherClassReport(payload: {
  classId: string;
  lessonCovered: string;
  homework?: string;
  notes?: string;
}) {
  const client = requireSupabase();
  const context = await getCurrentTeacherContext();
  if (!context) {
    throw new Error('Teacher account is required.');
  }

  const { error } = await client
    .from('classes')
    .update({
      lesson_covered: payload.lessonCovered,
      homework: payload.homework || null,
      lesson_title: payload.notes || payload.lessonCovered,
    })
    .eq('id', payload.classId)
    .eq('teacher_id', context.teacherId);

  if (error) {
    throw error;
  }
}

export async function saveTeacherEvaluation(payload: {
  studentId: string;
  classId?: string | null;
  recitationRating: number;
  tajweedRating: number;
  understandingRating: number;
  behaviorRating: number;
  progressNotes?: string;
  recommendation?: string;
}) {
  const client = requireSupabase();
  const context = await getCurrentTeacherContext();
  if (!context) {
    throw new Error('Teacher account is required.');
  }

  const { error } = await client.from('evaluations').insert({
    student_id: payload.studentId,
    teacher_id: context.teacherId,
    class_id: payload.classId || null,
    recitation_rating: payload.recitationRating,
    tajweed_rating: payload.tajweedRating,
    understanding_rating: payload.understandingRating,
    behavior_rating: payload.behaviorRating,
    progress_feedback: payload.progressNotes || null,
    teacher_notes: payload.recommendation || null,
  });

  if (error) {
    throw error;
  }
}

function formatClassDateTime(classDate?: string | null, startTime?: string | null) {
  if (!classDate) {
    return 'Date pending';
  }

  const today = new Date().toISOString().slice(0, 10);
  const dateLabel = classDate === today ? 'Today' : classDate;
  return `${dateLabel} ${formatTime(startTime)}`.trim();
}

function formatTime(value?: string | null) {
  if (!value) {
    return 'Time pending';
  }

  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function toTitleStatus(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
