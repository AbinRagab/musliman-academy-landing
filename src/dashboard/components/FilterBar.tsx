import type { ReactNode } from 'react';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export default function FilterBar({
  search,
  onSearchChange,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  children?: ReactNode;
}) {
  const { t } = useDashboardLanguage();
  return (
    <div className="dashboard-filters dashboard-filters--inline">
      <label>
        <span>{t('Search')}</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('Search records')}
        />
      </label>
      {children}
    </div>
  );
}
