import Icon from '../../components/Icon';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export type ToastMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function Toast({
  toast,
  onClose,
}: {
  toast: ToastMessage | null;
  onClose: () => void;
}) {
  const { t } = useDashboardLanguage();

  if (!toast) {
    return null;
  }

  return (
    <div className={`dashboard-toast dashboard-toast--${toast.type}`} role="status">
      <Icon name={toast.type === 'success' ? 'checkCircle' : 'shieldCheck'} size={18} />
      <span>{t(toast.message)}</span>
      <button type="button" aria-label={t('Dismiss message')} onClick={onClose}>
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
