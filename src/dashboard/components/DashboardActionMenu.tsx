import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/Icon';
import ActionButton from './ActionButton';

type PrimaryActionVariant = 'primary' | 'secondary' | 'outline' | 'danger';

export type DashboardPrimaryAction = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: PrimaryActionVariant;
};

export type DashboardMenuAction = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  hidden?: boolean;
};

type DashboardActionMenuProps = {
  primaryAction?: DashboardPrimaryAction;
  actions?: DashboardMenuAction[];
  variant?: 'default' | 'compact';
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  label?: string;
};

const variantMap: Record<PrimaryActionVariant, 'primary' | 'secondary' | 'copper' | 'danger' | 'ghost'> = {
  primary: 'copper',
  secondary: 'secondary',
  outline: 'ghost',
  danger: 'danger',
};

export default function DashboardActionMenu({
  primaryAction,
  actions = [],
  variant = 'default',
  size = 'sm',
  align = 'right',
  label = 'More actions',
}: DashboardActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const visibleActions = useMemo(() => actions.filter((action) => !action.hidden), [actions]);
  const resolvedPrimary = primaryAction || (visibleActions.length === 1
    ? {
      label: visibleActions[0].label,
      icon: visibleActions[0].icon,
      onClick: visibleActions[0].onClick,
      disabled: visibleActions[0].disabled,
      variant: visibleActions[0].danger ? 'danger' as const : 'secondary' as const,
    }
    : undefined);
  const menuActions = primaryAction ? visibleActions : visibleActions.length === 1 ? [] : visibleActions;

  function updatePosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();
    const menuWidth = menuRect?.width || 220;
    const menuHeight = menuRect?.height || Math.min(380, menuActions.length * 38 + 16);
    const margin = 12;
    const gap = 8;

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - menuHeight - gap);
    }

    const preferredLeft = align === 'left' ? rect.left : rect.right - menuWidth;
    const left = Math.min(
      window.innerWidth - menuWidth - margin,
      Math.max(margin, preferredLeft),
    );

    setPosition({ top, left });
  }

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [align, menuActions.length, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    updatePosition();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [align, menuActions.length, open]);

  if (!resolvedPrimary && menuActions.length === 0) {
    return null;
  }

  const menu = open && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={menuRef}
        className="dashboard-action-menu-dropdown"
        style={{ top: position.top, left: position.left }}
        role="menu"
      >
        {menuActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`dashboard-action-menu-item ${action.danger ? 'danger' : ''}`.trim()}
            disabled={action.disabled}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              action.onClick();
            }}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>,
      document.body,
    )
    : null;

  return (
    <div className={`dashboard-action-menu dashboard-action-menu--${variant} dashboard-action-menu--${size}`}>
      {resolvedPrimary && (
        <ActionButton
          className="dashboard-action-menu__primary"
          variant={variantMap[resolvedPrimary.variant || 'primary']}
          onClick={resolvedPrimary.onClick}
          disabled={resolvedPrimary.disabled}
        >
          {resolvedPrimary.icon}
          {resolvedPrimary.label}
        </ActionButton>
      )}
      {menuActions.length > 0 && (
        <button
          ref={buttonRef}
          className={`dashboard-action-menu__trigger ${open ? 'is-open' : ''}`.trim()}
          type="button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <Icon name="moreVertical" size={17} />
        </button>
      )}
      {menu}
    </div>
  );
}
