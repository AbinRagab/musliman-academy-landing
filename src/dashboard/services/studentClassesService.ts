import { supabase } from '../../lib/supabaseClient';
import {
  getUpcomingClasses,
  resolveCurrentStudentProfile,
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
      profile: await resolveCurrentStudentProfile(),
      classes: [] as StudentClassSession[],
      upcomingClasses: [] as StudentClassSession[],
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
        classes: [] as StudentClassSession[],
        upcomingClasses: [] as StudentClassSession[],
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
        attendanceStatus: normalizeAttendanceStatus(session.attendance_status || (session.status === 'student_absent' ? 'absent' : null)),
        lessonCovered: session.lesson_notes || session.lesson_covered || undefined,
        homeworkAssigned: session.homework || undefined,
        teacherNotes: session.teacher_notes || undefined,
        materialsLink: session.materials_link || null,
        recordingLink: session.recording_link || null,
      };
    });

    return {
      profile,
      classes,
      upcomingClasses: getUpcomingClasses(classes),
    };
  } catch {
    return {
      profile: await resolveCurrentStudentProfile(),
      classes: [] as StudentClassSession[],
      upcomingClasses: [] as StudentClassSession[],
    };
  }
}

function normalizeAttendanceStatus(status?: string | null): StudentClassSession['attendanceStatus'] {
  if (status === 'present' || status === 'absent' || status === 'late' || status === 'excused' || status === 'cancelled') {
    return status;
  }

  return 'pending';
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

export async function submitRescheduleRequest(payload: { classId: string; preferredDateTime: string; reason: string }) {
  return { success: true, payload };
}

export async function reportClassIssue(payload: { classId: string; reason: string; message: string }) {
  return { success: true, payload };
}
