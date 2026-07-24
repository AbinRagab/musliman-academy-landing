import Icon from '../../components/Icon';

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
  if (!toast) {
    return null;
  }

  return (
    <div className={`dashboard-toast dashboard-toast--${toast.type}`} role="status">
      <Icon name={toast.type === 'success' ? 'checkCircle' : 'shieldCheck'} size={18} />
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss message" onClick={onClose}>
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
