import type { ReactNode } from 'react';
import Icon from '../../components/Icon';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

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
  const { t } = useDashboardLanguage();

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={t(title)}>
      <button className="dashboard-modal__backdrop" type="button" aria-label={t('Close modal')} onClick={onClose} />
      <section className={`dashboard-modal__panel ${wide ? 'dashboard-modal__panel--wide' : ''}`}>
        <div className="dashboard-modal__header">
          <div>
            <h2>{t(title)}</h2>
            {subtitle && <p>{t(subtitle)}</p>}
          </div>
          <button type="button" className="dashboard-icon-button" aria-label={t('Close modal')} onClick={onClose}>
            <Icon name="x" size={17} />
          </button>
        </div>
        <div className="dashboard-modal__body">{children}</div>
        {footer && <div className="dashboard-modal__footer">{footer}</div>}
      </section>
    </div>
  );
}
