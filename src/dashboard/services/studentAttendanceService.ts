import { supabase } from '../../lib/supabaseClient';
import { resolveCurrentStudentProfile, type StudentAttendanceRecord, type StudentAttendanceStatus } from './studentService';

export type StudentAttendanceFilters = {
  month: string;
  status: 'all' | StudentAttendanceStatus;
  program: string;
};

export function getAttendanceSummary(records: StudentAttendanceRecord[]) {
  const present = records.filter((record) => record.status === 'present').length;
  const late = records.filter((record) => record.status === 'late').length;
  const absent = records.filter((record) => record.status === 'absent').length;
  const excused = records.filter((record) => record.status === 'excused').length;
  const attended = present + late;
  const rate = records.length ? Math.round((attended / records.length) * 100) : 0;

  return { rate: `${rate}%`, present, absent, late, excused };
}

export async function fetchStudentAttendanceData() {
  if (!supabase) {
    const records: StudentAttendanceRecord[] = [];
    return { records, summary: getAttendanceSummary(records) };
  }

  try {
    const profile = await resolveCurrentStudentProfile();

    if (!profile.id) {
      const records: StudentAttendanceRecord[] = [];
      return { records, summary: getAttendanceSummary(records) };
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', profile.id)
      .order('submitted_at', { ascending: false });

    if (error || !data?.length) {
      const records: StudentAttendanceRecord[] = [];
      return { records, summary: getAttendanceSummary(records) };
    }

    const classIds = Array.from(new Set(data.map((record) => record.class_id).filter(Boolean))) as string[];
    const teacherIds = Array.from(new Set(data.map((record) => record.teacher_id).filter(Boolean))) as string[];
    const [classesResult, teachersResult] = await Promise.all([
      classIds.length ? supabase.from('classes').select('id, class_title, lesson_title, class_date, scheduled_start_at, program_id').in('id', classIds) : Promise.resolve({ data: [] }),
      teacherIds.length ? supabase.from('profiles').select('id, full_name').in('id', teacherIds) : Promise.resolve({ data: [] }),
    ]);

    const classesById = new Map((classesResult.data || []).map((classRecord) => [classRecord.id, classRecord]));
    const teachersById = new Map((teachersResult.data || []).map((teacher) => [teacher.id, teacher.full_name]));

    const records = data.map((record): StudentAttendanceRecord => {
      const classRecord = record.class_id ? classesById.get(record.class_id) : null;

      return {
        id: record.id,
        classDate: formatDate(classRecord?.scheduled_start_at || classRecord?.class_date || record.submitted_at || record.created_at),
        className: classRecord?.class_title || classRecord?.lesson_title || 'Class session',
        teacher: record.teacher_id ? teachersById.get(record.teacher_id) || 'Teacher' : 'Teacher',
        status: normalizeAttendanceStatus(record.status),
        notes: record.note || record.notes || '',
        program: profile.program,
      };
    });

    return { records, summary: getAttendanceSummary(records) };
  } catch {
    const records: StudentAttendanceRecord[] = [];
    return { records, summary: getAttendanceSummary(records) };
  }
}

function normalizeAttendanceStatus(status?: string | null): StudentAttendanceStatus {
  if (status === 'present' || status === 'absent' || status === 'late' || status === 'excused' || status === 'cancelled') {
    return status;
  }

  return 'pending';
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not recorded';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function reportAttendanceIssue(payload: { attendanceId: string; reason: string; message: string }) {
  if (!supabase) {
    return { success: false, payload };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from('messages').insert({
    sender_id: sessionData.session?.user.id || null,
    related_entity_type: 'attendance',
    related_entity_id: payload.attendanceId,
    recipient_role: 'admin',
    subject: `Attendance issue: ${payload.reason}`,
    body: payload.message,
    status: 'unread',
  });

  return { success: !error, payload, error };
}
