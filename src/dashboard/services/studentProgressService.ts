import { supabase } from '../../lib/supabaseClient';
import { fetchStudentAttendanceData } from './studentAttendanceService';
import { fetchStudentHomeworkData } from './studentHomeworkService';
import {
  resolveCurrentStudentProfile,
  type StudentProgressTopic,
  type StudentSkillRating,
} from './studentService';

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
  const topics = buildTopics(evaluationData.evaluations);
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
      evaluations: [] as any[],
      recommendations: emptyRecommendations(),
    };
  }

  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    return {
      evaluations: [] as any[],
      recommendations: emptyRecommendations(),
    };
  }

  const latest = data[0];

  return {
    evaluations: data,
    recommendations: {
      focusArea: latest.next_focus || latest.recommendation || 'No teacher recommendation yet',
      revisionAdvice: latest.teacher_feedback || 'No revision advice yet',
      homeworkAdvice: latest.homework_recommendation || 'No homework advice yet',
    },
  };
}

function buildSkillRatings(evaluations: any[]): StudentSkillRating[] {
  if (!evaluations.length) {
    return [];
  }

  const fields = [
    ['Reading Accuracy', 'reading_score', 'reading_accuracy'],
    ['Tajweed', 'tajweed_score', 'tajweed'],
    ['Memorization', 'memorization_score', 'memorization'],
    ['Arabic Understanding', 'understanding_score', 'arabic_level'],
    ['Participation', 'participation_score', 'participation'],
    ['Homework Commitment', 'homework_score', 'homework_commitment'],
  ] as const;

  return fields.map(([label, primaryKey, fallbackKey]) => {
    const values = evaluations
      .map((evaluation) => Number(evaluation[primaryKey] ?? evaluation[fallbackKey] ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    const average = values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;

    return {
      label,
      value: average <= 10 ? average * 10 : average,
      note: values.length ? 'Calculated from teacher evaluations.' : 'No evaluation score yet.',
    };
  });
}

function buildTopics(evaluations: any[]): StudentProgressTopic[] {
  return evaluations.slice(0, 6).map((evaluation): StudentProgressTopic => ({
    id: evaluation.id,
    topic: evaluation.lesson_topic || evaluation.class_title || 'Teacher evaluation',
    classDate: formatDate(evaluation.created_at),
    teacher: evaluation.teacher_name || 'Teacher',
    score: evaluation.status || 'Submitted',
    feedback: evaluation.teacher_feedback || evaluation.recommendation || 'No feedback note recorded.',
  }));
}

function emptyRecommendations() {
  return {
    focusArea: 'No teacher recommendation yet',
    revisionAdvice: 'No revision advice yet',
    homeworkAdvice: 'No homework advice yet',
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
