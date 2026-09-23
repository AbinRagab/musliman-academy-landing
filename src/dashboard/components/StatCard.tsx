import Icon from '../../components/Icon';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

type StatCardProps = {
  label: string;
  value: string | number;
  trend?: string;
  icon?: string;
};

export default function StatCard({ label, value, trend, icon = 'chart' }: StatCardProps) {
  const { t } = useDashboardLanguage();

  return (
    <article className="dashboard-stat">
      <div className="dashboard-stat__icon">
        <Icon name={icon} size={22} />
      </div>
      <div>
        <span>{t(label)}</span>
        <strong>{value}</strong>
        {trend && <small>{t(trend)}</small>}
      </div>
    </article>
  );
}
