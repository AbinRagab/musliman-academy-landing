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
  const assignmentLabel = isTeacherTraining ? (lead.assignedOwnerName || 'No reviewer') : (lead.assignedTeacherName || 'Unassigned');

  return (
    <article
      className="lead-card lead-card--compact"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(lead)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(lead);
        }
      }}
    >
      <div className="lead-card__top">
        <div>
          <h3>{lead.full_name}</h3>
          <p>{lead.programName || 'Program not assigned'} - {lead.country || 'Country not set'}</p>
        </div>
        <div className="lead-card__badges">
          <LeadTypeBadge type={lead.lead_type} />
          <LeadStatusBadge status={lead.status} />
        </div>
      </div>
      <div className="lead-card__meta">
        <span>{lead.whatsapp || '-'}</span>
        <span>{assignmentLabel}</span>
        <span>{formatFollowUp(lead.next_follow_up_at)}</span>
      </div>
      <div className="lead-card__actions">
        <ActionButton
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(lead);
          }}
        >
          Details
        </ActionButton>
      </div>
    </article>
  );
}
