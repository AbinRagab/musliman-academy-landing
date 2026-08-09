import { FormEvent, useState } from 'react';
import ActionButton from './ActionButton';
import ProgramSelect from './ProgramSelect';
import type { LeadRecord, TeacherOption } from '../services/leadsService';

export default function ScheduleTrialModal({
  lead,
  teachers,
  onClose,
  onSave,
}: {
  lead: LeadRecord;
  teachers: TeacherOption[];
  onClose: () => void;
  onSave: (payload: { teacherId: string; programId: string | null; trialDate: string; trialTime: string; meetingLink: string; notes: string }) => Promise<void>;
}) {
  const [teacherId, setTeacherId] = useState(lead.assigned_teacher_id || teachers[0]?.id || '');
  const [programId, setProgramId] = useState(lead.program_id || '');
  const [trialDate, setTrialDate] = useState('');
  const [trialTime, setTrialTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onSave({ teacherId, programId: programId || null, trialDate, trialTime, meetingLink, notes });
    setSaving(false);
  }

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Schedule trial for ${lead.full_name}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div>
            <h2>Schedule Free Trial</h2>
            <p>{lead.full_name} - {lead.programName}</p>
          </div>
        </div>
        <form className="dashboard-form" onSubmit={handleSubmit}>
          <label><span>Teacher</span><select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} required>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name} - {teacher.specialization}</option>)}</select></label>
          <ProgramSelect label="Program" value={programId} onChange={setProgramId} required />
          <label><span>Trial date</span><input type="date" value={trialDate} onChange={(event) => setTrialDate(event.target.value)} required /></label>
          <label><span>Trial time</span><input type="time" value={trialTime} onChange={(event) => setTrialTime(event.target.value)} required /></label>
          <label><span>Meeting link</span><input type="url" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="https://..." /></label>
          <label><span>Notes</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Trial preparation notes" /></label>
          <div className="dashboard-form-actions">
            <ActionButton type="submit" variant="copper" disabled={saving}>{saving ? 'Scheduling' : 'Schedule Trial'}</ActionButton>
            <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
