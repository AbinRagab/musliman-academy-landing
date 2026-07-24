import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/Icon';

export type ActionMenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export default function ActionMenu({
  label,
  items,
}: {
  label: string;
  items: ActionMenuItem[];
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  function updatePosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 230;
    const menuHeight = Math.min(360, items.length * 40 + 14);
    const top = rect.bottom + menuHeight + 10 > window.innerHeight
      ? Math.max(12, rect.top - menuHeight - 8)
      : rect.bottom + 8;
    const left = Math.min(
      window.innerWidth - menuWidth - 12,
      Math.max(12, rect.right - menuWidth),
    );

    setPosition({ top, left });
  }

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
  }, [open, items.length]);

  const menu: ReactNode = open && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={menuRef}
        className="dashboard-action-menu-portal"
        style={{ top: position.top, left: position.left }}
        role="menu"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={item.danger ? 'is-danger' : ''}
            disabled={item.disabled}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              item.onClick();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>,
      document.body,
    )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        className="dashboard-action-menu-trigger"
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="moreVertical" size={18} />
      </button>
      {menu}
    </>
  );
}
