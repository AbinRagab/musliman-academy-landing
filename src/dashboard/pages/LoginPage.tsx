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
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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
      <section className="dashboard-login-brand-panel" aria-label="Musliman Academy dashboard access">
        <div className="dashboard-login-pattern" aria-hidden="true" />
        <div className="dashboard-login-brand-panel__content">
          <img src="/assets/musliman-logo-dark-bg-transparent.png" alt="Musliman Academy" />
          <div className="dashboard-login-welcome">
            <span>Welcome Back,</span>
            <h1>Admin</h1>
            <p>Sign in to your Musliman Academy dashboard to manage leads, students, payments, classes and grow our community.</p>
          </div>
          <div className="dashboard-login-features">
            {[
              ['users', 'Leads', 'Track and manage new leads'],
              ['graduationCap', 'Students', 'Manage enrollments and progress'],
              ['document', 'Payments', 'Monitor transactions and invoices'],
              ['chart', 'Reports', 'Insights to help you make better decisions'],
            ].map(([icon, title, description]) => (
              <article key={title} className="dashboard-login-feature">
                <span><Icon name={icon} size={20} /></span>
                <div>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-login-form-panel" aria-labelledby="dashboard-login-title">
        <div className="dashboard-login-form-panel__pattern" aria-hidden="true" />
        <div className="dashboard-login-language">
          <Icon name="globe" size={16} />
          <select aria-label="Language" defaultValue="en">
            <option value="en">English</option>
          </select>
        </div>

        <section className="dashboard-login-card">
          <img className="dashboard-login-card__mobile-logo" src="/assets/musliman-logo-light-bg-transparent.png" alt="Musliman Academy" />
          <span className="dashboard-eyebrow">Secure Academy Access</span>
          <h1 id="dashboard-login-title">Sign In</h1>
          <p>Enter your credentials to access your dashboard</p>

          <form className="dashboard-form dashboard-login-form" onSubmit={handleSubmit}>
            <label className="dashboard-login-field">
              <span>Email</span>
              <div className="dashboard-login-input">
                <Icon name="mail" size={19} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>
            <label className="dashboard-login-field">
              <span>Password</span>
              <div className="dashboard-login-input">
                <Icon name="lock" size={19} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)}>
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </label>

            <div className="dashboard-login-options">
              <label>
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                <span>Remember me</span>
              </label>
              <button className="dashboard-forgot-link" type="button">
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="dashboard-auth-error" role="alert">
                <Icon name="shieldCheck" size={18} />
                <span>{error}</span>
              </div>
            )}

            <ActionButton className="dashboard-login-submit" type="submit" variant="copper" disabled={submitting}>
              <Icon name="shieldCheck" size={18} />
              {submitting ? 'Signing in' : 'Sign In'}
            </ActionButton>
          </form>

          <div className="dashboard-login-divider"><span>or</span></div>
          <p className="dashboard-login-admin-note">Need access? <button type="button">Contact Admin</button></p>
        </section>

        <p className="dashboard-login-security"><Icon name="shieldCheck" size={16} /> Secure login&nbsp; Your data is protected</p>
      </section>
    </main>
  );
}
