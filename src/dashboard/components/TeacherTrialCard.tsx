import Icon from '../../components/Icon';
import DashboardActionMenu from './DashboardActionMenu';
import StatusBadge from './StatusBadge';

export default function TeacherTrialCard({
  trial,
  onDetails,
  onFeedback,
  onNoShow,
}: {
  trial: {
    id: string;
    lead?: { full_name: string; whatsapp?: string | null; programName?: string };
    trial_date?: string | null;
    trial_time?: string | null;
    meeting_link?: string | null;
    status?: string;
    teacher_feedback?: string | null;
  };
  onDetails?: () => void;
  onFeedback: () => void;
  onNoShow: () => void;
}) {
  const normalizedStatus = (trial.status || 'scheduled').toLowerCase();
  const feedbackSubmitted = Boolean(trial.teacher_feedback) || normalizedStatus === 'completed';
  const canJoin = Boolean(trial.meeting_link) && ['scheduled', 'live'].includes(normalizedStatus);
  const primaryLabel = normalizedStatus === 'scheduled'
    ? 'View Trial'
    : feedbackSubmitted
      ? 'View Feedback'
      : normalizedStatus === 'no_show'
        ? 'Add Note'
        : 'Add Trial Feedback';
  const primaryAction = normalizedStatus === 'scheduled' ? () => onDetails?.() : onFeedback;

  return (
    <article className="teacher-trial-card">
      <div>
        <h3>{trial.lead?.full_name || 'Trial student'}</h3>
        <p>{trial.lead?.programName || 'Program not assigned'}</p>
      </div>
      <div className="teacher-trial-card__meta">
        <span><Icon name="calendar" size={15} /> {trial.trial_date || 'Date pending'} {trial.trial_time || ''}</span>
        <span><Icon name="phone" size={15} /> {trial.lead?.whatsapp || '-'}</span>
      </div>
      <StatusBadge label={trial.status || 'scheduled'} />
      <div className="teacher-trial-card__actions">
        <DashboardActionMenu
          primaryAction={{ label: primaryLabel, onClick: primaryAction }}
          actions={[
            {
              label: 'Join Trial',
              hidden: !canJoin,
              onClick: () => window.open(trial.meeting_link || '', '_blank', 'noopener,noreferrer'),
            },
            { label: 'View Trial', onClick: () => onDetails?.(), hidden: normalizedStatus === 'scheduled' || !onDetails },
            { label: feedbackSubmitted ? 'View Feedback' : 'Add Trial Feedback', onClick: onFeedback, hidden: primaryLabel === 'View Feedback' || primaryLabel === 'Add Trial Feedback' },
            { label: 'Notify Admin No Show', onClick: onNoShow, danger: true, hidden: normalizedStatus === 'no_show' || feedbackSubmitted },
          ]}
        />
      </div>
    </article>
  );
}
