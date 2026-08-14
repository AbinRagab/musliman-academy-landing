import type { AuthRole } from '../../auth/AuthProvider';
import type { ClassScheduleInput } from '../classSchedulesService';

export type StudentManagementRow = {
  id: string;
  name: string;
  programId?: string | null;
  program: string;
  assignedTeacherId?: string | null;
  teacher: string;
  level: string;
  attendance: string;
  status: string;
  nextClass: string;
  scheduleNotes?: string | null;
  startDate?: string | null;
};

export type StudentActionTeacher = {
  id: string;
  teacherId: string;
  profileId: string;
  full_name: string;
  email?: string | null;
  specialization?: string | null;
  availability?: string | null;
};

export type StudentProgramOption = {
  id: string;
  name: string;
};

export type StudentAttendanceRecord = {
  id: string;
  class_id: string | null;
  status: string;
  notes: string | null;
  marked_at: string | null;
  classDate?: string | null;
  classTime?: string | null;
};

export type StudentPaymentRecord = {
  id: string;
  currency: string | null;
  amount: number | null;
  payment_method: string | null;
  payment_date: string | null;
  next_due_date: string | null;
  status: string | null;
  notes: string | null;
};

export type StudentSchedulePayload = ClassScheduleInput;

export type StudentRecordTab =
  | 'overview'
  | 'personal'
  | 'academic'
  | 'trial'
  | 'classes'
  | 'attendance'
  | 'homework'
  | 'evaluations'
  | 'teacher-notes'
  | 'progress'
  | 'payments'
  | 'messages'
  | 'settings';

export type StudentRecordOwner = 'Admin' | 'Teacher' | 'Finance' | 'Student' | 'System';

export type StudentRecordField = {
  key: string;
  label: string;
  value: string;
  owner: StudentRecordOwner;
  editableBy: AuthRole[];
  input?: 'text' | 'select' | 'date' | 'textarea';
};

export type StudentRecordSection = {
  id: string;
  title: string;
  owner: StudentRecordOwner;
  description: string;
  fields: StudentRecordField[];
};

export type StudentRecord = {
  id: string;
  name: string;
  status: string;
  program: string;
  level: string;
  teacher: string;
  nextClass: string;
  attendanceRate: string;
  progressPercentage: string;
  sections: Record<StudentRecordTab, StudentRecordSection[]>;
};
