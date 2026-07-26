import { studentPortalMock } from './studentService';

export async function fetchStudentProgressData() {
  const presentRecords = studentPortalMock.attendance.filter((record) => record.status === 'present' || record.status === 'late').length;
  const attendanceContribution = studentPortalMock.attendance.length
    ? Math.round((presentRecords / studentPortalMock.attendance.length) * 100)
    : 0;
  const homework = studentPortalMock.homework;
  const completedHomework = homework.filter((item) => item.status === 'submitted' || item.status === 'reviewed').length;
  const homeworkContribution = homework.length ? Math.round((completedHomework / homework.length) * 100) : 0;

  return {
    profile: studentPortalMock.profile,
    skills: studentPortalMock.skills,
    topics: studentPortalMock.topics,
    attendanceContribution,
    homeworkContribution,
    recommendations: {
      focusArea: 'Strengthen Madd timing and stopping rules before moving deeper into Level 3.',
      revisionAdvice: 'Revise Surah Al-Mulk verses 1-5 daily at a slow pace.',
      homeworkAdvice: 'Submit short audio recordings before class so the teacher can mark specific pronunciation points.',
    },
  };
}
