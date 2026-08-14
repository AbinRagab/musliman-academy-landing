import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import DashboardSkeleton from '../components/DashboardSkeleton';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { ComposeMessageModal, StudentModal, StudentPageHeader, StudentStatCard } from '../components/student/StudentPortalComponents';
import { sendStudentMessage } from '../services/studentMessagesService';
import { fetchStudentDashboardData, openExternalLink, type StudentTrial } from '../services/studentService';

export default function StudentFreeTrial() {
  const navigate = useNavigate();
  const [trial, setTrial] = useState<StudentTrial | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);

  useEffect(() => {
    fetchStudentDashboardData().then((data) => setTrial(data.trial));
  }, []);

  if (!trial) {
    return (
      <div className="dashboard-page dashboard-page--management">
        <StudentPageHeader title="Free Trial" subtitle="Loading your trial and enrollment status." />
        <DashboardSkeleton cards={4} rows={4} label="Loading student trial data" />
      </div>
    );
  }

  const isScheduled = trial.status === 'scheduled' || trial.status === 'rescheduled';
  const isCompleted = trial.status === 'completed' || trial.status === 'converted' || trial.status === 'not_converted';
  const isEnrolled = trial.status === 'converted' || trial.status === 'enrolled';

  return (
    <div className="dashboard-page dashboard-page--management">
      {compose && (
        <ComposeMessageModal
          to={compose.to}
          subject={compose.subject}
          onClose={() => setCompose(null)}
          onSend={(payload) => sendStudentMessage(payload).then(() => setCompose(null))}
        />
      )}
      {feedbackOpen && (
        <StudentModal title="Trial Feedback" onClose={() => setFeedbackOpen(false)} footer={<ActionButton onClick={() => setFeedbackOpen(false)}>Close</ActionButton>}>
          <div className="student-info-grid">
            <span>Recommended level <strong>{trial.recommendedLevel}</strong></span>
            <span>Result <strong>{trial.result}</strong></span>
          </div>
          <p className="student-modal-copy">{trial.teacherFeedback}</p>
          <p className="student-modal-copy">{trial.recommendation}</p>
        </StudentModal>
      )}

      <StudentPageHeader
        title="Free Trial"
        subtitle="Trial status, teacher feedback, placement recommendation, and enrollment next step."
        action={(
          <ActionButton variant="secondary" onClick={() => setCompose({ to: 'Academy Team', subject: 'Free trial question' })}>
            <Icon name="support" size={17} />
            Contact Academy Team
          </ActionButton>
        )}
      />

      <SectionCard title="Trial / Enrollment Status" action={<StatusBadge label={trial.status} />}>
        <div className="dashboard-stats-grid">
          <StudentStatCard label="Program" value={trial.program} trend="Trial program" icon="quran" />
          <StudentStatCard label="Assigned Teacher" value={trial.teacher.replace('Ust. ', '').replace('Sh. ', '')} trend={trial.teacher} icon="teacher" />
          <StudentStatCard label="Trial Date" value={trial.date} trend={`${trial.time} ${trial.timezone}`} icon="calendar" />
          <StudentStatCard label="Result" value={trial.result} trend={trial.recommendedLevel} icon="award" />
        </div>
      </SectionCard>

      <div className="dashboard-grid dashboard-grid--two">
        {isScheduled && (
          <SectionCard title="Before Your Trial" subtitle="Prepare for a calm and useful placement session">
            <div className="student-checklist">
              <span><Icon name="check" size={16} /> Join 5 minutes early.</span>
              <span><Icon name="check" size={16} /> Keep Quran or reading material nearby.</span>
              <span><Icon name="check" size={16} /> Parent may stay nearby for setup.</span>
            </div>
            <div className="student-card-actions">
              <DashboardActionMenu
                primaryAction={{
                  label: trial.meetingLink ? 'Join Trial' : 'Request Trial Link',
                  icon: <Icon name="video" size={15} />,
                  onClick: () => trial.meetingLink ? openExternalLink(trial.meetingLink) : setCompose({ to: 'Academy Team', subject: 'Trial meeting link request' }),
                }}
                actions={[
                  { label: 'Contact Academy Team', icon: <Icon name="support" size={15} />, onClick: () => setCompose({ to: 'Academy Team', subject: 'Trial support request' }) },
                ]}
              />
            </div>
          </SectionCard>
        )}

        {isCompleted && (
          <SectionCard title="Teacher Feedback" subtitle="Placement result and recommended next step">
            <div className="student-feedback-note">{trial.teacherFeedback}</div>
            <div className="student-info-grid">
              <span>Recommended level <strong>{trial.recommendedLevel}</strong></span>
              <span>Recommendation <strong>{trial.recommendation}</strong></span>
            </div>
            <div className="student-card-actions">
              <DashboardActionMenu
                primaryAction={{ label: 'Complete Enrollment', icon: <Icon name="checkCircle" size={15} />, onClick: () => setCompose({ to: 'Academy Team', subject: 'Complete enrollment' }) }}
                actions={[
                  { label: 'View Feedback', icon: <Icon name="eye" size={15} />, onClick: () => setFeedbackOpen(true) },
                  { label: 'Contact Academy Team', icon: <Icon name="support" size={15} />, onClick: () => setCompose({ to: 'Academy Team', subject: 'Enrollment question' }) },
                ]}
              />
            </div>
          </SectionCard>
        )}

        {isEnrolled && (
          <SectionCard title="Enrollment Active" subtitle="You are now enrolled">
            <div className="student-info-grid">
              <span>Start date <strong>{trial.enrollmentDate || 'Confirmed by academy'}</strong></span>
              <span>Current program <strong>{trial.program}</strong></span>
              <span>Level <strong>{trial.recommendedLevel}</strong></span>
              <span>Teacher <strong>{trial.teacher}</strong></span>
            </div>
            <ActionButton onClick={() => navigate('/dashboard/student/schedule')}>
              <Icon name="calendar" size={16} />
              Go to Schedule
            </ActionButton>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
