import { studentPortalMock, type StudentHomeworkItem } from './studentService';

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
  return {
    homework: studentPortalMock.homework,
    summary: getHomeworkSummary(studentPortalMock.homework),
  };
}

export async function uploadHomeworkSubmission(payload: { homeworkId: string; fileName?: string; note: string }) {
  return { success: true, payload };
}
