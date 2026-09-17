import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from '../landing/LandingPage';
import { applyPageSeo } from '../landing/seo';

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

function DashboardApp() {
  useEffect(() => {
    applyPageSeo({
      title: 'Dashboard | Musliman Academy',
      description: 'Secure Musliman Academy dashboard.',
      canonical: 'https://www.muslimanacademy.com/dashboard/',
      robots: 'noindex, nofollow, noarchive',
    });
  }, []);

  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardRoutes />
    </Suspense>
  );
}

function NotFoundPage() {
  useEffect(() => {
    applyPageSeo({
      title: 'Page Not Found | Musliman Academy',
      description: 'The requested page could not be found.',
      canonical: window.location.href,
      robots: 'noindex, nofollow',
    });
  }, []);

  return (
    <main className="route-not-found">
      <img src="/assets/musliman-logo-light-bg-transparent.png" alt="Musliman Academy" />
      <p className="route-not-found__code">404</p>
      <h1>Page not found</h1>
      <p>The page you requested does not exist or may have moved.</p>
      <a href="/">Return to Musliman Academy</a>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard/*" element={<DashboardApp />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
