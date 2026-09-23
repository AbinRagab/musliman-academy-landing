import type { ReactNode } from 'react';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export default function DashboardPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  const { t } = useDashboardLanguage();

  return (
    <div className="dashboard-page-header">
      <div>
        <span className="dashboard-eyebrow">{t(eyebrow)}</span>
        <h1>{t(title)}</h1>
        <p>{t(subtitle)}</p>
      </div>
      {action}
    </div>
  );
}
