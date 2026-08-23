import {
  markTeacherAttendance,
  saveTeacherClassReport,
  saveTeacherEvaluation,
} from './teacherOperationsService';
import { submitTrialFeedback as saveTrialFeedback, type TrialResult } from './trialsService';

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
  if (!payload.classId) {
    throw new Error('A class record is required before saving a class report.');
  }

  await saveTeacherClassReport({
    classId: payload.classId,
    lessonCovered: payload.lessonCovered,
    homework: payload.homework,
    notes: payload.classNotes,
  });
}

export async function markAttendance(payload: TeacherAttendancePayload) {
  if (!payload.classId) {
    throw new Error('A class record is required before saving attendance.');
  }

  await markTeacherAttendance({
    classId: payload.classId,
    studentId: payload.studentId,
    status: payload.status,
    notes: payload.notes,
  });
}

export async function addEvaluation(payload: TeacherEvaluationPayload) {
  if (!payload.classId) {
    throw new Error('A class record is required before saving an evaluation.');
  }

  await saveTeacherEvaluation({
    studentId: payload.studentId,
    classId: payload.classId,
    recitationRating: payload.recitationRating,
    tajweedRating: payload.tajweedRating,
    understandingRating: payload.understandingRating,
    behaviorRating: payload.behaviorRating,
    progressNotes: payload.progressNotes,
    recommendation: payload.recommendation,
  });
}

export async function submitTrialFeedback(payload: TeacherTrialFeedbackPayload) {
  await saveTrialFeedback(payload.trialId, {
    recitationLevel: payload.readingLevel,
    tajweedLevel: payload.tajweedLevel,
    arabicLevel: payload.arabicLevel || '',
    engagement: payload.engagement,
    recommendedLevel: payload.recommendedLevel,
    teacherFeedback: payload.teacherFeedback,
    recommendation: payload.recommendation,
    result: normalizeTrialResult(payload.result),
    notes: payload.teacherFeedback,
  });
}

function normalizeTrialResult(value: string): TrialResult {
  if (value === 'recommended' || value === 'needs_follow_up' || value === 'not_suitable' || value === 'no_show') {
    return value;
  }

  return 'needs_follow_up';
}
