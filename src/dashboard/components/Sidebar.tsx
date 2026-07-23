import { NavLink } from 'react-router-dom';
import Icon from '../../components/Icon';
import type { DashboardRole } from '../data/mockData';

type SidebarLink = {
  label: string;
  path: string;
  icon: string;
};

const linksByRole: Record<DashboardRole, SidebarLink[]> = {
  admin: [
    { label: 'Dashboard', path: '/dashboard/admin', icon: 'chart' },
    { label: 'Students', path: '/dashboard/admin/students', icon: 'student' },
    { label: 'Teachers', path: '/dashboard/admin/teachers', icon: 'teacher' },
    { label: 'Free Trials', path: '/dashboard/admin/free-trials', icon: 'gift' },
    { label: 'Classes', path: '/dashboard/admin/classes', icon: 'calendar' },
    { label: 'Attendance', path: '/dashboard/admin/attendance', icon: 'clipboard' },
    { label: 'Reports', path: '/dashboard/admin/reports', icon: 'report' },
    { label: 'Accounts & Roles', path: '/dashboard/admin/accounts', icon: 'shieldCheck' },
    { label: 'Payments', path: '/dashboard/admin/payments', icon: 'award' },
    { label: 'Settings', path: '/dashboard/admin/settings', icon: 'sparkles' },
  ],
  student: [
    { label: 'Dashboard', path: '/dashboard/student', icon: 'chart' },
    { label: 'My Classes', path: '/dashboard/student/classes', icon: 'calendar' },
    { label: 'Free Trial', path: '/dashboard/student/free-trial', icon: 'gift' },
    { label: 'Attendance', path: '/dashboard/student/attendance', icon: 'clipboard' },
    { label: 'Homework', path: '/dashboard/student/homework', icon: 'document' },
    { label: 'Progress', path: '/dashboard/student/progress', icon: 'progress' },
    { label: 'Messages', path: '/dashboard/student/messages', icon: 'message' },
    { label: 'Profile', path: '/dashboard/student/profile', icon: 'user' },
    { label: 'Settings', path: '/dashboard/student/settings', icon: 'sparkles' },
  ],
  teacher: [
    { label: 'Dashboard', path: '/dashboard/teacher', icon: 'chart' },
    { label: 'My Students', path: '/dashboard/teacher/students', icon: 'users' },
    { label: 'Free Trials', path: '/dashboard/teacher/free-trials', icon: 'gift' },
    { label: 'My Classes', path: '/dashboard/teacher/classes', icon: 'calendar' },
    { label: 'Attendance', path: '/dashboard/teacher/attendance', icon: 'clipboard' },
    { label: 'Student Evaluations', path: '/dashboard/teacher/evaluations', icon: 'star' },
    { label: 'Reports', path: '/dashboard/teacher/reports', icon: 'report' },
    { label: 'Messages', path: '/dashboard/teacher/messages', icon: 'message' },
    { label: 'Profile', path: '/dashboard/teacher/profile', icon: 'user' },
    { label: 'Settings', path: '/dashboard/teacher/settings', icon: 'sparkles' },
  ],
};

type SidebarProps = {
  role: DashboardRole;
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className={`dashboard-sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="dashboard-sidebar__brand">
          <img src="/assets/musliman-logo-dark-bg-transparent.png" alt="Musliman Academy" />
        </div>
        <nav className="dashboard-sidebar__nav" aria-label={`${role} dashboard navigation`}>
          {linksByRole[role].map((link) => (
            <NavLink
              key={link.label}
              to={link.path}
              end={link.path === `/dashboard/${role}` || link.path === '/dashboard/admin'}
              onClick={onClose}
              className={({ isActive }) => `dashboard-sidebar__link ${isActive ? 'is-active' : ''}`}
            >
              <Icon name={link.icon} size={19} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="dashboard-sidebar__quote">
          <span>Quran Reflection</span>
          <p>"And say, My Lord, increase me in knowledge."</p>
          <small>Surah Taha 20:114</small>
        </div>
      </aside>
      <button
        className={`dashboard-sidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        type="button"
        aria-label="Close dashboard menu"
        onClick={onClose}
      />
    </>
  );
}
