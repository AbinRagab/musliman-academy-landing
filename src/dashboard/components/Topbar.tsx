import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
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

export default function Topbar({ role, onOpenSidebar }: TopbarProps) {
  const navigate = useNavigate();

  return (
    <header className="dashboard-topbar">
      <button className="dashboard-menu-toggle" type="button" aria-label="Open dashboard menu" onClick={onOpenSidebar}>
        <Icon name="menu" />
      </button>
      <div className="dashboard-topbar__title">
        <span>Musliman Academy</span>
        <strong>Role Based Dashboard</strong>
      </div>
      <div className="dashboard-topbar__actions">
        <RoleBadge role={role} />
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
      </div>
    </header>
  );
}
