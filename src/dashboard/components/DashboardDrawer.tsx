import type { ReactNode } from 'react';
import Icon from '../../components/Icon';
import ActionButton from './ActionButton';

export type DashboardDrawerAction = {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'copper' | 'danger' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
};

export type DashboardDrawerSection = {
  title: string;
  children: ReactNode;
};

export default function DashboardDrawer({
  eyebrow,
  title,
  subtitle,
  sections,
  actions = [],
  onClose,
  width = 'standard',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  sections: DashboardDrawerSection[];
  actions?: DashboardDrawerAction[];
  onClose: () => void;
  width?: 'standard' | 'wide';
}) {
  return (
    <div className="dashboard-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="dashboard-drawer__backdrop" aria-label="Close drawer" onClick={onClose} />
      <aside className={`dashboard-drawer__panel dashboard-drawer__panel--${width}`}>
        <header className="dashboard-drawer__header">
          <div>
            {eyebrow && <span className="dashboard-eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="dashboard-icon-button" aria-label="Close drawer" onClick={onClose}>
            <Icon name="x" size={17} />
          </button>
        </header>

        {sections.map((section) => (
          <section className="dashboard-drawer__section" key={section.title}>
            <h3>{section.title}</h3>
            {section.children}
          </section>
        ))}

        {actions.length > 0 && (
          <footer className="dashboard-drawer__footer">
            {actions.map((action) => (
              <ActionButton
                key={action.label}
                variant={action.variant || 'secondary'}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.icon && <Icon name={action.icon} size={16} />}
                {action.label}
              </ActionButton>
            ))}
          </footer>
        )}
      </aside>
    </div>
  );
}
