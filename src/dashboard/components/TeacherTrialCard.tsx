import Icon from '../../components/Icon';
import ActionButton from './ActionButton';
import StatusBadge from './StatusBadge';

export default function TeacherTrialCard({
  trial,
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
  };
  onFeedback: () => void;
  onNoShow: () => void;
}) {
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
        {trial.meeting_link && <a className="dashboard-action dashboard-action--secondary" href={trial.meeting_link} target="_blank" rel="noreferrer">Join Trial</a>}
        <ActionButton variant="ghost">Contact Parent</ActionButton>
        <ActionButton variant="copper" onClick={onFeedback}>Submit Feedback</ActionButton>
        <ActionButton variant="danger" onClick={onNoShow}>No Show</ActionButton>
      </div>
    </article>
  );
}
