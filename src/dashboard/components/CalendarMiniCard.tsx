import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export default function CalendarMiniCard({ month, day, label }: { month: string; day: string; label: string }) {
  const { t } = useDashboardLanguage();

  return (
    <div className="dashboard-calendar-mini">
      <span>{t(month)}</span>
      <strong>{day}</strong>
      <small>{t(label)}</small>
    </div>
  );
}
