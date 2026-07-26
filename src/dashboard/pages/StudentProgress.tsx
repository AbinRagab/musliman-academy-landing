import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { ProgressSkillCard, StudentPageHeader, StudentStatCard } from '../components/student/StudentPortalComponents';
import { fetchStudentProgressData } from '../services/studentProgressService';
import { type StudentPortalProfile, type StudentProgressTopic, type StudentSkillRating } from '../services/studentService';

type ProgressData = {
  profile: StudentPortalProfile;
  skills: StudentSkillRating[];
  topics: StudentProgressTopic[];
  attendanceContribution: number;
  homeworkContribution: number;
  recommendations: {
    focusArea: string;
    revisionAdvice: string;
    homeworkAdvice: string;
  };
};

export default function StudentProgress() {
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    fetchStudentProgressData().then(setData);
  }, []);

  if (!data) {
    return <div className="dashboard-loading-state">Loading progress...</div>;
  }

  return (
    <div className="dashboard-page dashboard-page--management">
      <StudentPageHeader
        title="Progress"
        subtitle="Learning progress, levels, skills, recent lesson topics, and teacher recommendations."
        action={<StatusBadge label="Calculated by System" />}
      />

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Current Course" value={data.profile.program} trend={data.profile.level} icon="quran" />
        <StudentStatCard label="Overall Progress" value={`${data.profile.overallProgress}%`} trend="From evaluations and completed lessons" icon="chart" />
        <StudentStatCard label="Completed Lessons" value={data.profile.completedLessons} trend="Teacher-recorded lessons" icon="book" />
        <StudentStatCard label="Attendance Contribution" value={`${data.attendanceContribution}%`} trend="Present and late records" icon="clipboard" />
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Progress Summary" subtitle="Academic indicators for the current level">
          <div className="student-progress-stack">
            <ProgressBar value={data.profile.overallProgress} label="Overall progress" />
            <ProgressBar value={data.attendanceContribution} label="Attendance contribution" />
            <ProgressBar value={data.homeworkContribution} label="Homework contribution" />
          </div>
        </SectionCard>

        <SectionCard title="Teacher Recommendations" subtitle="Current focus for the next learning cycle">
          <div className="student-recommendation-list">
            <article>
              <Icon name="star" size={17} />
              <span>Next focus area</span>
              <p>{data.recommendations.focusArea}</p>
            </article>
            <article>
              <Icon name="book" size={17} />
              <span>Revision advice</span>
              <p>{data.recommendations.revisionAdvice}</p>
            </article>
            <article>
              <Icon name="document" size={17} />
              <span>Homework advice</span>
              <p>{data.recommendations.homeworkAdvice}</p>
            </article>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Skill Ratings" subtitle="Teacher evaluation areas">
        <div className="student-skills-grid">
          {data.skills.map((skill) => <ProgressSkillCard key={skill.label} skill={skill} />)}
        </div>
      </SectionCard>

      <SectionCard title="Recent Lesson Topics" subtitle="Compact view without horizontal scrolling">
        <div className="student-topic-list">
          {data.topics.map((topic) => (
            <article key={topic.id}>
              <div>
                <h3>{topic.topic}</h3>
                <p>{topic.classDate} - {topic.teacher}</p>
              </div>
              <StatusBadge label={topic.score} />
              <p>{topic.feedback}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
