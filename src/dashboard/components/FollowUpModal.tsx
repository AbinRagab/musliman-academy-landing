import { FormEvent, useState } from 'react';
import ActionButton from './ActionButton';
import type { LeadRecord } from '../services/leadsService';

export default function FollowUpModal({
  lead,
  onClose,
  onSave,
}: {
  lead: LeadRecord;
  onClose: () => void;
  onSave: (dateTime: string, note: string) => Promise<void>;
}) {
  const [dateTime, setDateTime] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onSave(dateTime, note);
    setSaving(false);
  }

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Add follow-up for ${lead.full_name}`}>
      <div className="dashboard-modal__panel dashboard-modal__panel--small">
        <div className="dashboard-card__header">
          <div>
            <h2>Add Follow-up</h2>
            <p>{lead.full_name}</p>
          </div>
        </div>
        <form className="dashboard-form" onSubmit={handleSubmit}>
          <label><span>Next follow-up</span><input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} required /></label>
          <label><span>Follow-up notes</span><textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Parent preference, contact attempt, next step" /></label>
          <div className="dashboard-form-actions">
            <ActionButton type="submit" variant="copper" disabled={saving}>{saving ? 'Saving' : 'Save Follow-up'}</ActionButton>
            <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
