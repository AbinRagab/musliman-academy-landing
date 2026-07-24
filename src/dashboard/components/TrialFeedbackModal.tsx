import { FormEvent, useState } from 'react';
import ActionButton from './ActionButton';

export default function TrialFeedbackModal({
  title,
  onClose,
  onSave,
}: {
  title: string;
  onClose: () => void;
  onSave: (payload: {
    recitationLevel: string;
    tajweedLevel: string;
    arabicLevel: string;
    engagement: string;
    recommendation: string;
    notes: string;
    result: 'recommended' | 'needs_follow_up' | 'not_suitable' | 'no_show';
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    recitationLevel: '',
    tajweedLevel: '',
    arabicLevel: '',
    engagement: '',
    recommendation: '',
    notes: '',
    result: 'recommended' as 'recommended' | 'needs_follow_up' | 'not_suitable' | 'no_show',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Submit feedback for ${title}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div>
            <h2>Submit Trial Feedback</h2>
            <p>{title}</p>
          </div>
        </div>
        <form className="dashboard-form" onSubmit={handleSubmit}>
          <label><span>Recitation / reading level</span><input value={form.recitationLevel} onChange={(event) => setForm((current) => ({ ...current, recitationLevel: event.target.value }))} /></label>
          <label><span>Tajweed level</span><input value={form.tajweedLevel} onChange={(event) => setForm((current) => ({ ...current, tajweedLevel: event.target.value }))} /></label>
          <label><span>Arabic level</span><input value={form.arabicLevel} onChange={(event) => setForm((current) => ({ ...current, arabicLevel: event.target.value }))} /></label>
          <label><span>Student engagement</span><input value={form.engagement} onChange={(event) => setForm((current) => ({ ...current, engagement: event.target.value }))} /></label>
          <label><span>Recommendation</span><textarea rows={3} value={form.recommendation} onChange={(event) => setForm((current) => ({ ...current, recommendation: event.target.value }))} /></label>
          <label><span>Notes</span><textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          <label><span>Result</span><select value={form.result} onChange={(event) => setForm((current) => ({ ...current, result: event.target.value as typeof form.result }))}><option value="recommended">Recommended</option><option value="needs_follow_up">Needs follow-up</option><option value="not_suitable">Not suitable</option><option value="no_show">No show</option></select></label>
          <div className="dashboard-form-actions">
            <ActionButton type="submit" variant="copper" disabled={saving}>{saving ? 'Saving' : 'Save Feedback'}</ActionButton>
            <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
