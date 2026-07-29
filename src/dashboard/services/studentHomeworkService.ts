import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { fetchStudentClassesData } from './studentClassesService';
import { listStudentHomeworkFiles, uploadHomeworkFile } from './storageService';
import {
  resolveCurrentStudentProfile,
  type StudentClassSession,
  type StudentHomeworkItem,
} from './studentService';

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

  try {
    const profile = await resolveCurrentStudentProfile();
    const [{ classes }, submissions] = await Promise.all([
      fetchStudentClassesData(),
      listStudentHomeworkFiles(profile.id),
    ]);

    const assignedHomework = classes
      .filter((classSession) => Boolean(classSession.homeworkAssigned))
      .map((classSession) => buildHomeworkFromClass(classSession));

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
  } catch {
    const homework: StudentHomeworkItem[] = [];
    return {
      homework,
      summary: getHomeworkSummary(homework),
      submissions: [],
    };
  }
}

function buildHomeworkFromClass(classSession: StudentClassSession): StudentHomeworkItem {
  return {
    id: `class-homework-${classSession.id}`,
    classId: classSession.id,
    title: `${classSession.title} homework`,
    relatedClass: classSession.title,
    teacher: classSession.teacher,
    dueDate: classSession.date,
    instructions: classSession.homeworkAssigned || 'Homework details will be published by your teacher.',
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
