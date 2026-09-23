import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'copper' | 'danger' | 'ghost';
};

export default function ActionButton({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  ...props
}: ActionButtonProps) {
  const { t } = useDashboardLanguage();
  const content = typeof children === 'string' ? t(children) : children;

  return (
    <button className={`dashboard-action dashboard-action--${variant} ${className}`.trim()} type={type} {...props}>
      {content}
    </button>
  );
}
