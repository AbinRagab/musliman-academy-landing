import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from '../landing/LandingPage';

const DashboardRoutes = lazy(() => import('../dashboard/DashboardRoutes'));

function DashboardLoadingFallback() {
  return (
    <div className="dashboard-auth-screen" role="status" aria-live="polite">
      <div className="dashboard-auth-card dashboard-auth-card--compact">
        <img src="/assets/musliman-logo-light-bg-transparent.png" alt="Musliman Academy" />
        <h1>Loading dashboard</h1>
        <p>Preparing your academy workspace.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard/*"
          element={(
            <Suspense fallback={<DashboardLoadingFallback />}>
              <DashboardRoutes />
            </Suspense>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
