import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import ActionButton from '../components/ActionButton';
import AccessDeniedPage from './pages/AccessDeniedPage';
import SupabaseSetupPage from './pages/SupabaseSetupPage';
import { useAuth, type AuthRole } from './AuthProvider';
import { DashboardText } from '../i18n/DashboardLanguageProvider';

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: AuthRole[];
  children: ReactNode;
}) {
  const { user, role, isReady, isConfigured } = useAuth();
  const location = useLocation();

  if (!isConfigured) {
    return <SupabaseSetupPage />;
  }

  if (!isReady) {
    return (
      <div className="dashboard-auth-screen">
        <div className="dashboard-auth-card dashboard-auth-card--compact">
          <img src="/assets/musliman-logo-light-bg-transparent.png" alt="Musliman Academy" />
          <h1><DashboardText>Loading dashboard</DashboardText></h1>
          <p><DashboardText>Checking your academy account and permissions.</DashboardText></p>
          <ActionButton disabled><DashboardText>Loading</DashboardText></ActionButton>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/dashboard/login" replace state={{ from: location }} />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <AccessDeniedPage />;
  }

  return children;
}
