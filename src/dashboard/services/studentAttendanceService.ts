import { studentPortalMock, type StudentAttendanceRecord, type StudentAttendanceStatus } from './studentService';

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
  return {
    records: studentPortalMock.attendance,
    summary: getAttendanceSummary(studentPortalMock.attendance),
  };
}

export async function reportAttendanceIssue(payload: { attendanceId: string; reason: string; message: string }) {
  return { success: true, payload };
}
