export type TeacherClassReportPayload = {
  studentId: string;
  classId?: string;
  lessonCovered: string;
  homework?: string;
  classNotes?: string;
  participation?: string;
  nextLessonPlan?: string;
};

export type TeacherAttendancePayload = {
  studentId: string;
  classId?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
};

export type TeacherEvaluationPayload = {
  studentId: string;
  classId?: string;
  recitationRating: number;
  tajweedRating: number;
  understandingRating: number;
  behaviorRating: number;
  progressNotes?: string;
  recommendation?: string;
};

export type TeacherTrialFeedbackPayload = {
  trialId: string;
  readingLevel: string;
  tajweedLevel: string;
  arabicLevel?: string;
  engagement: string;
  recommendedLevel: string;
  teacherFeedback: string;
  recommendation: string;
  result: string;
};

export async function addClassReport(payload: TeacherClassReportPayload) {
  return { success: true, payload };
}

export async function markAttendance(payload: TeacherAttendancePayload) {
  return { success: true, payload };
}

export async function addEvaluation(payload: TeacherEvaluationPayload) {
  return { success: true, payload };
}

export async function submitTrialFeedback(payload: TeacherTrialFeedbackPayload) {
  return { success: true, payload };
}
