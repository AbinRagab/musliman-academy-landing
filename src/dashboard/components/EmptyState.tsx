import Icon from '../../components/Icon';
import type { ReactNode } from 'react';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { t } = useDashboardLanguage();

  return (
    <div className="dashboard-empty">
      <div className="dashboard-empty__icon">
        <Icon name="sparkles" />
      </div>
      <h2>{t(title)}</h2>
      <p>{t(description)}</p>
      {action}
    </div>
  );
}
