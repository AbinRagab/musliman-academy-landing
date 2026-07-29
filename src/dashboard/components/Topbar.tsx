import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { useAuth } from '../auth/AuthProvider';
import type { DashboardRole } from '../data/mockData';
import { fetchMyNotifications, markAllNotificationsRead, markNotificationRead, type InAppNotification } from '../services/notificationsService';
import TopbarAccountMenu from './TopbarAccountMenu';

type TopbarProps = {
  role: DashboardRole;
  onOpenSidebar: () => void;
};

const searchPlaceholderByRole: Record<DashboardRole, string> = {
  admin: 'Search students, leads, classes...',
  teacher: 'Search my students, classes, trials...',
  student: 'Search classes, homework, messages...',
};

export default function Topbar({ role, onOpenSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { isConfigured, profile, role: authRole, signOut } = useAuth();
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

  async function handleMarkNotificationRead(notificationId: string) {
    await markNotificationRead(notificationId);
    setNotifications((current) => current.map((item) => (
      item.id === notificationId ? { ...item, read_at: item.read_at || new Date().toISOString() } : item
    )));
  }

  async function handleMarkAllNotificationsRead(notificationIds: string[]) {
    await markAllNotificationsRead(notificationIds);
    setNotifications((current) => current.map((notification) => (
      notificationIds.includes(notification.id)
        ? { ...notification, read_at: notification.read_at || new Date().toISOString() }
        : notification
    )));
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
        <TopbarAccountMenu
          userName={profile?.full_name || 'Academy User'}
          userRole={authRole || role}
          userAvatarUrl={profile?.avatar_url}
          unreadNotificationsCount={unreadCount}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onSignOut={handleSignOut}
        />
      </div>
    </header>
  );
}
