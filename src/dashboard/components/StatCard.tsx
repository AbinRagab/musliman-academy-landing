import Icon from '../../components/Icon';

type StatCardProps = {
  label: string;
  value: string | number;
  trend?: string;
  icon?: string;
};

export default function StatCard({ label, value, trend, icon = 'chart' }: StatCardProps) {
  return (
    <article className="dashboard-stat">
      <div className="dashboard-stat__icon">
        <Icon name={icon} size={22} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {trend && <small>{trend}</small>}
      </div>
    </article>
  );
}
