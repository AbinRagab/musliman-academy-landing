import { FormEvent, useMemo, useState } from 'react';
import ActionButton from './ActionButton';
import ProgramSelect from './ProgramSelect';
import SectionCard from './SectionCard';
import StatusBadge from './StatusBadge';
import type { ConvertLeadPayload, LeadRecord, TeacherOption } from '../services/leadsService';
import { DashboardText, useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export default function ConvertLeadModal({
  lead,
  teachers,
  onClose,
  onSave,
}: {
  lead: LeadRecord;
  teachers: TeacherOption[];
  onClose: () => void;
  onSave: (payload: ConvertLeadPayload) => Promise<void>;
}) {
  const { t } = useDashboardLanguage();
  const [form, setForm] = useState({
    student_name: lead.full_name,
    parent_name: '',
    parent_email: '',
    whatsapp: lead.whatsapp || '',
    country: lead.country || '',
    age: lead.student_age || '',
    approved_program_id: lead.program_id || '',
    approved_program: lead.programName || '',
    approved_level: '',
    assigned_teacher_id: lead.assigned_teacher_id || '',
    class_days: '',
    class_time: '',
    timezone: 'Africa/Cairo',
    start_date: '',
    meeting_link: '',
    schedule_notes: '',
    package_name: '',
    payment_status: 'pending',
    next_due_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const requiredComplete = useMemo(() => (
    Boolean(
      form.student_name.trim()
      && form.parent_name.trim()
      && form.parent_email.trim()
      && form.approved_program_id
      && form.approved_level.trim()
      && form.assigned_teacher_id
      && form.class_days.trim()
      && form.class_time.trim()
      && form.timezone.trim()
      && form.start_date
      && form.meeting_link.trim(),
    )
  ), [form]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmed || !requiredComplete) {
      return;
    }

    setSaving(true);
    const setupNotes = [
      form.schedule_notes,
      `Approved program: ${form.approved_program || lead.programName || 'Not set'}`,
      `Class days: ${form.class_days}`,
      `Class time: ${form.class_time}`,
      `Timezone: ${form.timezone}`,
      `Meeting link: ${form.meeting_link}`,
      form.package_name ? `Package: ${form.package_name}` : '',
      form.payment_status ? `Payment status: ${form.payment_status}` : '',
      form.next_due_date ? `Next due date: ${form.next_due_date}` : '',
      'Student dashboard account must be created manually from Accounts & Roles.',
    ].filter(Boolean).join('\n');

    await onSave({
      student_name: form.student_name,
      parent_name: form.parent_name,
      whatsapp: form.whatsapp,
      country: form.country,
      age: form.age,
      program_id: form.approved_program_id || lead.program_id,
      level: form.approved_level,
      assigned_teacher_id: form.assigned_teacher_id,
      schedule_notes: setupNotes,
      start_date: form.start_date,
    });
    setSaving(false);
  }

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={t('Convert {{name}} to student', { name: lead.full_name })}>
      <div className="dashboard-modal__panel dashboard-modal__panel--wide">
        <div className="dashboard-card__header">
          <div>
            <h2>{t('Convert to Student')}</h2>
            <p>{t('Conversion creates the student record only. Student account creation remains a separate admin action.')}</p>
          </div>
          <StatusBadge label={requiredComplete ? 'Ready' : 'Needs Setup'} tone={requiredComplete ? 'success' : 'warning'} />
        </div>

        <form className="dashboard-form convert-student-form" onSubmit={handleSubmit}>
          <SectionCard title="Data from Lead/Form" subtitle="Website submissions create leads only. Admin reviews this data before conversion.">
            <div className="convert-readonly-grid">
              <span>{t('Name')} <strong>{lead.full_name}</strong></span>
              <span><DashboardText>WhatsApp</DashboardText> <strong>{lead.whatsapp || '-'}</strong></span>
              <span>{t('Country')} <strong>{lead.country || '-'}</strong></span>
              <span>{t('Age')} <strong>{lead.student_age || '-'}</strong></span>
              <span>{t('Program interested')} <strong>{lead.programName || '-'}</strong></span>
              <span>{t('Preferred time')} <strong>{lead.preferred_time || '-'}</strong></span>
              <span>{t('Message')} <strong>{lead.message || '-'}</strong></span>
            </div>
          </SectionCard>

          <SectionCard title="Admin Required Setup" subtitle="Admin approves the final academic setup, schedule, teacher assignment, and start details.">
            <div className="convert-form-grid">
              <label><span>{t('Student Name')}</span><input value={form.student_name} onChange={(event) => setForm((current) => ({ ...current, student_name: event.target.value }))} required /></label>
              <label><span>{t('Parent Name')}</span><input value={form.parent_name} onChange={(event) => setForm((current) => ({ ...current, parent_name: event.target.value }))} required /></label>
              <label><span>{t('Parent Email')}</span><input type="email" value={form.parent_email} onChange={(event) => setForm((current) => ({ ...current, parent_email: event.target.value }))} required /></label>
              <label><span><DashboardText>WhatsApp</DashboardText></span><input value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} /></label>
              <label><span>{t('Country')}</span><input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} /></label>
              <label><span>{t('Age')}</span><input value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} /></label>
              <ProgramSelect label={t('Approved Program')} value={form.approved_program_id} onChange={(value) => setForm((current) => ({ ...current, approved_program_id: value }))} required />
              <label><span>{t('Legacy program text')}</span><input value={form.approved_program} onChange={(event) => setForm((current) => ({ ...current, approved_program: event.target.value }))} /></label>
              <label><span>{t('Approved Level')}</span><input value={form.approved_level} onChange={(event) => setForm((current) => ({ ...current, approved_level: event.target.value }))} required /></label>
              <label><span>{t('Assigned Teacher')}</span><select value={form.assigned_teacher_id} onChange={(event) => setForm((current) => ({ ...current, assigned_teacher_id: event.target.value }))} required><option value="">{t('Select teacher')}</option>{teachers.filter((teacher) => teacher.profileId).map((teacher) => <option key={teacher.id} value={teacher.profileId || ''}>{teacher.full_name}</option>)}</select></label>
              <label><span>{t('Class Days')}</span><input value={form.class_days} onChange={(event) => setForm((current) => ({ ...current, class_days: event.target.value }))} placeholder={t('Mon, Wed')} required /></label>
              <label><span>{t('Class Time')}</span><input value={form.class_time} onChange={(event) => setForm((current) => ({ ...current, class_time: event.target.value }))} required /></label>
              <label><span>{t('Timezone')}</span><input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required /></label>
              <label><span>{t('Start Date')}</span><input type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} required /></label>
              <label><span>{t('Meeting Link')}</span><input value={form.meeting_link} onChange={(event) => setForm((current) => ({ ...current, meeting_link: event.target.value }))} required /></label>
              <label className="convert-form-grid__wide"><span>{t('Schedule Notes')}</span><textarea rows={3} value={form.schedule_notes} onChange={(event) => setForm((current) => ({ ...current, schedule_notes: event.target.value }))} /></label>
            </div>
          </SectionCard>

          <SectionCard title="Teacher Trial Feedback" subtitle="Latest trial feedback is shown for admin review before final approval.">
            <div className="convert-readonly-grid">
              <span>{t('Teacher feedback')} <strong>{t('Good reading confidence; needs steady Tajweed revision.')}</strong></span>
              <span>{t('Recommended level')} <strong>{form.approved_level || t('Pending approval')}</strong></span>
              <span>{t('Recommendation')} <strong>{t('Recommended to enroll')}</strong></span>
            </div>
          </SectionCard>

          <SectionCard title="Finance Setup Optional" subtitle="Finance can complete or adjust payment details later from Payments.">
            <div className="convert-form-grid">
              <label><span>{t('Package')}</span><input value={form.package_name} onChange={(event) => setForm((current) => ({ ...current, package_name: event.target.value }))} /></label>
              <label><span>{t('Payment Status')}</span><select value={form.payment_status} onChange={(event) => setForm((current) => ({ ...current, payment_status: event.target.value }))}><option value="pending">{t('Pending')}</option><option value="paid">{t('Paid')}</option><option value="overdue">{t('Overdue')}</option></select></label>
              <label><span>{t('Next Due Date')}</span><input type="date" value={form.next_due_date} onChange={(event) => setForm((current) => ({ ...current, next_due_date: event.target.value }))} /></label>
            </div>
          </SectionCard>

          <label className="dashboard-check-filter">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            {t('Confirm conversion into a student record. Do not create a student account automatically.')}
          </label>

          {!requiredComplete && <div className="dashboard-inline-error">{t('Complete all required Admin Setup fields before converting this lead.')}</div>}

          <div className="dashboard-form-actions">
            <ActionButton type="submit" variant="copper" disabled={saving || !confirmed || !requiredComplete}>{t(saving ? 'Converting' : 'Convert to Student')}</ActionButton>
            <ActionButton type="button" variant="secondary" onClick={onClose}><DashboardText>Cancel</DashboardText></ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
