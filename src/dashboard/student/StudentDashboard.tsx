import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardSkeleton from '../components/DashboardSkeleton';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import {
  ComposeMessageModal,
  NextClassCard,
  StudentPageHeader,
  StudentStatCard,
} from '../components/student/StudentPortalComponents';
import {
  fetchStudentDashboardData,
  getNextClass,
  getUpcomingClasses,
  type StudentClassSession,
  type StudentHomeworkItem,
  type StudentMessage,
  type StudentPayment,
  type StudentPortalProfile,
  type StudentTrial,
} from '../services/studentService';
import { sendStudentMessage } from '../services/studentMessagesService';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

type DashboardData = {
  profile: StudentPortalProfile;
  nextClass: StudentClassSession | null;
  upcomingClasses: StudentClassSession[];
  trial: StudentTrial;
  homework: StudentHomeworkItem[];
  payments: StudentPayment[];
  messages: StudentMessage[];
  sectionErrors?: Partial<Record<'homework' | 'payments' | 'messages', string>>;
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { t } = useDashboardLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);

  useEffect(() => {
    fetchStudentDashboardData().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="dashboard-page dashboard-page--management dashboard-page--student-dashboard">
        <StudentPageHeader title={t('Student Dashboard')} subtitle={t('Loading your class, homework, progress, and package summary.')} />
        <DashboardSkeleton cards={4} rows={5} label={t('Loading student dashboard data')} />
      </div>
    );
  }

  const nextClass = data.nextClass || getNextClass(data.upcomingClasses);
  const pendingHomework = data.homework.filter((item) => item.status === 'pending' || item.status === 'overdue').length;
  const payment = data.payments[0];
  const upcomingClasses = getUpcomingClasses(data.upcomingClasses).slice(0, 5);

  return (
    <div className="dashboard-page dashboard-page--management dashboard-page--student-dashboard">
      {compose && (
        <ComposeMessageModal
          to={compose.to}
          subject={compose.subject}
          onClose={() => setCompose(null)}
          onSend={(payload) => {
            sendStudentMessage(payload).then(() => setCompose(null));
          }}
        />
      )}

      <StudentPageHeader
        title={t('Student Dashboard')}
        subtitle={t('A calm overview of the next class, homework, progress, attendance, and package status.')}
      />

      <div className="dashboard-greeting-card student-hero-banner">
        <div>
          <span>{t('Assalamu Alaikum, {{name}}', { name: data.profile.name })}</span>
          <h2>{nextClass ? nextClass.title : t('Your learning plan is being scheduled')}</h2>
          <p>
            {nextClass
              ? t('{{date}} at {{time}} with {{teacher}}', { date: nextClass.date, time: nextClass.time, teacher: nextClass.teacher })
              : t('The academy team will confirm the next session and meeting details.')}
          </p>
        </div>
        <ActionButton
          onClick={() => {
            if (nextClass?.meetingLink) {
              window.open(nextClass.meetingLink, '_blank', 'noopener,noreferrer');
            } else {
              setCompose({ to: 'Academy Team', subject: 'Class link request' });
            }
          }}
        >
          <Icon name={nextClass?.meetingLink ? 'video' : 'support'} size={18} />
          {nextClass?.meetingLink ? t('Join Class') : t('Contact Academy Team')}
        </ActionButton>
      </div>

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Upcoming Classes" value={upcomingClasses.length} trend="Confirmed sessions" icon="calendar" />
        <StudentStatCard label="Enrollment Status" value={t(data.trial.status === 'converted' ? 'Enrolled' : data.trial.status)} trend={data.trial.result} icon="gift" />
        <StudentStatCard label="Assigned Teacher" value={data.profile.teacher.replace('Ust. ', '').replace('Sh. ', '')} trend={data.profile.program} icon="teacher" />
        <StudentStatCard label="Attendance Rate" value={data.profile.attendanceRate} trend="Calculated by system" icon="clipboard" />
      </div>

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Current Level" value={data.profile.level} trend={data.profile.program} icon="quran" />
        <StudentStatCard label="Completed Lessons" value={data.profile.completedLessons} trend="From completed class records" icon="book" />
        <StudentStatCard label="Pending Homework" value={data.sectionErrors?.homework ? t('Error') : pendingHomework} trend={data.sectionErrors?.homework || 'Needs student action'} icon="document" />
        <StudentStatCard label="Remaining Sessions" value={data.sectionErrors?.payments ? t('Error') : payment?.remainingSessions ?? t('Not provided')} trend={data.sectionErrors?.payments || payment?.packageName || 'Package pending'} icon="award" />
      </div>

      <div className="dashboard-grid dashboard-grid--student">
        <SectionCard
          title="Weekly Timetable Preview"
          subtitle="Upcoming confirmed sessions only"
          action={<ActionButton variant="ghost" onClick={() => navigate('/dashboard/student/schedule')}>{t('View Schedule')}</ActionButton>}
        >
          <div className="student-timetable-preview">
            {upcomingClasses.map((session) => (
              <article key={session.id}>
                <span>{session.date}</span>
                <strong>{session.time}</strong>
                <p>{session.title}</p>
                <small>{session.teacher}</small>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Course Progress" subtitle={`${data.profile.program} / ${data.profile.level}`}>
          <div className="dashboard-progress-summary student-progress-summary">
            <div className="dashboard-progress-ring" style={{ '--progress': `${data.profile.overallProgress}%` } as CSSProperties}>
              <span>{data.profile.overallProgress}%</span>
            </div>
            <ProgressBar value={data.profile.overallProgress} label={t('Overall progress')} />
            <div className="dashboard-progress-facts">
              <span>{t('{{count}} lessons completed', { count: data.profile.completedLessons })}</span>
              <span>{t('{{rate}} attendance', { rate: data.profile.attendanceRate })}</span>
              <span>{t('{{count}} homework items pending', { count: pendingHomework })}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <NextClassCard classSession={nextClass} onContact={() => setCompose({ to: 'Academy Team', subject: 'Class link request' })} compact />

      <SectionCard title="Quick Links">
        <div className="dashboard-quick-links student-quick-links">
          <button type="button" onClick={() => navigate('/dashboard/student/homework')}>
            <Icon name="document" />
            <span>{t('Upload Homework')}</span>
          </button>
          <button type="button" disabled title={t('This feature requires database setup.')}>
            <Icon name="download" />
            <span>{t('Materials require setup')}</span>
          </button>
          <button type="button" disabled title={t('This feature requires database setup.')}>
            <Icon name="sparkles" />
            <span>{t('Dua & Azkar requires setup')}</span>
          </button>
          <button type="button" disabled title={t('This feature requires database setup.')}>
            <Icon name="quran" />
            <span>{t('Library requires setup')}</span>
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
