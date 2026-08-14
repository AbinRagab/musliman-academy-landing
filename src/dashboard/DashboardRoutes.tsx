import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { AuthProvider, accountsRoles, adminAreaRoles, getDashboardPath, studentRoles, teacherRoles, useAuth, type AuthRole } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import EmptyState from './components/EmptyState';
import ActionButton from './components/ActionButton';
import type { DashboardRole } from './data/mockData';
import './styles/dashboard.css';

const AccountsRolesPage = lazy(() => import('./admin/AccountsRolesPage'));
const AdminCompliancePage = lazy(() => import('./admin/AdminCompliancePage'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminSectionPage = lazy(() => import('./admin/AdminSectionPage'));
const LeadsCRMPage = lazy(() => import('./admin/LeadsCRMPage'));
const LoginPage = lazy(() => import('./auth/pages/LoginPage'));
const StudentAttendance = lazy(() => import('./student/StudentAttendance'));
const StudentClasses = lazy(() => import('./student/StudentClasses'));
const StudentDashboard = lazy(() => import('./student/StudentDashboard'));
const StudentFreeTrial = lazy(() => import('./student/StudentFreeTrial'));
const StudentHomework = lazy(() => import('./student/StudentHomework'));
const StudentMessages = lazy(() => import('./student/StudentMessages'));
const StudentPayments = lazy(() => import('./student/StudentPayments'));
const StudentProfile = lazy(() => import('./student/StudentProfile'));
const StudentProgress = lazy(() => import('./student/StudentProgress'));
const StudentRecordPage = lazy(() => import('./student/StudentRecordPage'));
const StudentSchedule = lazy(() => import('./student/StudentSchedule'));
const StudentSettings = lazy(() => import('./student/StudentSettings'));
const TeacherDashboard = lazy(() => import('./teacher/TeacherDashboard'));
const TeacherSectionPage = lazy(() => import('./teacher/TeacherSectionPage'));

function DashboardPageFallback() {
  return (
    <div className="dashboard-loading" role="status" aria-live="polite">
      Loading dashboard section
    </div>
  );
}

function SectionUnavailable({ role }: { role: DashboardRole }) {
  return (
    <EmptyState
      title="Dashboard section unavailable"
      description={`This ${role} dashboard section is not enabled for the current configuration.`}
      action={<ActionButton variant="secondary" disabled>Requires Database Setup</ActionButton>}
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
      <Suspense fallback={<DashboardPageFallback />}>
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
            <Route path=":section" element={<SectionUnavailable role="admin" />} />
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
            <Route path=":section" element={<SectionUnavailable role="student" />} />
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
            <Route path=":section" element={<SectionUnavailable role="teacher" />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
