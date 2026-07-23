import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import EmptyState from './components/EmptyState';
import ActionButton from './components/ActionButton';
import AccountsRolesPage from './pages/AccountsRolesPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentPortal from './pages/StudentPortal';
import TeacherDashboard from './pages/TeacherDashboard';
import type { DashboardRole } from './data/mockData';

function ComingSoon({ role }: { role: DashboardRole }) {
  return (
    <DashboardLayout role={role}>
      <EmptyState
        title="Dashboard section coming soon"
        description="This phase uses mock data for the main role dashboards and account control center. The navigation is ready for the next implementation pass."
        action={<ActionButton variant="secondary">Mock UI Phase</ActionButton>}
      />
    </DashboardLayout>
  );
}

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route
        index
        element={(
          <DashboardLayout role="admin">
            <AdminDashboard />
          </DashboardLayout>
        )}
      />
      <Route
        path="admin"
        element={(
          <DashboardLayout role="admin">
            <AdminDashboard />
          </DashboardLayout>
        )}
      />
      <Route
        path="admin/accounts"
        element={(
          <DashboardLayout role="admin">
            <AccountsRolesPage />
          </DashboardLayout>
        )}
      />
      <Route path="admin/:section" element={<ComingSoon role="admin" />} />
      <Route
        path="student"
        element={(
          <DashboardLayout role="student">
            <StudentPortal />
          </DashboardLayout>
        )}
      />
      <Route path="student/:section" element={<ComingSoon role="student" />} />
      <Route
        path="teacher"
        element={(
          <DashboardLayout role="teacher">
            <TeacherDashboard />
          </DashboardLayout>
        )}
      />
      <Route path="teacher/:section" element={<ComingSoon role="teacher" />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
