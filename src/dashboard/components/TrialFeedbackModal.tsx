import { FormEvent, useState } from 'react';
import ActionButton from './ActionButton';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

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
    recommendedLevel: string;
    teacherFeedback: string;
    recommendation: string;
    notes: string;
    result: 'recommended' | 'needs_follow_up' | 'not_suitable' | 'no_show';
  }) => Promise<void>;
}) {
  const { t } = useDashboardLanguage();
  const [form, setForm] = useState({
    recitationLevel: '',
    tajweedLevel: '',
    arabicLevel: '',
    engagement: '',
    recommendedLevel: '',
    teacherFeedback: '',
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
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={t('Submit feedback for {{name}}', { name: title })}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div>
            <h2>{t('Submit Trial Feedback')}</h2>
            <p>{title}</p>
          </div>
        </div>
        <form className="dashboard-form" onSubmit={handleSubmit}>
          <label><span>{t('Reading level')}</span><input value={form.recitationLevel} onChange={(event) => setForm((current) => ({ ...current, recitationLevel: event.target.value }))} /></label>
          <label><span>{t('Tajweed level')}</span><input value={form.tajweedLevel} onChange={(event) => setForm((current) => ({ ...current, tajweedLevel: event.target.value }))} /></label>
          <label><span>{t('Arabic level')}</span><input value={form.arabicLevel} onChange={(event) => setForm((current) => ({ ...current, arabicLevel: event.target.value }))} /></label>
          <label><span>{t('Student engagement')}</span><input value={form.engagement} onChange={(event) => setForm((current) => ({ ...current, engagement: event.target.value }))} /></label>
          <label><span>{t('Recommended level')}</span><input value={form.recommendedLevel} onChange={(event) => setForm((current) => ({ ...current, recommendedLevel: event.target.value }))} /></label>
          <label><span>{t('Teacher feedback')}</span><textarea rows={3} value={form.teacherFeedback} onChange={(event) => setForm((current) => ({ ...current, teacherFeedback: event.target.value }))} /></label>
          <label><span>{t('Recommendation')}</span><textarea rows={3} value={form.recommendation} onChange={(event) => setForm((current) => ({ ...current, recommendation: event.target.value }))} /></label>
          <label><span>{t('Internal note')}</span><textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          <label><span>{t('Trial result')}</span><select value={form.result} onChange={(event) => setForm((current) => ({ ...current, result: event.target.value as typeof form.result }))}><option value="recommended">{t('Recommended')}</option><option value="needs_follow_up">{t('Needs follow-up')}</option><option value="not_suitable">{t('Not suitable')}</option><option value="no_show">{t('No show')}</option></select></label>
          <div className="dashboard-form-actions">
            <ActionButton type="submit" variant="copper" disabled={saving}>{t(saving ? 'Saving' : 'Save Feedback')}</ActionButton>
            <ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
