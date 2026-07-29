import Icon from '../../components/Icon';
import ActionButton from './ActionButton';
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
        <ActionButton variant="ghost" onClick={onDetails}>View Trial</ActionButton>
        {trial.meeting_link && ['scheduled', 'live'].includes(normalizedStatus) && (
          <a className="dashboard-action dashboard-action--secondary" href={trial.meeting_link} target="_blank" rel="noreferrer">Join Trial</a>
        )}
        {feedbackSubmitted ? (
          <ActionButton variant="secondary" onClick={onFeedback}>View Feedback</ActionButton>
        ) : (
          <ActionButton variant="copper" onClick={onFeedback}>{normalizedStatus === 'no_show' ? 'Add Note' : 'Add Trial Feedback'}</ActionButton>
        )}
        {normalizedStatus !== 'no_show' && !feedbackSubmitted && <ActionButton variant="danger" onClick={onNoShow}>Notify Admin: No Show</ActionButton>}
      </div>
    </article>
  );
}
