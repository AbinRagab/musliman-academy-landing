import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import { getDashboardPath, useAuth } from '../auth/AuthProvider';
import SupabaseSetupPage from './SupabaseSetupPage';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const { signIn, user, role, loading, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const state = location.state as LocationState | null;

  if (!isConfigured) {
    return <SupabaseSetupPage />;
  }

  if (!loading && user && role) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await signIn(email, password);
      const requestedPath = state?.from?.pathname;
      const redirectTo = requestedPath && requestedPath !== '/dashboard/login'
        ? requestedPath
        : result.redirectTo;
      navigate(redirectTo, { replace: true });
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Unable to sign in. Check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="dashboard-login-screen">
      <div className="dashboard-login-pattern" aria-hidden="true" />
      <section className="dashboard-login-card" aria-labelledby="dashboard-login-title">
        <img src="/assets/musliman-logo-light-bg-transparent.png" alt="Musliman Academy" />
        <span className="dashboard-eyebrow">Secure Academy Access</span>
        <h1 id="dashboard-login-title">Sign in to your dashboard</h1>
        <p>Use your Musliman Academy account to access role-based student, teacher, and admin tools.</p>

        <form className="dashboard-form dashboard-login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="dashboard-auth-error" role="alert">
              <Icon name="shieldCheck" size={18} />
              <span>{error}</span>
            </div>
          )}

          <ActionButton type="submit" disabled={submitting}>
            {submitting ? 'Signing in' : 'Sign in'}
          </ActionButton>
        </form>

        <button className="dashboard-forgot-link" type="button">
          Forgot password?
        </button>
      </section>
    </main>
  );
}
