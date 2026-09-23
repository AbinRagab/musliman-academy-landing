import type { ReactNode } from 'react';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ title, subtitle, action, children, className = '' }: SectionCardProps) {
  const { t } = useDashboardLanguage();

  return (
    <section className={`dashboard-card ${className}`.trim()}>
      {(title || subtitle || action) && (
        <div className="dashboard-card__header">
          <div>
            {title && <h2>{t(title)}</h2>}
            {subtitle && <p>{t(subtitle)}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
