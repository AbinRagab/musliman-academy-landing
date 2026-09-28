import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import {
  AuthProvider,
  adminAreaRoles,
  getDashboardPath,
  studentRoles,
  teacherRoles,
  useAuth,
  type AuthRole,
} from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import { adminAreaAccess } from './auth/accessControl';
import DashboardLayout from './layouts/DashboardLayout';
import EmptyState from './components/EmptyState';
import ActionButton from './components/ActionButton';
import type { DashboardRole } from './types';
import { DashboardText, DashboardLanguageProvider, useDashboardLanguage } from './i18n/DashboardLanguageProvider';
import './styles/dashboard.css';
import './styles/dashboard-i18n.css';

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
  const { t } = useDashboardLanguage();
  return (
    <div className="dashboard-loading" role="status" aria-live="polite">
      {t('Loading dashboard section')}
    </div>
  );
}

function SectionUnavailable({ role }: { role: DashboardRole }) {
  return (
    <EmptyState
      title="Dashboard section unavailable"
      description={`This ${role} dashboard section is not enabled for the current configuration.`}
      action={
        <ActionButton variant="secondary" disabled>
          <DashboardText>Requires Database Setup</DashboardText>
        </ActionButton>
      }
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

function ProtectedPage({ allowedRoles, children }: { allowedRoles: AuthRole[]; children: ReactNode }) {
  return <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>;
}

export default function DashboardRoutes() {
  return (
    <DashboardLanguageProvider>
      <AuthProvider>
        <Suspense fallback={<DashboardPageFallback />}>
          <Routes>
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={[...adminAreaRoles, ...teacherRoles, ...studentRoles]}>
                  <DashboardIndex />
                </ProtectedRoute>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="admin" element={<ProtectedDashboardShell allowedRoles={adminAreaRoles} layoutRole="admin" />}>
              <Route
                index
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.dashboard]}>
                    <AdminDashboard />
                  </ProtectedPage>
                }
              />
              <Route
                path="accounts"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.accounts]}>
                    <AccountsRolesPage />
                  </ProtectedPage>
                }
              />
              <Route
                path="leads"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.leads]}>
                    <LeadsCRMPage />
                  </ProtectedPage>
                }
              />
              <Route
                path="students"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.students]}>
                    <AdminSectionPage section="students" />
                  </ProtectedPage>
                }
              />
              <Route
                path="students/:studentId"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.students]}>
                    <StudentRecordPage portalRole="admin" />
                  </ProtectedPage>
                }
              />
              <Route
                path="students/:studentId/payments"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.studentPayments]}>
                    <StudentRecordPage portalRole="admin" initialTab="payments" />
                  </ProtectedPage>
                }
              />
              <Route
                path="teachers"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.teachers]}>
                    <AdminSectionPage section="teachers" />
                  </ProtectedPage>
                }
              />
              <Route
                path="free-trials"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.freeTrials]}>
                    <AdminSectionPage section="free-trials" />
                  </ProtectedPage>
                }
              />
              <Route
                path="classes"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.classes]}>
                    <AdminSectionPage section="classes" />
                  </ProtectedPage>
                }
              />
              <Route
                path="attendance"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.attendance]}>
                    <AdminSectionPage section="attendance" />
                  </ProtectedPage>
                }
              />
              <Route
                path="compliance"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.compliance]}>
                    <AdminCompliancePage />
                  </ProtectedPage>
                }
              />
              <Route
                path="payments"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.payments]}>
                    <AdminSectionPage section="payments" />
                  </ProtectedPage>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.reports]}>
                    <AdminSectionPage section="reports" />
                  </ProtectedPage>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedPage allowedRoles={[...adminAreaAccess.settings]}>
                    <AdminSectionPage section="settings" />
                  </ProtectedPage>
                }
              />
              <Route path=":section" element={<SectionUnavailable role="admin" />} />
            </Route>
            <Route
              path="student"
              element={<ProtectedDashboardShell allowedRoles={studentRoles} layoutRole="student" />}
            >
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
            <Route
              path="teacher"
              element={<ProtectedDashboardShell allowedRoles={teacherRoles} layoutRole="teacher" />}
            >
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
    </DashboardLanguageProvider>
  );
}
