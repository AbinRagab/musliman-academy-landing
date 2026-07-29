import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, accountsRoles, adminAreaRoles, getDashboardPath, studentRoles, teacherRoles, useAuth, type AuthRole } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import EmptyState from './components/EmptyState';
import ActionButton from './components/ActionButton';
import AccountsRolesPage from './pages/AccountsRolesPage';
import AdminCompliancePage from './pages/AdminCompliancePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminSectionPage from './pages/AdminSectionPage';
import LeadsCRMPage from './pages/LeadsCRMPage';
import LoginPage from './pages/LoginPage';
import StudentAttendance from './pages/StudentAttendance';
import StudentClasses from './pages/StudentClasses';
import StudentDashboard from './pages/StudentDashboard';
import StudentFreeTrial from './pages/StudentFreeTrial';
import StudentHomework from './pages/StudentHomework';
import StudentMessages from './pages/StudentMessages';
import StudentPayments from './pages/StudentPayments';
import StudentProfile from './pages/StudentProfile';
import StudentProgress from './pages/StudentProgress';
import StudentRecordPage from './pages/StudentRecordPage';
import StudentSchedule from './pages/StudentSchedule';
import StudentSettings from './pages/StudentSettings';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherSectionPage from './pages/TeacherSectionPage';
import type { DashboardRole } from './data/mockData';
import './styles/dashboard.css';

function ComingSoon({ role }: { role: DashboardRole }) {
  return (
    <EmptyState
      title="Dashboard section coming soon"
      description={`This ${role} dashboard section is ready for the next implementation pass.`}
      action={<ActionButton variant="secondary">Section Pending</ActionButton>}
    />
  );
}

function DashboardIndex() {
  const { role } = useAuth();

  return <Navigate to={getDashboardPath(role)} replace />;
}

function ProtectedDashboardShell({
  allowedRoles,
  layoutRole,
}: {
  allowedRoles: AuthRole[];
  layoutRole: DashboardRole;
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout role={layoutRole} />
    </ProtectedRoute>
  );
}

function ProtectedPage({
  allowedRoles,
  children,
}: {
  allowedRoles: AuthRole[];
  children: ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}

export default function DashboardRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route index element={<ProtectedRoute allowedRoles={[...adminAreaRoles, ...teacherRoles, ...studentRoles]}><DashboardIndex /></ProtectedRoute>} />
        <Route path="login" element={<LoginPage />} />
        <Route path="admin" element={<ProtectedDashboardShell allowedRoles={adminAreaRoles} layoutRole="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="accounts" element={<ProtectedPage allowedRoles={accountsRoles}><AccountsRolesPage /></ProtectedPage>} />
          <Route path="leads" element={<ProtectedPage allowedRoles={['super_admin', 'admin', 'admissions', 'academic_manager']}><LeadsCRMPage /></ProtectedPage>} />
          <Route path="students" element={<AdminSectionPage section="students" />} />
          <Route path="students/:studentId" element={<StudentRecordPage portalRole="admin" />} />
          <Route path="students/:studentId/payments" element={<StudentRecordPage portalRole="admin" initialTab="payments" />} />
          <Route path="teachers" element={<AdminSectionPage section="teachers" />} />
          <Route path="free-trials" element={<AdminSectionPage section="free-trials" />} />
          <Route path="classes" element={<AdminSectionPage section="classes" />} />
          <Route path="attendance" element={<AdminSectionPage section="attendance" />} />
          <Route path="compliance" element={<AdminCompliancePage />} />
          <Route path="payments" element={<AdminSectionPage section="payments" />} />
          <Route path="reports" element={<AdminSectionPage section="reports" />} />
          <Route path="settings" element={<AdminSectionPage section="settings" />} />
          <Route path=":section" element={<ComingSoon role="admin" />} />
        </Route>
        <Route path="student" element={<ProtectedDashboardShell allowedRoles={studentRoles} layoutRole="student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="classes" element={<StudentClasses />} />
          <Route path="free-trial" element={<StudentFreeTrial />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="homework" element={<StudentHomework />} />
          <Route path="progress" element={<StudentProgress />} />
          <Route path="messages" element={<StudentMessages />} />
          <Route path="payments" element={<StudentPayments />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="settings" element={<StudentSettings />} />
          <Route path=":section" element={<ComingSoon role="student" />} />
        </Route>
        <Route path="teacher" element={<ProtectedDashboardShell allowedRoles={teacherRoles} layoutRole="teacher" />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<TeacherSectionPage section="students" />} />
          <Route path="students/:studentId" element={<StudentRecordPage portalRole="teacher" />} />
          <Route path="free-trials" element={<TeacherSectionPage section="free-trials" />} />
          <Route path="schedule" element={<TeacherSectionPage section="schedule" />} />
          <Route path="classes" element={<TeacherSectionPage section="classes" />} />
          <Route path="attendance" element={<TeacherSectionPage section="attendance" />} />
          <Route path="evaluations" element={<TeacherSectionPage section="evaluations" />} />
          <Route path="reports" element={<TeacherSectionPage section="reports" />} />
          <Route path="messages" element={<TeacherSectionPage section="messages" />} />
          <Route path="profile" element={<TeacherSectionPage section="profile" />} />
          <Route path="settings" element={<TeacherSectionPage section="settings" />} />
          <Route path=":section" element={<ComingSoon role="teacher" />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
