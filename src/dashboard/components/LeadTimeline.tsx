import type { LeadActivity } from '../services/leadsService';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function LeadTimeline({ activities }: { activities: LeadActivity[] }) {
  return (
    <div className="lead-timeline">
      {activities.length ? activities.map((activity) => (
        <article className="lead-timeline__item" key={activity.id}>
          <span />
          <div>
            <strong>{activity.action_type.replace(/_/g, ' ')}</strong>
            <p>{activity.description || 'Lead activity recorded.'}</p>
            <small>{formatDate(activity.created_at)}</small>
          </div>
        </article>
      )) : (
        <div className="lead-kanban__empty">No activity recorded yet.</div>
      )}
    </div>
  );
}
