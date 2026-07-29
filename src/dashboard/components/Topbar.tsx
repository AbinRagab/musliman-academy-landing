import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { getDashboardPath, useAuth } from '../auth/AuthProvider';
import type { DashboardRole } from '../data/mockData';
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
        <button className="dashboard-notification-button" type="button" aria-label="Notifications">
          <Icon name="bell" size={18} />
          <span />
        </button>
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
