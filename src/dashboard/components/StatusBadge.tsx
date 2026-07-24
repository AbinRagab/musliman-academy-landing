import type { StatusTone } from '../data/mockData';

const toneByStatus: Record<string, StatusTone> = {
  active: 'success',
  enabled: 'success',
  paid: 'success',
  present: 'success',
  converted: 'success',
  completed: 'success',
  ready: 'success',
  live: 'info',
  upcoming: 'info',
  scheduled: 'neutral',
  disabled: 'neutral',
  inactive: 'neutral',
  pending: 'warning',
  'pending payment': 'warning',
  overdue: 'danger',
  late: 'warning',
  draft: 'warning',
  'needs review': 'danger',
  absent: 'danger',
  'no show': 'danger',
  no_show: 'danger',
  lost: 'danger',
  contacted: 'info',
  new: 'info',
  trial_scheduled: 'info',
  follow_up_later: 'warning',
};

export default function StatusBadge({ label, tone }: { label: string; tone?: StatusTone }) {
  const normalizedLabel = label.toLowerCase().replace(/_/g, ' ');
  const resolvedTone = tone || toneByStatus[label.toLowerCase()] || toneByStatus[normalizedLabel] || 'neutral';

  return <span className={`dashboard-status dashboard-status--${resolvedTone}`}>{normalizedLabel}</span>;
}
