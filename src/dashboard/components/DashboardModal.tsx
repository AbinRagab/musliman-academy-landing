import type { ReactNode } from 'react';
import Icon from '../../components/Icon';

export default function DashboardModal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button className="dashboard-modal__backdrop" type="button" aria-label="Close modal" onClick={onClose} />
      <section className={`dashboard-modal__panel ${wide ? 'dashboard-modal__panel--wide' : ''}`}>
        <div className="dashboard-modal__header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="dashboard-icon-button" aria-label="Close modal" onClick={onClose}>
            <Icon name="x" size={17} />
          </button>
        </div>
        <div className="dashboard-modal__body">{children}</div>
        {footer && <div className="dashboard-modal__footer">{footer}</div>}
      </section>
    </div>
  );
}
