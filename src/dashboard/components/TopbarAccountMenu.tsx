import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import type { InAppNotification } from '../services/notificationsService';

type TopbarAccountMenuProps = {
  userName: string;
  userRole: string;
  userAvatarUrl?: string | null;
  unreadNotificationsCount: number;
  notifications: InAppNotification[];
  onMarkNotificationRead: (notificationId: string) => Promise<void>;
  onMarkAllNotificationsRead: (notificationIds: string[]) => Promise<void>;
  onSignOut: () => Promise<void>;
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  finance: 'Finance',
  admissions: 'Admissions',
  academic_manager: 'Academic Manager',
  viewer: 'Viewer',
};

export default function TopbarAccountMenu({
  userName,
  userRole,
  userAvatarUrl,
  unreadNotificationsCount,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSignOut,
}: TopbarAccountMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);
  const accountDropdownRef = useRef<HTMLDivElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationPosition, setNotificationPosition] = useState<CSSProperties>({});
  const [accountPosition, setAccountPosition] = useState<CSSProperties>({});

  const roleLabel = roleLabels[userRole] || titleCase(userRole);
  const initials = useMemo(() => getInitials(userName), [userName]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = menuRef.current?.contains(target);
      const clickedNotificationDropdown = notificationDropdownRef.current?.contains(target);
      const clickedAccountDropdown = accountDropdownRef.current?.contains(target);

      if (!clickedTrigger && !clickedNotificationDropdown && !clickedAccountDropdown) {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setNotificationsOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    function updatePosition() {
      setNotificationPosition(calculateDropdownPosition(notificationButtonRef.current, 320, 420));
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!accountOpen) {
      return;
    }

    function updatePosition() {
      setAccountPosition(calculateDropdownPosition(accountButtonRef.current, 220, 260));
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [accountOpen]);

  async function handleNotificationClick(notification: InAppNotification) {
    if (!notification.read_at) {
      await onMarkNotificationRead(notification.id);
    }

    setNotificationsOpen(false);

    if (notification.related_url) {
      navigate(notification.related_url);
    }
  }

  async function handleMarkAllRead() {
    const unreadIds = notifications.filter((notification) => !notification.read_at).map((notification) => notification.id);
    await onMarkAllNotificationsRead(unreadIds);
  }

  function goToProfile() {
    navigate(profilePathForRole(userRole));
    setAccountOpen(false);
  }

  function goToSettings() {
    navigate(settingsPathForRole(userRole));
    setAccountOpen(false);
  }

  function openNotificationsFromAccount() {
    setAccountOpen(false);
    setNotificationsOpen(true);
  }

  return (
    <div className="topbar-account-menu" ref={menuRef}>
      <div className="dashboard-notification-menu">
        <button
          ref={notificationButtonRef}
          className="topbar-notification-button"
          type="button"
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
          onClick={() => {
            setNotificationsOpen((current) => !current);
            setAccountOpen(false);
          }}
        >
          <Icon name="bell" size={18} />
          {unreadNotificationsCount > 0 && <span>{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>}
        </button>
        <TopbarPortal open={notificationsOpen}>
          <div
            ref={notificationDropdownRef}
            className="dashboard-notification-dropdown"
            role="dialog"
            aria-label="Notifications"
            style={notificationPosition}
          >
            <div className="dashboard-notification-dropdown__header">
              <div>
                <strong>Notifications</strong>
                {unreadNotificationsCount > 0 && <span>{unreadNotificationsCount} unread</span>}
              </div>
              <button type="button" onClick={handleMarkAllRead} disabled={unreadNotificationsCount === 0}>
                Mark all read
              </button>
            </div>
            <div className="dashboard-notification-list">
              {notifications.length ? notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`dashboard-notification-item ${notification.read_at ? '' : 'is-unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span><StatusDot type={notification.type} />{notification.title}</span>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.created_at).toLocaleString()}</small>
                </button>
              )) : (
                <div className="dashboard-notification-empty">No notifications yet.</div>
              )}
            </div>
          </div>
        </TopbarPortal>
      </div>

      <div className="topbar-account-menu__account">
        <button
          ref={accountButtonRef}
          className="topbar-account-button"
          type="button"
          aria-label="Account menu"
          aria-expanded={accountOpen}
          onClick={() => {
            setAccountOpen((current) => !current);
            setNotificationsOpen(false);
          }}
        >
          <span className="topbar-account-avatar">
            {userAvatarUrl ? <img src={userAvatarUrl} alt="" /> : initials}
          </span>
          <span className="topbar-account-text">
            <strong>{userName}</strong>
            <small>{roleLabel}</small>
          </span>
          <Icon name="chevronDown" size={16} className="topbar-account-chevron" />
        </button>

        <TopbarPortal open={accountOpen}>
          <div
            ref={accountDropdownRef}
            className="topbar-account-dropdown"
            role="menu"
            aria-label="Account actions"
            style={accountPosition}
          >
            <button type="button" role="menuitem" onClick={goToProfile}>
              <Icon name="user" size={16} />
              View Profile
            </button>
            <button type="button" role="menuitem" onClick={goToSettings}>
              <Icon name="settings" size={16} />
              Account Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={openNotificationsFromAccount}
            >
              <Icon name="bell" size={16} />
              Notifications
            </button>
            <span className="topbar-account-dropdown__divider" />
            <button
              type="button"
              role="menuitem"
              className="topbar-account-dropdown__signout"
              onClick={() => {
                setAccountOpen(false);
                onSignOut();
              }}
            >
              <Icon name="logOut" size={16} />
              Sign out
            </button>
          </div>
        </TopbarPortal>
      </div>
    </div>
  );
}

function TopbarPortal({ open, children }: { open: boolean; children: ReactNode }) {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}

function calculateDropdownPosition(button: HTMLElement | null, dropdownWidth: number, dropdownHeight: number): CSSProperties {
  if (!button || typeof window === 'undefined') {
    return {};
  }

  const rect = button.getBoundingClientRect();
  const viewportPadding = 12;
  const width = Math.min(dropdownWidth, window.innerWidth - viewportPadding * 2);
  const left = Math.min(
    Math.max(viewportPadding, rect.right - width),
    window.innerWidth - width - viewportPadding,
  );

  const belowTop = rect.bottom + 8;
  const aboveTop = rect.top - dropdownHeight - 8;
  const top = belowTop + dropdownHeight > window.innerHeight - viewportPadding
    ? Math.max(viewportPadding, aboveTop)
    : belowTop;

  return {
    top,
    left,
    width,
  };
}

function StatusDot({ type }: { type: string }) {
  return <i className={`dashboard-notification-dot dashboard-notification-dot--${type}`} aria-hidden="true" />;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return 'MA';
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function profilePathForRole(role: string) {
  if (role === 'teacher') return '/dashboard/teacher/profile';
  if (role === 'student') return '/dashboard/student/profile';
  return '/dashboard/admin/accounts';
}

function settingsPathForRole(role: string) {
  if (role === 'teacher') return '/dashboard/teacher/settings';
  if (role === 'student') return '/dashboard/student/settings';
  return '/dashboard/admin/settings';
}
