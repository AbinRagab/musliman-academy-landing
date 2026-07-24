import { FormEvent, useState } from 'react';
import ActionButton from './ActionButton';
import type { ConvertLeadPayload, LeadRecord, TeacherOption } from '../services/leadsService';

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
  const [form, setForm] = useState({
    student_name: lead.full_name,
    parent_name: '',
    whatsapp: lead.whatsapp || '',
    country: lead.country || '',
    age: lead.student_age || '',
    level: '',
    assigned_teacher_id: lead.assigned_teacher_id || '',
    schedule_notes: '',
    start_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmed) {
      return;
    }

    setSaving(true);
    await onSave({ ...form, program_id: lead.program_id });
    setSaving(false);
  }

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Convert ${lead.full_name} to student`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div>
            <h2>Convert to Student</h2>
            <p>Student account creation remains optional after conversion.</p>
          </div>
        </div>
        <form className="dashboard-form" onSubmit={handleSubmit}>
          <label><span>Student Name</span><input value={form.student_name} onChange={(event) => setForm((current) => ({ ...current, student_name: event.target.value }))} required /></label>
          <label><span>Parent Name</span><input value={form.parent_name} onChange={(event) => setForm((current) => ({ ...current, parent_name: event.target.value }))} /></label>
          <label><span>WhatsApp</span><input value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} /></label>
          <label><span>Country</span><input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} /></label>
          <label><span>Age</span><input value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} /></label>
          <label><span>Level</span><input value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} placeholder="Placement level" /></label>
          <label><span>Assigned Teacher</span><select value={form.assigned_teacher_id} onChange={(event) => setForm((current) => ({ ...current, assigned_teacher_id: event.target.value }))}><option value="">Select teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select></label>
          <label><span>Start Date</span><input type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} /></label>
          <label><span>Schedule Notes</span><textarea rows={3} value={form.schedule_notes} onChange={(event) => setForm((current) => ({ ...current, schedule_notes: event.target.value }))} /></label>
          <label className="dashboard-check-filter"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> Confirm conversion into a student record</label>
          <div className="dashboard-form-actions">
            <ActionButton type="submit" variant="copper" disabled={saving}>{saving ? 'Converting' : 'Convert to Student'}</ActionButton>
            <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
