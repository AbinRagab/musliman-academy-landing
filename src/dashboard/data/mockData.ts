export type DashboardRole = 'admin' | 'teacher' | 'student';
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type StatRow = { label: string; value: string | number; trend?: string; icon?: string };
type OperationRow = { title: string; value: string | number; meta: string };
type RecentClassRow = { time: string; className: string; teacher: string; students: string; status: string };
type UserRow = { name: string; email: string; role: string; status: string; permissions: string };
type PermissionRow = { permission: string; superAdmin: boolean; admin: boolean; teacher: boolean; student: boolean };
type StudentProfileRow = {
  name: string;
  course: string;
  teacher: string;
  attendanceRate: string;
  totalClasses: number;
  completedLessons: number;
  currentCourse: string;
};
type StudentTimetableRow = { time: string; className: string; teacher: string; status: string };
type TeacherScheduleRow = { time: string; student: string; program: string; status: string };
type TeacherStudentRow = { student: string; level: string; nextClass: string; attendance: string };
type StudentEvaluationRow = { student: string; recitation: number; tajweed: number; understanding: number; status: string };
type FreeTrialRow = { student: string; program: string; dateTime: string };
type AdminLeadRow = { name: string; contact: string; program: string; source: string; owner: string; status: string; nextFollowUp: string };
type AdminStudentRow = { name: string; program: string; teacher: string; level: string; attendance: string; status: string; nextClass: string };
type AdminTeacherRow = { name: string; specialization: string; students: number; trials: number; availability: string; status: string };
type AdminPaymentRow = { student: string; program: string; packageName: string; amount: string; status: string; nextDue: string };
type AdminReportRow = { report: string; owner: string; period: string; status: string; metric: string };
type RolePermissionRow = {
  area: string;
  superAdmin: boolean;
  admin: boolean;
  teacher: boolean;
  student: boolean;
  admissions: boolean;
  finance: boolean;
  viewer: boolean;
};
type PerformanceRow = { label: string; value: number };
type AttendanceHistoryRow = { date: string; className: string; teacher: string; status: string; notes: string };
type ProgressTopicRow = { topic: string; score: string; feedback: string };
type PaymentSummaryRow = { packageName: string; status: string; nextDue: string; remaining: string };

export const adminStats: StatRow[] = [];
export const academyOperations: OperationRow[] = [];
export const recentClasses: RecentClassRow[] = [];
export const users: UserRow[] = [];
export const permissionToggles: string[] = [];
export const permissionsMatrix: PermissionRow[] = [];

export const studentProfile: StudentProfileRow = {
  name: 'Student',
  course: 'No course assigned',
  teacher: 'No teacher assigned',
  attendanceRate: '0%',
  totalClasses: 0,
  completedLessons: 0,
  currentCourse: 'No course assigned',
};

export const studentTimetable: StudentTimetableRow[] = [];
export const teacherStats: StatRow[] = [];
export const teacherSchedule: TeacherScheduleRow[] = [];
export const teacherStudents: TeacherStudentRow[] = [];
export const attendanceStudents: string[] = [];
export const studentEvaluations: StudentEvaluationRow[] = [];
export const freeTrials: FreeTrialRow[] = [];
export const adminLeads: AdminLeadRow[] = [];
export const adminStudents: AdminStudentRow[] = [];
export const adminTeachers: AdminTeacherRow[] = [];
export const adminPayments: AdminPaymentRow[] = [];
export const adminReports: AdminReportRow[] = [];
export const rolePermissionMatrix: RolePermissionRow[] = [];
export const teacherPerformance: PerformanceRow[] = [];
export const studentAttendanceHistory: AttendanceHistoryRow[] = [];
export const studentProgressTopics: ProgressTopicRow[] = [];
export const studentPaymentSummary: PaymentSummaryRow[] = [];
