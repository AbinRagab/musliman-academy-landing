import { supabase } from '../../lib/supabaseClient';
import {
  getUpcomingClasses,
  resolveCurrentStudentProfile,
  studentPortalMock,
  type StudentClassSession,
} from './studentService';

function normalizeClassStatus(status?: string | null): StudentClassSession['status'] {
  if (status === 'completed' || status === 'cancelled' || status === 'rescheduled' || status === 'student_absent' || status === 'teacher_absent') {
    return status;
  }

  return 'scheduled';
}

export async function fetchStudentClassesData() {
  if (!supabase) {
    return {
      profile: studentPortalMock.profile,
      classes: studentPortalMock.classes,
      upcomingClasses: getUpcomingClasses(studentPortalMock.classes),
    };
  }

  try {
    const profile = await resolveCurrentStudentProfile();
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('student_id', profile.id)
      .order('class_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error || !data?.length) {
      return {
        profile,
        classes: studentPortalMock.classes,
        upcomingClasses: getUpcomingClasses(studentPortalMock.classes),
      };
    }

    const teacherIds = Array.from(new Set(data.map((session) => session.teacher_id).filter(Boolean))) as string[];
    const programIds = Array.from(new Set(data.map((session) => session.program_id).filter(Boolean))) as string[];
    const [teacherResult, programResult] = await Promise.all([
      teacherIds.length ? supabase.from('profiles').select('id, full_name').in('id', teacherIds) : Promise.resolve({ data: [] }),
      programIds.length ? supabase.from('programs').select('id, name').in('id', programIds) : Promise.resolve({ data: [] }),
    ]);

    const teacherById = new Map((teacherResult.data || []).map((teacher) => [teacher.id, teacher.full_name]));
    const programById = new Map((programResult.data || []).map((program) => [program.id, program.name]));

    const classes = data.map((session): StudentClassSession => {
      const program = session.program_id ? programById.get(session.program_id) || profile.program : profile.program;

      return {
        id: session.id,
        title: session.lesson_title || `${program} - ${profile.level}`,
        program,
        level: profile.level,
        teacher: session.teacher_id ? teacherById.get(session.teacher_id) || profile.teacher : profile.teacher,
        date: session.class_date || 'Date pending',
        time: session.start_time || 'Time pending',
        endTime: session.end_time,
        timezone: profile.timezone,
        platform: session.meeting_link ? 'Online classroom' : 'Link pending',
        meetingLink: session.meeting_link,
        status: normalizeClassStatus(session.status),
        attendanceStatus: session.status === 'student_absent' ? 'absent' : session.status === 'completed' ? 'present' : 'pending',
        lessonCovered: session.lesson_covered || undefined,
        homeworkAssigned: session.homework || undefined,
      };
    });

    return {
      profile,
      classes,
      upcomingClasses: getUpcomingClasses(classes),
    };
  } catch {
    return {
      profile: studentPortalMock.profile,
      classes: studentPortalMock.classes,
      upcomingClasses: getUpcomingClasses(studentPortalMock.classes),
    };
  }
}

export async function submitRescheduleRequest(payload: { classId: string; preferredDateTime: string; reason: string }) {
  return { success: true, payload };
}

export async function reportClassIssue(payload: { classId: string; reason: string; message: string }) {
  return { success: true, payload };
}
