import { useEffect, useState, type FormEvent } from 'react';
import Icon from '../../components/Icon';
import ActionButton from './ActionButton';
import LeadStatusBadge from './LeadStatusBadge';
import LeadTypeBadge from './LeadTypeBadge';
import LeadTimeline from './LeadTimeline';
import NotesBox from './NotesBox';
import ProgramSelect from './ProgramSelect';
import StatusBadge from './StatusBadge';
import { DashboardText, useDashboardLanguage } from '../i18n/DashboardLanguageProvider';
import type { LeadActivity, LeadRecord, LeadStatus, LeadType, TeacherOption, UpdateLeadPayload } from '../services/leadsService';
import { getMarketingAttributionDisplayItems, hasMarketingAttribution } from '../services/leadAttribution';

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

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, {
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
  const { language, t } = useDashboardLanguage();
  const [editLeadType, setEditLeadType] = useState<LeadType>(lead.lead_type || 'student');
  const isTeacherTraining = (mode === 'edit' ? editLeadType : lead.lead_type) === 'teacher_training';
  const marketingAttributionItems = getMarketingAttributionDisplayItems(lead);

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
    <div className="lead-drawer" role="dialog" aria-modal="true" aria-label={`${t(mode === 'edit' ? 'Edit' : 'Lead details for')} ${lead.full_name}`}>
      <button className="lead-drawer__backdrop" type="button" aria-label={t('Close lead details')} onClick={onClose} />
      <aside className="lead-drawer__panel">
        <div className="lead-drawer__header">
          <div>
            <span className="dashboard-eyebrow">{t(mode === 'edit' ? 'EDIT LEAD' : 'LEAD DETAIL')}</span>
            <h2>{lead.full_name}</h2>
            <p>{lead.programName || t('Program not assigned')} - {lead.country || t('Country not set')}</p>
          </div>
          <div className="lead-drawer__header-actions">
            {mode === 'view' && onEdit && <ActionButton variant="secondary" onClick={onEdit}><DashboardText>Edit Lead</DashboardText></ActionButton>}
            <button className="dashboard-icon-button" type="button" aria-label={t('Close lead details')} onClick={onClose}>
              <Icon name="x" />
            </button>
          </div>
        </div>

        {mode === 'edit' ? (
          <form className="dashboard-form lead-edit-form" onSubmit={handleSubmit}>
            <label><span>{t('Full Name')}</span><input name="full_name" defaultValue={lead.full_name} required /></label>
            <label><span><DashboardText>WhatsApp</DashboardText></span><input name="whatsapp" defaultValue={lead.whatsapp || ''} /></label>
            <label><span>{t('Country')}</span><input name="country" defaultValue={lead.country || ''} /></label>
            <label>
              <span>{t('Program')}</span>
              <ProgramSelect name="program_id" value={lead.program_id || ''} placeholder={t('Select program')} />
            </label>
            <label><span>{t('Program name')}</span><input name="program_name" defaultValue={lead.program_name || lead.programName || ''} /></label>
            <label>
              <span>{t('Lead Type')}</span>
              <select name="lead_type" value={editLeadType} onChange={(event) => setEditLeadType(event.target.value as LeadType)}>
                <option value="student">{t('Student Lead')}</option>
                <option value="teacher_training">{t('Teacher Training')}</option>
              </select>
            </label>
            <label><span>{t('Source')}</span><input name="source" defaultValue={lead.source || 'website'} /></label>
            <label>
              <span>{t('Status')}</span>
              <select name="status" defaultValue={lead.status}>
                {statusOptions.map((status) => <option key={status.value} value={status.value}>{t(status.label)}</option>)}
              </select>
            </label>
            <label>
              <span>{t('Owner')}</span>
              <select name="assigned_to" defaultValue={lead.assigned_to || ''}>
                <option value="">{t('Unassigned')}</option>
                {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}{owner.role ? ` - ${owner.role}` : ''}</option>)}
              </select>
            </label>
            <label>
              <span>{t('Teacher')}</span>
              <select name="assigned_teacher_id" defaultValue={lead.assigned_teacher_id || ''} disabled={isTeacherTraining}>
                <option value="">{t(isTeacherTraining ? 'Not applicable' : 'Unassigned')}</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
              </select>
            </label>
            <label><span>{t('Next Follow-up')}</span><input name="next_follow_up_at" type="datetime-local" defaultValue={toDateTimeInput(lead.next_follow_up_at)} /></label>
            <label className="dashboard-form__wide"><span>{t('Notes')}</span><textarea name="notes" rows={5} defaultValue={lead.notes || ''} /></label>
            <div className="lead-drawer__footer lead-drawer__footer--sticky">
              <ActionButton variant="secondary" type="button" onClick={onClose}><DashboardText>Cancel</DashboardText></ActionButton>
              <ActionButton variant="copper" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</ActionButton>
            </div>
          </form>
        ) : (
          <>
            <div className="lead-drawer__section">
              <div className="lead-summary-grid">
                <span><DashboardText>WhatsApp</DashboardText> <strong>{lead.whatsapp || '-'}</strong></span>
                <span>{t('Age')} <strong>{lead.student_age || '-'}</strong></span>
                <span>{t('Preferred Time')} <strong>{lead.preferred_time || '-'}</strong></span>
                <span>{t('Source')} <strong>{t(lead.source || 'website')}</strong></span>
                <span>{t('Lead Type')} <LeadTypeBadge type={lead.lead_type} /></span>
                <span>{t('Created')} <strong>{formatDate(lead.created_at, language)}</strong></span>
                <span>{t('Status')} <LeadStatusBadge status={lead.status} /></span>
              </div>
            </div>

            <div className="lead-drawer__section">
              <div className="lead-drawer__section-header">
                <h3>{t('Contact / Follow-up')}</h3>
                <ActionButton variant="ghost" onClick={onAddFollowUp}><DashboardText>Add Follow-up</DashboardText></ActionButton>
              </div>
              <div className="lead-summary-grid">
                <span>{t('Last contact')} <strong>{formatDate(lead.last_contact_at, language)}</strong></span>
                <span>{t('Next follow-up')} <strong>{formatDate(lead.next_follow_up_at, language)}</strong></span>
              </div>
            </div>

            <div className="lead-drawer__section">
              <div className="lead-drawer__section-header">
                <h3>{t('Assignment')}</h3>
                <div>
                  <ActionButton variant="ghost" onClick={onAssignOwner}>{t(isTeacherTraining ? 'Reviewer' : 'Owner')}</ActionButton>
                  {!isTeacherTraining && <ActionButton variant="ghost" onClick={onAssignTeacher}>{t('Teacher')}</ActionButton>}
                </div>
              </div>
              <div className="lead-summary-grid">
                <span>{t(isTeacherTraining ? 'Reviewer' : 'Admissions owner')} <strong>{lead.assignedOwnerName || t('Unassigned')}</strong></span>
                {!isTeacherTraining && <span>{t('Assigned teacher')} <strong>{lead.assignedTeacherName || t('Unassigned')}</strong></span>}
              </div>
            </div>

            {isTeacherTraining ? (
              <div className="lead-drawer__section">
                <div className="lead-drawer__section-header">
                  <h3>{t('Application Review')}</h3>
                  <ActionButton variant="copper" onClick={onAddFollowUp}><DashboardText>Contact Applicant</DashboardText></ActionButton>
                </div>
                <div className="lead-trial-placeholder">
                  <StatusBadge label="teacher training" />
                  <p>{t('Review the application details, assign a reviewer, and contact the applicant for the next step.')}</p>
                </div>
              </div>
            ) : (
              <div className="lead-drawer__section">
                <div className="lead-drawer__section-header">
                  <h3>{t('Trial Section')}</h3>
                  <ActionButton variant="copper" onClick={onScheduleTrial}><DashboardText>Schedule Free Trial</DashboardText></ActionButton>
                </div>
                <div className="lead-trial-placeholder">
                  <StatusBadge label={lead.status === 'trial_scheduled' ? 'scheduled' : 'not scheduled'} />
                  <p>{t('Trial details appear here once a free trial is scheduled.')}</p>
                </div>
              </div>
            )}

            {hasMarketingAttribution(lead) && (
              <div className="lead-drawer__section">
                <div className="lead-drawer__section-header">
                  <h3>{t('Marketing Attribution')}</h3>
                </div>
                <div className="lead-summary-grid lead-summary-grid--attribution">
                  {marketingAttributionItems.map((item) => (
                    <span key={`${item.label}-${item.value}`}>{t(item.label)} <strong>{item.value}</strong></span>
                  ))}
                </div>
              </div>
            )}

            <div className="lead-drawer__section">
              <h3>{t('Notes')}</h3>
              <NotesBox notes={lead.notes} onAddNote={onAddNote} />
            </div>

            <div className="lead-drawer__section">
              <div className="lead-drawer__section-header">
                <h3>{t('Activity Timeline')}</h3>
              </div>
              <LeadTimeline activities={activities} />
            </div>

            <div className="lead-drawer__footer">
              <ActionButton variant="danger" onClick={onMarkLost}><DashboardText>Mark Lost</DashboardText></ActionButton>
              {!isTeacherTraining && <ActionButton variant="copper" onClick={onConvert}><DashboardText>Convert to Student</DashboardText></ActionButton>}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
