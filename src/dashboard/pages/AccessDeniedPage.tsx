import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { getDashboardPath, useAuth } from '../auth/AuthProvider';
import ActionButton from '../components/ActionButton';

export default function AccessDeniedPage() {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard-auth-screen">
      <section className="dashboard-auth-card">
        <div className="dashboard-empty__icon">
          <Icon name="shieldCheck" />
        </div>
        <h1>Access Restricted</h1>
        <p>You do not have permission to access this area.</p>
        <ActionButton onClick={() => navigate(getDashboardPath(role))}>
          Go to my dashboard
        </ActionButton>
      </section>
    </div>
  );
}
