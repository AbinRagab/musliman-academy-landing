import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import type { DashboardRole } from '../types';
import { fetchMyNotifications, markAllNotificationsRead, markNotificationRead, type InAppNotification } from '../services/notificationsService';
import { searchDashboard, type GlobalSearchResult } from '../services/globalSearchService';
import TopbarAccountMenu from './TopbarAccountMenu';

type TopbarProps = {
  role: DashboardRole;
  onOpenSidebar: () => void;
};

export default function Topbar({ role, onOpenSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { isConfigured, profile, role: authRole, signOut } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!isConfigured || !profile) {
      setNotifications([]);
      return;
    }

    fetchMyNotifications()
      .then(setNotifications)
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('Notifications fetch failed:', error);
        }
        setNotifications([]);
      });

    const channel = supabase
      ?.channel(`in-app-notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => {
          fetchMyNotifications()
            .then(setNotifications)
            .catch((error) => {
              if (import.meta.env.DEV) {
                console.error('Notifications realtime refresh failed:', error);
              }
            });
        },
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [isConfigured, profile]);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read_at).length, [notifications]);

  useEffect(() => {
    const query = search.trim();
    if (!query || query.length < 2 || !isConfigured) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return undefined;
    }

    let cancelled = false;
    setSearchLoading(true);
    const timeout = window.setTimeout(() => {
      searchDashboard(role, query)
        .then((results) => {
          if (!cancelled) {
            setSearchResults(results);
            setSearchError('');
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setSearchResults([]);
            setSearchError(error instanceof Error ? error.message : 'Search failed.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearchLoading(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isConfigured, role, search]);

  async function handleSignOut() {
    await signOut();
    navigate('/dashboard/login', { replace: true });
  }

  async function handleMarkNotificationRead(notificationId: string) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((current) => current.map((item) => (
        item.id === notificationId ? { ...item, read_at: item.read_at || new Date().toISOString() } : item
      )));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Notification read update failed:', error);
      }
    }
  }

  async function handleMarkAllNotificationsRead(notificationIds: string[]) {
    try {
      await markAllNotificationsRead(notificationIds);
      setNotifications((current) => current.map((notification) => (
        notificationIds.includes(notification.id)
          ? { ...notification, read_at: notification.read_at || new Date().toISOString() }
          : notification
      )));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Notifications bulk read update failed:', error);
      }
    }
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
      <div className="dashboard-topbar-search">
        <Icon name="search" size={17} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dashboard" aria-label="Search dashboard" />
        {search.trim().length >= 2 && (
          <div className="dashboard-topbar-search__results">
            {searchLoading && <span>Searching...</span>}
            {!searchLoading && searchError && <span>{searchError}</span>}
            {!searchLoading && !searchError && searchResults.length === 0 && <span>No matching records</span>}
            {!searchLoading && !searchError && searchResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                onClick={() => {
                  navigate(result.path);
                  setSearch('');
                  setSearchResults([]);
                }}
              >
                <strong>{result.label}</strong>
                <small>{result.description}</small>
              </button>
            ))}
          </div>
        )}
      </div>
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
