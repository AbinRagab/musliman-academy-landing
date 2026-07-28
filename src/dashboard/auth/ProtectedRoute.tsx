import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import ActionButton from '../components/ActionButton';
import AccessDeniedPage from '../pages/AccessDeniedPage';
import SupabaseSetupPage from '../pages/SupabaseSetupPage';
import { useAuth, type AuthRole } from './AuthProvider';

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
          <h1>Loading dashboard</h1>
          <p>Checking your academy account and permissions.</p>
          <ActionButton disabled>Loading</ActionButton>
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
