import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { getDashboardPath, useAuth } from '../AuthProvider';
import ActionButton from '../../components/ActionButton';
import { DashboardText } from '../../i18n/DashboardLanguageProvider';

export default function AccessDeniedPage() {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard-auth-screen">
      <section className="dashboard-auth-card">
        <div className="dashboard-empty__icon">
          <Icon name="shieldCheck" />
        </div>
        <h1><DashboardText>Access Restricted</DashboardText></h1>
        <p><DashboardText>You do not have permission to access this area.</DashboardText></p>
        <ActionButton onClick={() => navigate(getDashboardPath(role))}>
          <DashboardText>Go to my dashboard</DashboardText>
        </ActionButton>
      </section>
    </div>
  );
}
