import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { getDashboardPath, useAuth } from '../auth/AuthProvider';
import type { DashboardRole } from '../data/mockData';
import { fetchMyNotifications, markAllNotificationsRead, markNotificationRead, type InAppNotification } from '../services/notificationsService';
import RoleBadge from './RoleBadge';

type TopbarProps = {
  role: DashboardRole;
  onOpenSidebar: () => void;
};

const roleRoutes: Record<DashboardRole, string> = {
  admin: '/dashboard/admin',
  teacher: '/dashboard/teacher',
  student: '/dashboard/student',
};

const searchPlaceholderByRole: Record<DashboardRole, string> = {
  admin: 'Search students, leads, classes...',
  teacher: 'Search my students, classes, trials...',
  student: 'Search classes, homework, messages...',
};

export default function Topbar({ role, onOpenSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { isConfigured, profile, role: authRole, signOut } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    if (!isConfigured || !profile) {
      setNotifications([]);
      return;
    }

    fetchMyNotifications().then(setNotifications);
  }, [isConfigured, profile]);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read_at).length, [notifications]);

  async function handleSignOut() {
    await signOut();
    navigate('/dashboard/login', { replace: true });
  }

  return (
    <header className="dashboard-topbar">
      <button className="dashboard-menu-toggle" type="button" aria-label="Open dashboard menu" onClick={onOpenSidebar}>
        <Icon name="menu" />
      </button>
      <div className="dashboard-topbar__title">
        <span>Musliman Academy</span>
        <strong>Role Based Dashboard</strong>
      </div>
      <label className="dashboard-topbar-search">
        <Icon name="search" size={17} />
        <input
          type="search"
          placeholder={searchPlaceholderByRole[role]}
        />
      </label>
      <div className="dashboard-topbar__actions">
        <div className="dashboard-notification-menu">
          <button className="dashboard-notification-button" type="button" aria-label="Notifications" onClick={() => setNotificationsOpen((current) => !current)}>
            <Icon name="bell" size={18} />
            {unreadCount > 0 && <span />}
          </button>
          {notificationsOpen && (
            <div className="dashboard-notification-dropdown" role="dialog" aria-label="Notifications">
              <div className="dashboard-notification-dropdown__header">
                <strong>Notifications</strong>
                <button
                  type="button"
                  onClick={async () => {
                    const unreadIds = notifications.filter((notification) => !notification.read_at).map((notification) => notification.id);
                    await markAllNotificationsRead(unreadIds);
                    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at || new Date().toISOString() })));
                  }}
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>
              <div className="dashboard-notification-list">
                {notifications.length ? notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`dashboard-notification-item ${notification.read_at ? '' : 'is-unread'}`}
                    onClick={async () => {
                      if (!notification.read_at) {
                        await markNotificationRead(notification.id);
                        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
                      }

                      if (notification.related_url) {
                        navigate(notification.related_url);
                        setNotificationsOpen(false);
                      }
                    }}
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
        <RoleBadge role={authRole || role} />
        {isConfigured ? (
          <>
            <button className="dashboard-profile-chip" type="button" onClick={() => navigate(getDashboardPath(authRole))}>
              <span>{profile?.full_name || 'Academy User'}</span>
            </button>
            <button className="dashboard-signout-button" type="button" onClick={handleSignOut}>
              <Icon name="x" size={16} />
              <span>Sign out</span>
            </button>
          </>
        ) : (
          <label className="dashboard-role-switcher">
            <span>View as</span>
            <select
              value={role}
              onChange={(event) => navigate(roleRoutes[event.target.value as DashboardRole])}
              aria-label="Switch dashboard role"
            >
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </label>
        )}
      </div>
    </header>
  );
}

function StatusDot({ type }: { type: string }) {
  return <i className={`dashboard-notification-dot dashboard-notification-dot--${type}`} aria-hidden="true" />;
}
