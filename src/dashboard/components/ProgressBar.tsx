import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export default function ProgressBar({ value, label }: { value: number; label?: string }) {
  const { t } = useDashboardLanguage();
  const translatedLabel = label ? t(label) : t('Progress {{value}}%', { value });

  return (
    <div className="dashboard-progress" aria-label={translatedLabel}>
      <div className="dashboard-progress__top">
        {label && <span>{translatedLabel}</span>}
        <strong>{value}%</strong>
      </div>
      <div className="dashboard-progress__track">
        <span style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
      </div>
    </div>
  );
}
