import { useEffect, useState, type FormEvent } from 'react';
import Icon from '../../components/Icon';
import ActionButton from './ActionButton';
import LeadStatusBadge from './LeadStatusBadge';
import LeadTypeBadge from './LeadTypeBadge';
import LeadTimeline from './LeadTimeline';
import NotesBox from './NotesBox';
import ProgramSelect from './ProgramSelect';
import StatusBadge from './StatusBadge';
import type { LeadActivity, LeadRecord, LeadStatus, LeadType, TeacherOption, UpdateLeadPayload } from '../services/leadsService';

type ProgramOption = { id: string; name: string };
type OwnerOption = { id: string; full_name: string; role?: string };

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'no_response', label: 'No Response' },
  { value: 'follow_up_later', label: 'Follow-up Later' },
  { value: 'trial_scheduled', label: 'Trial Scheduled' },
  { value: 'trial_completed', label: 'Trial Completed' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'lost', label: 'Lost' },
];

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

function toDateTimeInput(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 16);
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value || '').trim();
  return text || null;
}

export default function LeadDetailDrawer({
  lead,
  activities,
  mode = 'view',
  programs = [],
  owners = [],
  teachers = [],
  saving = false,
  onClose,
  onEdit,
  onSave,
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
  mode?: 'view' | 'edit';
  programs?: ProgramOption[];
  owners?: OwnerOption[];
  teachers?: TeacherOption[];
  saving?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onSave?: (payload: UpdateLeadPayload) => Promise<void> | void;
  onAddFollowUp: () => void;
  onAssignOwner: () => void;
  onAssignTeacher: () => void;
  onScheduleTrial: () => void;
  onAddNote: (note: string) => Promise<void>;
  onMarkLost: () => void;
  onConvert: () => void;
}) {
  const [editLeadType, setEditLeadType] = useState<LeadType>(lead.lead_type || 'student');
  const isTeacherTraining = (mode === 'edit' ? editLeadType : lead.lead_type) === 'teacher_training';

  useEffect(() => {
    setEditLeadType(lead.lead_type || 'student');
  }, [lead.id, lead.lead_type]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onSave) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const nextFollowUp = emptyToNull(formData.get('next_follow_up_at'));

    await onSave({
      full_name: String(formData.get('full_name') || '').trim(),
      whatsapp: emptyToNull(formData.get('whatsapp')),
      country: emptyToNull(formData.get('country')),
      program_id: emptyToNull(formData.get('program_id')),
      program_name: emptyToNull(formData.get('program_name')),
      lead_type: String(formData.get('lead_type') || 'student') as LeadType,
      source: emptyToNull(formData.get('source')),
      status: String(formData.get('status') || 'new') as LeadStatus,
      assigned_to: emptyToNull(formData.get('assigned_to')),
      assigned_teacher_id: String(formData.get('lead_type') || 'student') === 'teacher_training'
        ? null
        : emptyToNull(formData.get('assigned_teacher_id')),
      next_follow_up_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
      notes: emptyToNull(formData.get('notes')),
    });
  }

  return (
    <div className="lead-drawer" role="dialog" aria-modal="true" aria-label={`${mode === 'edit' ? 'Edit' : 'Lead details for'} ${lead.full_name}`}>
      <button className="lead-drawer__backdrop" type="button" aria-label="Close lead details" onClick={onClose} />
      <aside className="lead-drawer__panel">
        <div className="lead-drawer__header">
          <div>
            <span className="dashboard-eyebrow">{mode === 'edit' ? 'EDIT LEAD' : 'LEAD DETAIL'}</span>
            <h2>{lead.full_name}</h2>
            <p>{lead.programName || 'Program not assigned'} - {lead.country || 'Country not set'}</p>
          </div>
          <div className="lead-drawer__header-actions">
            {mode === 'view' && onEdit && <ActionButton variant="secondary" onClick={onEdit}>Edit Lead</ActionButton>}
            <button className="dashboard-icon-button" type="button" aria-label="Close lead details" onClick={onClose}>
              <Icon name="x" />
            </button>
          </div>
        </div>

        {mode === 'edit' ? (
          <form className="dashboard-form lead-edit-form" onSubmit={handleSubmit}>
            <label><span>Full Name</span><input name="full_name" defaultValue={lead.full_name} required /></label>
            <label><span>WhatsApp</span><input name="whatsapp" defaultValue={lead.whatsapp || ''} /></label>
            <label><span>Country</span><input name="country" defaultValue={lead.country || ''} /></label>
            <label>
              <span>Program</span>
              <ProgramSelect name="program_id" value={lead.program_id || ''} placeholder="Select program" />
            </label>
            <label><span>Program name</span><input name="program_name" defaultValue={lead.program_name || lead.programName || ''} /></label>
            <label>
              <span>Lead Type</span>
              <select name="lead_type" value={editLeadType} onChange={(event) => setEditLeadType(event.target.value as LeadType)}>
                <option value="student">Student Lead</option>
                <option value="teacher_training">Teacher Training</option>
              </select>
            </label>
            <label><span>Source</span><input name="source" defaultValue={lead.source || 'website'} /></label>
            <label>
              <span>Status</span>
              <select name="status" defaultValue={lead.status}>
                {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
            <label>
              <span>Owner</span>
              <select name="assigned_to" defaultValue={lead.assigned_to || ''}>
                <option value="">Unassigned</option>
                {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}{owner.role ? ` - ${owner.role}` : ''}</option>)}
              </select>
            </label>
            <label>
              <span>Teacher</span>
              <select name="assigned_teacher_id" defaultValue={lead.assigned_teacher_id || ''} disabled={isTeacherTraining}>
                <option value="">{isTeacherTraining ? 'Not applicable' : 'Unassigned'}</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
              </select>
            </label>
            <label><span>Next Follow-up</span><input name="next_follow_up_at" type="datetime-local" defaultValue={toDateTimeInput(lead.next_follow_up_at)} /></label>
            <label className="dashboard-form__wide"><span>Notes</span><textarea name="notes" rows={5} defaultValue={lead.notes || ''} /></label>
            <div className="lead-drawer__footer lead-drawer__footer--sticky">
              <ActionButton variant="secondary" type="button" onClick={onClose}>Cancel</ActionButton>
              <ActionButton variant="copper" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</ActionButton>
            </div>
          </form>
        ) : (
          <>
            <div className="lead-drawer__section">
              <div className="lead-summary-grid">
                <span>WhatsApp <strong>{lead.whatsapp || '-'}</strong></span>
                <span>Age <strong>{lead.student_age || '-'}</strong></span>
                <span>Preferred Time <strong>{lead.preferred_time || '-'}</strong></span>
                <span>Source <strong>{lead.source || 'website'}</strong></span>
                <span>Lead Type <LeadTypeBadge type={lead.lead_type} /></span>
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
                  <ActionButton variant="ghost" onClick={onAssignOwner}>{isTeacherTraining ? 'Reviewer' : 'Owner'}</ActionButton>
                  {!isTeacherTraining && <ActionButton variant="ghost" onClick={onAssignTeacher}>Teacher</ActionButton>}
                </div>
              </div>
              <div className="lead-summary-grid">
                <span>{isTeacherTraining ? 'Reviewer' : 'Admissions owner'} <strong>{lead.assignedOwnerName || 'Unassigned'}</strong></span>
                {!isTeacherTraining && <span>Assigned teacher <strong>{lead.assignedTeacherName || 'Unassigned'}</strong></span>}
              </div>
            </div>

            {isTeacherTraining ? (
              <div className="lead-drawer__section">
                <div className="lead-drawer__section-header">
                  <h3>Application Review</h3>
                  <ActionButton variant="copper" onClick={onAddFollowUp}>Contact Applicant</ActionButton>
                </div>
                <div className="lead-trial-placeholder">
                  <StatusBadge label="teacher training" />
                  <p>Review the application details, assign a reviewer, and contact the applicant for the next step.</p>
                </div>
              </div>
            ) : (
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
            )}

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
              {!isTeacherTraining && <ActionButton variant="copper" onClick={onConvert}>Convert to Student</ActionButton>}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
