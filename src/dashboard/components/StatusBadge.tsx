import type { StatusTone } from '../data/mockData';

const toneByStatus: Record<string, StatusTone> = {
  active: 'success',
  completed: 'success',
  ready: 'success',
  live: 'info',
  upcoming: 'info',
  scheduled: 'neutral',
  pending: 'warning',
  draft: 'warning',
  'needs review': 'danger',
  absent: 'danger',
};

export default function StatusBadge({ label, tone }: { label: string; tone?: StatusTone }) {
  const resolvedTone = tone || toneByStatus[label.toLowerCase()] || 'neutral';

  return <span className={`dashboard-status dashboard-status--${resolvedTone}`}>{label}</span>;
}
