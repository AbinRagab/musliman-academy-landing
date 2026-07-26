import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import {
  ComingSoonModal,
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

type DashboardData = {
  profile: StudentPortalProfile;
  nextClass: StudentClassSession | null;
  upcomingClasses: StudentClassSession[];
  trial: StudentTrial;
  homework: StudentHomeworkItem[];
  payments: StudentPayment[];
  messages: StudentMessage[];
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentDashboardData().then(setData);
  }, []);

  if (!data) {
    return <div className="dashboard-loading-state">Loading student portal...</div>;
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
      {comingSoon && <ComingSoonModal feature={comingSoon} onClose={() => setComingSoon(null)} />}

      <StudentPageHeader
        title="Student Dashboard"
        subtitle="A calm overview of the next class, homework, progress, attendance, and package status."
      />

      <div className="dashboard-greeting-card student-hero-banner">
        <div>
          <span>Assalamu Alaikum, {data.profile.name}</span>
          <h2>{nextClass ? nextClass.title : 'Your learning plan is being scheduled'}</h2>
          <p>
            {nextClass
              ? `${nextClass.date} at ${nextClass.time} with ${nextClass.teacher}`
              : 'The academy team will confirm the next session and meeting details.'}
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
          {nextClass?.meetingLink ? 'Join Class' : 'Contact Academy Team'}
        </ActionButton>
      </div>

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Upcoming Classes" value={upcomingClasses.length} trend="Confirmed sessions" icon="calendar" />
        <StudentStatCard label="Enrollment Status" value={data.trial.status === 'converted' ? 'Enrolled' : data.trial.status} trend={data.trial.result} icon="gift" />
        <StudentStatCard label="Assigned Teacher" value={data.profile.teacher.replace('Ust. ', '').replace('Sh. ', '')} trend={data.profile.program} icon="teacher" />
        <StudentStatCard label="Attendance Rate" value={data.profile.attendanceRate} trend="Calculated by system" icon="clipboard" />
      </div>

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Current Level" value={data.profile.level} trend={data.profile.program} icon="quran" />
        <StudentStatCard label="Completed Lessons" value={data.profile.completedLessons} trend="From completed class records" icon="book" />
        <StudentStatCard label="Pending Homework" value={pendingHomework} trend="Needs student action" icon="document" />
        <StudentStatCard label="Remaining Sessions" value={payment?.remainingSessions ?? 0} trend={payment?.packageName || 'Package pending'} icon="award" />
      </div>

      <div className="dashboard-grid dashboard-grid--student">
        <SectionCard
          title="Weekly Timetable Preview"
          subtitle="Upcoming confirmed sessions only"
          action={<ActionButton variant="ghost" onClick={() => navigate('/dashboard/student/schedule')}>View Schedule</ActionButton>}
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
            <ProgressBar value={data.profile.overallProgress} label="Overall progress" />
            <div className="dashboard-progress-facts">
              <span>{data.profile.completedLessons} lessons completed</span>
              <span>{data.profile.attendanceRate} attendance</span>
              <span>{pendingHomework} homework items pending</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <NextClassCard classSession={nextClass} onContact={() => setCompose({ to: 'Academy Team', subject: 'Class link request' })} compact />

      <SectionCard title="Quick Links">
        <div className="dashboard-quick-links student-quick-links">
          <button type="button" onClick={() => navigate('/dashboard/student/homework')}>
            <Icon name="document" />
            <span>Upload Homework</span>
          </button>
          <button type="button" onClick={() => setComingSoon('Download Materials')}>
            <Icon name="download" />
            <span>Download Materials</span>
          </button>
          <button type="button" onClick={() => setComingSoon('Dua & Azkar')}>
            <Icon name="sparkles" />
            <span>Dua & Azkar</span>
          </button>
          <button type="button" onClick={() => setComingSoon('Quran Library')}>
            <Icon name="quran" />
            <span>Quran Library</span>
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
