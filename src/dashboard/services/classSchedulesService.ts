import { supabase } from '../../lib/supabaseClient';

export const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export type WeekDay = typeof weekDays[number];

export type ClassScheduleInput = {
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  platform?: string | null;
  meetingLink?: string | null;
};

export type ClassScheduleRow = {
  id: string;
  student_id: string;
  program_id: string | null;
  teacher_profile_id: string | null;
  day_of_week: string;
  start_time: string;
  duration_minutes: number;
  timezone: string;
  platform: string | null;
  meeting_link: string | null;
  status: string;
};

export type NextClassInfo = {
  label: string;
  dayOfWeek: string;
  startTime: string;
  timezone: string;
  startsInMinutes: number;
  row: ClassScheduleRow;
};

const dayIndexByName = new Map(weekDays.map((day, index) => [day.toLowerCase(), index]));

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

export function formatScheduleTime(value?: string | null) {
  if (!value) {
    return 'Time pending';
  }

  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  const parsed = new Date();
  parsed.setHours(hours, minutes, 0, 0);

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function normalizeScheduleTime(value: string) {
  const [hours = '00', minutes = '00'] = value.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
}

function getTimePartsForZone(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'Africa/Cairo',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
  const hour = Number(value('hour'));
  const normalizedHour = hour === 24 ? 0 : hour;

  return {
    dayName: value('weekday'),
    hour: Number.isNaN(normalizedHour) ? 0 : normalizedHour,
    minute: Number(value('minute')) || 0,
  };
}

export function getCurrentWeekDay(timezone = 'Africa/Cairo') {
  return getTimePartsForZone(timezone).dayName;
}

export function getNextClass(scheduleRows: ClassScheduleRow[], timezone = 'Africa/Cairo') {
  const activeRows = scheduleRows.filter((row) => row.status === 'active');

  if (!activeRows.length) {
    return null;
  }

  const now = getTimePartsForZone(timezone);
  const currentDayIndex = dayIndexByName.get(now.dayName.toLowerCase()) ?? 0;
  const currentMinutes = now.hour * 60 + now.minute;

  const next = activeRows
    .map((row) => {
      const rowDayIndex = dayIndexByName.get(row.day_of_week.toLowerCase()) ?? 0;
      const [hours = 0, minutes = 0] = row.start_time.split(':').map(Number);
      const rowMinutes = hours * 60 + minutes;
      let daysUntil = (rowDayIndex - currentDayIndex + 7) % 7;

      if (daysUntil === 0 && rowMinutes <= currentMinutes) {
        daysUntil = 7;
      }

      return {
        row,
        startsInMinutes: daysUntil * 24 * 60 + rowMinutes - currentMinutes,
      };
    })
    .sort((first, second) => first.startsInMinutes - second.startsInMinutes)[0];

  if (!next) {
    return null;
  }

  return {
    label: `${next.row.day_of_week} ${formatScheduleTime(next.row.start_time)}`,
    dayOfWeek: next.row.day_of_week,
    startTime: next.row.start_time,
    timezone: next.row.timezone || timezone,
    startsInMinutes: next.startsInMinutes,
    row: next.row,
  } satisfies NextClassInfo;
}

export function mapScheduleToClassSession(row: ClassScheduleRow, fallback: {
  program: string;
  level: string;
  teacher: string;
}) {
  return {
    id: `schedule:${row.id}`,
    title: fallback.program,
    program: fallback.program,
    level: fallback.level,
    teacher: fallback.teacher,
    date: row.day_of_week,
    time: formatScheduleTime(row.start_time),
    endTime: `${row.duration_minutes} min`,
    timezone: row.timezone,
    platform: row.platform || 'Zoom',
    meetingLink: row.meeting_link || null,
    status: 'scheduled' as const,
    attendanceStatus: 'pending' as const,
    lessonCovered: undefined,
    homeworkAssigned: undefined,
    teacherNotes: undefined,
    materialsLink: null,
    recordingLink: null,
  };
}

export async function fetchActiveClassSchedulesByStudentIds(studentIds: string[]) {
  const client = requireSupabase();
  const ids = Array.from(new Set(studentIds.filter(Boolean)));

  if (!ids.length) {
    return [] as ClassScheduleRow[];
  }

  const { data, error } = await client
    .from('class_schedules')
    .select('id, student_id, program_id, teacher_profile_id, day_of_week, start_time, duration_minutes, timezone, platform, meeting_link, status')
    .in('student_id', ids)
    .eq('status', 'active')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as ClassScheduleRow[];
}

export async function fetchActiveClassSchedulesByTeacherProfileId(teacherProfileId: string) {
  const client = requireSupabase();

  if (!teacherProfileId) {
    return [] as ClassScheduleRow[];
  }

  const { data, error } = await client
    .from('class_schedules')
    .select('id, student_id, program_id, teacher_profile_id, day_of_week, start_time, duration_minutes, timezone, platform, meeting_link, status')
    .eq('teacher_profile_id', teacherProfileId)
    .eq('status', 'active')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as ClassScheduleRow[];
}

export async function replaceStudentClassSchedules(payload: {
  studentId: string;
  programId?: string | null;
  teacherProfileId: string;
  timezone: string;
  schedules: ClassScheduleInput[];
}) {
  const client = requireSupabase();
  const now = new Date().toISOString();

  const { error: archiveError } = await client
    .from('class_schedules')
    .update({ status: 'archived', updated_at: now })
    .eq('student_id', payload.studentId)
    .eq('status', 'active');

  if (archiveError) {
    throw archiveError;
  }

  const rows = payload.schedules.map((schedule) => ({
    student_id: payload.studentId,
    program_id: payload.programId || null,
    teacher_profile_id: payload.teacherProfileId,
    day_of_week: schedule.dayOfWeek,
    start_time: normalizeScheduleTime(schedule.startTime),
    duration_minutes: schedule.durationMinutes || 30,
    timezone: payload.timezone || 'Africa/Cairo',
    platform: schedule.platform || 'Zoom',
    meeting_link: schedule.meetingLink || null,
    status: 'active',
  }));

  const { data, error } = await client
    .from('class_schedules')
    .insert(rows)
    .select('id, student_id, program_id, teacher_profile_id, day_of_week, start_time, duration_minutes, timezone, platform, meeting_link, status');

  if (error) {
    throw error;
  }

  return (data || []) as ClassScheduleRow[];
}
