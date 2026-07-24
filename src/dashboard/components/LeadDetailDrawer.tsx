import Icon from '../../components/Icon';
import ActionButton from './ActionButton';
import LeadStatusBadge from './LeadStatusBadge';
import LeadTimeline from './LeadTimeline';
import NotesBox from './NotesBox';
import StatusBadge from './StatusBadge';
import type { LeadActivity, LeadRecord } from '../services/leadsService';

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function LeadDetailDrawer({
  lead,
  activities,
  onClose,
  onAddFollowUp,
  onAssignOwner,
  onAssignTeacher,
  onScheduleTrial,
  onAddNote,
  onMarkLost,
  onConvert,
}: {
  lead: LeadRecord;
  activities: LeadActivity[];
  onClose: () => void;
  onAddFollowUp: () => void;
  onAssignOwner: () => void;
  onAssignTeacher: () => void;
  onScheduleTrial: () => void;
  onAddNote: (note: string) => Promise<void>;
  onMarkLost: () => void;
  onConvert: () => void;
}) {
  return (
    <div className="lead-drawer" role="dialog" aria-modal="true" aria-label={`Lead details for ${lead.full_name}`}>
      <button className="lead-drawer__backdrop" type="button" aria-label="Close lead details" onClick={onClose} />
      <aside className="lead-drawer__panel">
        <div className="lead-drawer__header">
          <div>
            <span className="dashboard-eyebrow">LEAD DETAIL</span>
            <h2>{lead.full_name}</h2>
            <p>{lead.programName || 'Program not assigned'} - {lead.country || 'Country not set'}</p>
          </div>
          <button className="dashboard-icon-button" type="button" aria-label="Close lead details" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="lead-drawer__section">
          <div className="lead-summary-grid">
            <span>WhatsApp <strong>{lead.whatsapp || '-'}</strong></span>
            <span>Age <strong>{lead.student_age || '-'}</strong></span>
            <span>Preferred Time <strong>{lead.preferred_time || '-'}</strong></span>
            <span>Source <strong>{lead.source || 'website'}</strong></span>
            <span>Created <strong>{formatDate(lead.created_at)}</strong></span>
            <span>Status <LeadStatusBadge status={lead.status} /></span>
          </div>
        </div>

        <div className="lead-drawer__section">
          <div className="lead-drawer__section-header">
            <h3>Contact / Follow-up</h3>
            <ActionButton variant="ghost" onClick={onAddFollowUp}>Add Follow-up</ActionButton>
          </div>
          <div className="lead-summary-grid">
            <span>Last contact <strong>{formatDate(lead.last_contact_at)}</strong></span>
            <span>Next follow-up <strong>{formatDate(lead.next_follow_up_at)}</strong></span>
          </div>
        </div>

        <div className="lead-drawer__section">
          <div className="lead-drawer__section-header">
            <h3>Assignment</h3>
            <div>
              <ActionButton variant="ghost" onClick={onAssignOwner}>Owner</ActionButton>
              <ActionButton variant="ghost" onClick={onAssignTeacher}>Teacher</ActionButton>
            </div>
          </div>
          <div className="lead-summary-grid">
            <span>Admissions owner <strong>{lead.assignedOwnerName || 'Unassigned'}</strong></span>
            <span>Assigned teacher <strong>{lead.assignedTeacherName || 'Unassigned'}</strong></span>
          </div>
        </div>

        <div className="lead-drawer__section">
          <div className="lead-drawer__section-header">
            <h3>Trial Section</h3>
            <ActionButton variant="copper" onClick={onScheduleTrial}>Schedule Free Trial</ActionButton>
          </div>
          <div className="lead-trial-placeholder">
            <StatusBadge label={lead.status === 'trial_scheduled' ? 'scheduled' : 'not scheduled'} />
            <p>Trial details appear here once a free trial is scheduled.</p>
          </div>
        </div>

        <div className="lead-drawer__section">
          <h3>Notes</h3>
          <NotesBox notes={lead.notes} onAddNote={onAddNote} />
        </div>

        <div className="lead-drawer__section">
          <div className="lead-drawer__section-header">
            <h3>Activity Timeline</h3>
          </div>
          <LeadTimeline activities={activities} />
        </div>

        <div className="lead-drawer__footer">
          <ActionButton variant="danger" onClick={onMarkLost}>Mark Lost</ActionButton>
          <ActionButton variant="copper" onClick={onConvert}>Convert to Student</ActionButton>
        </div>
      </aside>
    </div>
  );
}
