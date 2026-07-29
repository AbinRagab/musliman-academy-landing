import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const roleLabel = roleLabels[userRole] || titleCase(userRole);
  const initials = useMemo(() => getInitials(userName), [userName]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
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

  async function handleNotificationClick(notification: InAppNotification) {
    if (!notification.read_at) {
      await onMarkNotificationRead(notification.id);
    }

    if (notification.related_url) {
      navigate(notification.related_url);
      setNotificationsOpen(false);
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

  return (
    <div className="topbar-account-menu" ref={menuRef}>
      <div className="dashboard-notification-menu">
        <button
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
        {notificationsOpen && (
          <div className="dashboard-notification-dropdown" role="dialog" aria-label="Notifications">
            <div className="dashboard-notification-dropdown__header">
              <strong>Notifications</strong>
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
        )}
      </div>

      <div className="topbar-account-menu__account">
        <button
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

        {accountOpen && (
          <div className="topbar-account-dropdown" role="menu" aria-label="Account actions">
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
              onClick={() => {
                setNotificationsOpen(true);
                setAccountOpen(false);
              }}
            >
              <Icon name="bell" size={16} />
              Notifications
            </button>
            <span className="topbar-account-dropdown__divider" />
            <button type="button" role="menuitem" className="topbar-account-dropdown__signout" onClick={onSignOut}>
              <Icon name="logOut" size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
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
