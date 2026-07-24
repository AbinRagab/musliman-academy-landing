import Icon from '../../components/Icon';
import type { LeadRecord } from '../services/leadsService';
import ActionButton from './ActionButton';
import LeadStatusBadge from './LeadStatusBadge';
import LeadTypeBadge from './LeadTypeBadge';

function formatFollowUp(value: string | null) {
  if (!value) {
    return 'No follow-up set';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function LeadCard({
  lead,
  onOpen,
  onQuickStatus,
}: {
  lead: LeadRecord;
  onOpen: (lead: LeadRecord) => void;
  onQuickStatus: (lead: LeadRecord) => void;
}) {
  const isTeacherTraining = lead.lead_type === 'teacher_training';

  return (
    <article className="lead-card">
      <div className="lead-card__top">
        <div>
          <h3>{lead.full_name}</h3>
          <p>{lead.country || 'Country not set'} - {lead.programName || 'Program not assigned'}</p>
        </div>
        <div className="lead-card__badges">
          <LeadTypeBadge type={lead.lead_type} />
          <LeadStatusBadge status={lead.status} />
        </div>
      </div>
      <div className="lead-card__meta">
        <span><Icon name="phone" size={14} /> {lead.whatsapp || '-'}</span>
        <span><Icon name="globe" size={14} /> {lead.source || 'website'}</span>
        <span><Icon name="clock" size={14} /> {formatFollowUp(lead.next_follow_up_at)}</span>
        <span><Icon name="user" size={14} /> {lead.assignedOwnerName || 'Unassigned'}</span>
        {!isTeacherTraining && <span><Icon name="teacher" size={14} /> {lead.assignedTeacherName || 'No teacher'}</span>}
      </div>
      <div className="lead-card__actions">
        <ActionButton variant="ghost" onClick={() => onOpen(lead)}>Details</ActionButton>
        <ActionButton variant="secondary" onClick={() => onQuickStatus(lead)}>{isTeacherTraining ? 'Review' : 'Update'}</ActionButton>
      </div>
    </article>
  );
}
