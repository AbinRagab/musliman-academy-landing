import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { listStudentHomeworkFiles, uploadHomeworkFile } from './storageService';
import {
  resolveCurrentStudentProfile,
  type StudentHomeworkItem,
} from './studentService';
import { resolveTeacherNamesById } from './teachersService';

export function getHomeworkSummary(homework: StudentHomeworkItem[]) {
  return {
    pending: homework.filter((item) => item.status === 'pending').length,
    submitted: homework.filter((item) => item.status === 'submitted').length,
    reviewed: homework.filter((item) => item.status === 'reviewed').length,
    overdue: homework.filter((item) => item.status === 'overdue').length,
    latestFeedback: homework.find((item) => item.teacherFeedback)?.teacherFeedback || 'No teacher feedback yet',
  };
}

export async function fetchStudentHomeworkData() {
  if (!isSupabaseConfigured) {
    const homework: StudentHomeworkItem[] = [];
    return {
      homework,
      summary: getHomeworkSummary(homework),
      submissions: [],
    };
  }

  const profile = await resolveCurrentStudentProfile();
  const [assignmentsResult, submissions] = await Promise.all([
    supabase
      ?.from('homework_assignments')
      .select('id, class_id, student_id, teacher_id, title, instructions, due_at, status, created_at')
      .eq('student_id', profile.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false }) || Promise.resolve({ data: [], error: null }),
    listStudentHomeworkFiles(profile.id),
  ]);

  if (assignmentsResult.error) {
    throw assignmentsResult.error;
  }

  const assignments = assignmentsResult.data || [];
  const classIds = Array.from(new Set(assignments.map((assignment) => assignment.class_id).filter(Boolean))) as string[];
  const teacherIds = Array.from(new Set(assignments.map((assignment) => assignment.teacher_id).filter(Boolean))) as string[];
  const [classesResult, teacherById] = await Promise.all([
    classIds.length && supabase
      ? supabase.from('classes').select('id, class_date, start_time, lesson_title').in('id', classIds)
      : Promise.resolve({ data: [] }),
    resolveTeacherNamesById(teacherIds),
  ]);

  if ('error' in classesResult && classesResult.error) {
    throw classesResult.error;
  }

  const classById = new Map((classesResult.data || []).map((classRow) => [classRow.id, classRow]));
  const assignedHomework = assignments.map((assignment) => buildHomeworkFromAssignment(
    assignment,
    classById.get(assignment.class_id),
    teacherById.get(assignment.teacher_id) || 'Teacher',
  ));

    const homeworkByClassId = new Map(assignedHomework.map((item) => [item.classId, item]));

    submissions.forEach((submission) => {
      const existing = homeworkByClassId.get(submission.class_id);

      if (existing) {
        homeworkByClassId.set(submission.class_id, {
          ...existing,
          id: submission.id,
          status: submission.teacher_feedback ? 'reviewed' : 'submitted',
          filePath: submission.file_path,
          fileName: submission.file_name,
          fileType: submission.file_type,
          fileSize: submission.file_size,
          notes: submission.notes,
          submittedAt: formatSubmissionDate(submission.created_at),
          teacherFeedback: submission.teacher_feedback || undefined,
        });
      } else {
        homeworkByClassId.set(submission.class_id, {
          id: submission.id,
          classId: submission.class_id,
          title: submission.file_name || 'Submitted homework',
          relatedClass: 'Submitted homework',
          teacher: 'Teacher',
          dueDate: 'Submitted',
          instructions: submission.notes || 'Homework file submitted.',
          status: submission.teacher_feedback ? 'reviewed' : 'submitted',
          filePath: submission.file_path,
          fileName: submission.file_name,
          fileType: submission.file_type,
          fileSize: submission.file_size,
          notes: submission.notes,
          submittedAt: formatSubmissionDate(submission.created_at),
          teacherFeedback: submission.teacher_feedback || undefined,
        });
      }
    });

  const homework = Array.from(homeworkByClassId.values());

  return {
    homework,
    summary: getHomeworkSummary(homework),
    submissions,
  };
}

function buildHomeworkFromAssignment(
  assignment: {
    id: string;
    class_id: string;
    teacher_id: string;
    title: string;
    instructions: string;
    due_at?: string | null;
  },
  classSession?: { id: string; class_date?: string | null; start_time?: string | null; lesson_title?: string | null },
  teacher = 'Teacher',
): StudentHomeworkItem {
  return {
    id: assignment.id,
    classId: assignment.class_id,
    title: assignment.title || 'Homework assignment',
    relatedClass: classSession?.lesson_title || 'Class assignment',
    teacher,
    dueDate: assignment.due_at ? formatSubmissionDate(assignment.due_at) : 'Due date not set',
    instructions: assignment.instructions || 'Homework details will be published by your teacher.',
    status: 'pending',
  };
}

function formatSubmissionDate(dateTime: string) {
  const parsed = new Date(dateTime);
  return Number.isNaN(parsed.getTime()) ? dateTime : parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function uploadHomeworkSubmission(payload: { studentId: string; classId: string; file: File; note: string }) {
  const submission = await uploadHomeworkFile(payload.studentId, payload.classId, payload.file, payload.note);
  return { success: true, submission };
}
