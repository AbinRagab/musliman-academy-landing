import type { Evaluation } from '../types';

export type CanonicalEvaluation = {
  id: string;
  studentId: string | null;
  teacherId: string | null;
  classId: string | null;
  recitationRating: number | null;
  tajweedRating: number | null;
  understandingRating: number | null;
  behaviorRating: number | null;
  progressFeedback: string | null;
  teacherNotes: string | null;
  createdAt: string | null;
};

export const noEvaluationText = 'No evaluation yet';
export const notProvidedText = 'Not provided';

export function mapEvaluation(row: Evaluation): CanonicalEvaluation {
  return {
    id: row.id,
    studentId: row.student_id || null,
    teacherId: row.teacher_id || null,
    classId: row.class_id || null,
    recitationRating: numberOrNull(row.recitation_rating),
    tajweedRating: numberOrNull(row.tajweed_rating),
    understandingRating: numberOrNull(row.understanding_rating),
    behaviorRating: numberOrNull(row.behavior_rating),
    progressFeedback: row.progress_feedback || null,
    teacherNotes: row.teacher_notes || null,
    createdAt: row.created_at || null,
  };
}

export function ratingToPercent(value: number | null) {
  if (!value) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round((value / 5) * 100)));
}

function numberOrNull(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}
