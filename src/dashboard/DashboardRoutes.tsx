import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, accountsRoles, adminAreaRoles, getDashboardPath, studentRoles, teacherRoles, useAuth, type AuthRole } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import EmptyState from './components/EmptyState';
import ActionButton from './components/ActionButton';
import AccountsRolesPage from './pages/AccountsRolesPage';
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
    <DashboardLayout role={role}>
      <EmptyState
        title="Dashboard section coming soon"
        description="This phase uses mock data for the main role dashboards and account control center. The navigation is ready for the next implementation pass."
        action={<ActionButton variant="secondary">Mock UI Phase</ActionButton>}
      />
    </DashboardLayout>
  );
}

function DashboardIndex() {
  const { role } = useAuth();

  return <Navigate to={getDashboardPath(role)} replace />;
}

function ProtectedLayout({
  allowedRoles,
  layoutRole,
  children,
}: {
  allowedRoles: AuthRole[];
  layoutRole: DashboardRole;
  children: ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout role={layoutRole}>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function DashboardRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route index element={<ProtectedRoute allowedRoles={[...adminAreaRoles, ...teacherRoles, ...studentRoles]}><DashboardIndex /></ProtectedRoute>} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="admin"
          element={(
            <ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin">
              <AdminDashboard />
            </ProtectedLayout>
          )}
        />
        <Route
          path="admin/accounts"
          element={(
            <ProtectedLayout allowedRoles={accountsRoles} layoutRole="admin">
              <AccountsRolesPage />
            </ProtectedLayout>
          )}
        />
        <Route path="admin/leads" element={<ProtectedLayout allowedRoles={['super_admin', 'admin', 'admissions', 'academic_manager']} layoutRole="admin"><LeadsCRMPage /></ProtectedLayout>} />
        <Route path="admin/students" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><AdminSectionPage section="students" /></ProtectedLayout>} />
        <Route path="admin/students/:studentId" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><StudentRecordPage portalRole="admin" /></ProtectedLayout>} />
        <Route path="admin/students/:studentId/payments" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><StudentRecordPage portalRole="admin" initialTab="payments" /></ProtectedLayout>} />
        <Route path="admin/teachers" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><AdminSectionPage section="teachers" /></ProtectedLayout>} />
        <Route path="admin/free-trials" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><AdminSectionPage section="free-trials" /></ProtectedLayout>} />
        <Route path="admin/classes" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><AdminSectionPage section="classes" /></ProtectedLayout>} />
        <Route path="admin/attendance" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><AdminSectionPage section="attendance" /></ProtectedLayout>} />
        <Route path="admin/payments" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><AdminSectionPage section="payments" /></ProtectedLayout>} />
        <Route path="admin/reports" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><AdminSectionPage section="reports" /></ProtectedLayout>} />
        <Route path="admin/settings" element={<ProtectedLayout allowedRoles={adminAreaRoles} layoutRole="admin"><AdminSectionPage section="settings" /></ProtectedLayout>} />
        <Route path="admin/:section" element={<ProtectedRoute allowedRoles={adminAreaRoles}><ComingSoon role="admin" /></ProtectedRoute>} />
        <Route
          path="student"
          element={(
            <ProtectedLayout allowedRoles={studentRoles} layoutRole="student">
              <StudentDashboard />
            </ProtectedLayout>
          )}
        />
        <Route path="student/schedule" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentSchedule /></ProtectedLayout>} />
        <Route path="student/classes" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentClasses /></ProtectedLayout>} />
        <Route path="student/free-trial" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentFreeTrial /></ProtectedLayout>} />
        <Route path="student/attendance" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentAttendance /></ProtectedLayout>} />
        <Route path="student/homework" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentHomework /></ProtectedLayout>} />
        <Route path="student/progress" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentProgress /></ProtectedLayout>} />
        <Route path="student/messages" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentMessages /></ProtectedLayout>} />
        <Route path="student/payments" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentPayments /></ProtectedLayout>} />
        <Route path="student/profile" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentProfile /></ProtectedLayout>} />
        <Route path="student/settings" element={<ProtectedLayout allowedRoles={studentRoles} layoutRole="student"><StudentSettings /></ProtectedLayout>} />
        <Route path="student/:section" element={<ProtectedRoute allowedRoles={studentRoles}><ComingSoon role="student" /></ProtectedRoute>} />
        <Route
          path="teacher"
          element={(
            <ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher">
              <TeacherDashboard />
            </ProtectedLayout>
          )}
        />
        <Route path="teacher/students" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="students" /></ProtectedLayout>} />
        <Route path="teacher/students/:studentId" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><StudentRecordPage portalRole="teacher" /></ProtectedLayout>} />
        <Route path="teacher/free-trials" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="free-trials" /></ProtectedLayout>} />
        <Route path="teacher/schedule" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="classes" /></ProtectedLayout>} />
        <Route path="teacher/classes" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="classes" /></ProtectedLayout>} />
        <Route path="teacher/attendance" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="attendance" /></ProtectedLayout>} />
        <Route path="teacher/evaluations" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="evaluations" /></ProtectedLayout>} />
        <Route path="teacher/reports" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="reports" /></ProtectedLayout>} />
        <Route path="teacher/messages" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="messages" /></ProtectedLayout>} />
        <Route path="teacher/profile" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="profile" /></ProtectedLayout>} />
        <Route path="teacher/settings" element={<ProtectedLayout allowedRoles={teacherRoles} layoutRole="teacher"><TeacherSectionPage section="settings" /></ProtectedLayout>} />
        <Route path="teacher/:section" element={<ProtectedRoute allowedRoles={teacherRoles}><ComingSoon role="teacher" /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
