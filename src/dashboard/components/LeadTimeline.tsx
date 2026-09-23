import type { LeadActivity } from '../services/leadsService';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function LeadTimeline({ activities }: { activities: LeadActivity[] }) {
  const { language, t } = useDashboardLanguage();

  return (
    <div className="lead-timeline">
      {activities.length ? activities.map((activity) => (
        <article className="lead-timeline__item" key={activity.id}>
          <span />
          <div>
            <strong>{t(activity.action_type.replace(/_/g, ' '))}</strong>
            <p>{activity.description || t('Lead activity recorded.')}</p>
            <small>{formatDate(activity.created_at, language)}</small>
          </div>
        </article>
      )) : (
        <div className="lead-kanban__empty">{t('No activity recorded yet.')}</div>
      )}
    </div>
  );
}
