import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export default function ActionButton({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button className={`dashboard-action dashboard-action--${variant} ${className}`.trim()} type={type} {...props}>
      {children}
    </button>
  );
}
