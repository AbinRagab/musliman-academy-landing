import { FormEvent, useState } from 'react';
import ActionButton from './ActionButton';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export default function NotesBox({
  notes,
  onAddNote,
}: {
  notes?: string | null;
  onAddNote: (note: string) => Promise<void>;
}) {
  const { t } = useDashboardLanguage();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note.trim()) {
      return;
    }

    setSaving(true);
    await onAddNote(note.trim());
    setNote('');
    setSaving(false);
  }

  return (
    <div className="notes-box">
      <div className="notes-box__history">
        {notes ? notes.split('\n\n').map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>) : <p>{t('No internal notes yet.')}</p>}
      </div>
      <form onSubmit={handleSubmit}>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder={t('Add internal admission note')} />
        <ActionButton type="submit" variant="secondary" disabled={saving}>{t(saving ? 'Saving' : 'Add Note')}</ActionButton>
      </form>
    </div>
  );
}
