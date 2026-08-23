import { supabase } from '../../lib/supabaseClient';
import {
  mapEvaluation,
  noEvaluationText,
  notProvidedText,
  ratingToPercent,
  type CanonicalEvaluation,
} from './evaluationsService';
import { fetchStudentAttendanceData } from './studentAttendanceService';
import { fetchStudentHomeworkData } from './studentHomeworkService';
import {
  resolveCurrentStudentProfile,
  type StudentProgressTopic,
  type StudentSkillRating,
} from './studentService';
import { resolveTeacherNamesById } from './teachersService';
import type { Evaluation } from '../types';

export async function fetchStudentProgressData() {
  const profile = await resolveCurrentStudentProfile();
  const [attendanceData, homeworkData, evaluationData] = await Promise.all([
    fetchStudentAttendanceData(),
    fetchStudentHomeworkData(),
    fetchStudentEvaluations(profile.id),
  ]);

  const attendanceContribution = Number.parseInt(attendanceData.summary.rate, 10) || 0;
  const homework = homeworkData.homework;
  const completedHomework = homework.filter((item) => item.status === 'submitted' || item.status === 'reviewed').length;
  const homeworkContribution = homework.length ? Math.round((completedHomework / homework.length) * 100) : 0;
  const skills = buildSkillRatings(evaluationData.evaluations);
  const topics = buildTopics(evaluationData.evaluations, evaluationData.teacherById);
  const overallProgress = skills.length
    ? Math.round(skills.reduce((total, skill) => total + skill.value, 0) / skills.length)
    : Math.round((attendanceContribution + homeworkContribution) / 2);

  return {
    profile: {
      ...profile,
      attendanceRate: `${attendanceContribution}%`,
      overallProgress,
      completedLessons: attendanceData.records.filter((record) => record.status === 'present' || record.status === 'late').length,
    },
    skills,
    topics,
    attendanceContribution,
    homeworkContribution,
    recommendations: evaluationData.recommendations,
  };
}

async function fetchStudentEvaluations(studentId: string) {
  if (!supabase || !studentId) {
    return {
      evaluations: [] as CanonicalEvaluation[],
      teacherById: new Map<string, string>(),
      recommendations: emptyRecommendations(),
    };
  }

  const { data, error } = await supabase
    .from('evaluations')
    .select('id, student_id, teacher_id, class_id, recitation_rating, tajweed_rating, understanding_rating, behavior_rating, progress_feedback, teacher_notes, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const evaluations = (data || []).map((row) => mapEvaluation(row as Evaluation));
  const teacherIds = Array.from(new Set(evaluations.map((evaluation) => evaluation.teacherId).filter(Boolean))) as string[];
  const teacherById = await resolveTeacherNamesById(teacherIds);

  if (!evaluations.length) {
    return {
      evaluations,
      teacherById,
      recommendations: emptyRecommendations(),
    };
  }

  const latest = evaluations[0];

  return {
    evaluations,
    teacherById,
    recommendations: {
      focusArea: latest.progressFeedback || notProvidedText,
      revisionAdvice: latest.teacherNotes || notProvidedText,
      homeworkAdvice: notProvidedText,
    },
  };
}

function buildSkillRatings(evaluations: CanonicalEvaluation[]): StudentSkillRating[] {
  if (!evaluations.length) {
    return [];
  }

  const fields = [
    ['Recitation', 'recitationRating'],
    ['Tajweed', 'tajweedRating'],
    ['Understanding', 'understandingRating'],
    ['Behavior / Engagement', 'behaviorRating'],
  ] as const;

  return fields.map(([label, key]) => {
    const values = evaluations
      .map((evaluation) => ratingToPercent(evaluation[key]))
      .filter((value): value is number => value !== null);
    const average = values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;

    return {
      label,
      value: average,
      note: values.length ? 'Calculated from teacher evaluations.' : notProvidedText,
    };
  });
}

function buildTopics(evaluations: CanonicalEvaluation[], teacherById: Map<string, string>): StudentProgressTopic[] {
  return evaluations.slice(0, 6).map((evaluation): StudentProgressTopic => ({
    id: evaluation.id,
    topic: 'Teacher evaluation',
    classDate: formatDate(evaluation.createdAt),
    teacher: evaluation.teacherId ? teacherById.get(evaluation.teacherId) || 'Teacher' : 'Teacher',
    score: averageEvaluationScore(evaluation),
    feedback: evaluation.progressFeedback || evaluation.teacherNotes || notProvidedText,
  }));
}

function averageEvaluationScore(evaluation: CanonicalEvaluation) {
  const values = [
    evaluation.recitationRating,
    evaluation.tajweedRating,
    evaluation.understandingRating,
    evaluation.behaviorRating,
  ].filter((value): value is number => value !== null);

  if (!values.length) {
    return notProvidedText;
  }

  return `${Math.round(values.reduce((total, value) => total + value, 0) / values.length)}/5`;
}

function emptyRecommendations() {
  return {
    focusArea: noEvaluationText,
    revisionAdvice: noEvaluationText,
    homeworkAdvice: noEvaluationText,
  };
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Date pending';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
