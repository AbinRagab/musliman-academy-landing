import { useEffect, type ReactNode } from 'react';
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
  open = true,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  sections = [],
  actions = [],
  onClose,
  width = 'standard',
  size,
}: {
  open?: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  sections?: DashboardDrawerSection[];
  actions?: DashboardDrawerAction[];
  onClose: () => void;
  width?: 'standard' | 'wide';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const resolvedSize = size || (width === 'wide' ? 'lg' : 'md');

  return (
    <div className="dashboard-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="dashboard-drawer__backdrop" aria-label="Close drawer" onClick={onClose} />
      <aside className={`dashboard-drawer__panel dashboard-drawer__panel--${width} dashboard-drawer__panel--${resolvedSize}`}>
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

        {children && <div className="dashboard-drawer__body">{children}</div>}

        {sections.map((section) => (
          <section className="dashboard-drawer__section" key={section.title}>
            <h3>{section.title}</h3>
            {section.children}
          </section>
        ))}

        {(footer || actions.length > 0) && (
          <footer className="dashboard-drawer__footer">
            {footer}
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
