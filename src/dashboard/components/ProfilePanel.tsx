import RoleBadge from './RoleBadge';
import StatusBadge from './StatusBadge';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export type ProfilePanelItem = {
  label: string;
  value: string;
};

export default function ProfilePanel({
  name,
  subtitle,
  role,
  status,
  items,
}: {
  name: string;
  subtitle: string;
  role?: string;
  status?: string;
  items: ProfilePanelItem[];
}) {
  const { t } = useDashboardLanguage();
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="dashboard-profile-panel">
      <div className="dashboard-profile-panel__top">
        <div className="dashboard-avatar">{initials}</div>
        <div>
          <h3>{name}</h3>
          <p>{t(subtitle)}</p>
          <div className="dashboard-profile-panel__badges">
            {role && <RoleBadge role={role} />}
            {status && <StatusBadge label={status} />}
          </div>
        </div>
      </div>
      <div className="dashboard-profile-panel__items">
        {items.map((item) => (
          <span key={item.label}>
            {t(item.label)}
            <strong>{t(item.value)}</strong>
          </span>
        ))}
      </div>
    </aside>
  );
}
