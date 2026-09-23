import Icon from '../../../components/Icon';
import { supabaseConfigMessage } from '../../../lib/supabaseClient';
import { DashboardText } from '../../i18n/DashboardLanguageProvider';

export default function SupabaseSetupPage() {
  return (
    <main className="dashboard-auth-screen">
      <section className="dashboard-auth-card">
        <div className="dashboard-empty__icon">
          <Icon name="shieldCheck" />
        </div>
        <h1><DashboardText>Supabase setup required</DashboardText></h1>
        <p>{supabaseConfigMessage}</p>
        <div className="dashboard-env-list">
          <code><DashboardText>VITE_SUPABASE_URL</DashboardText></code>
          <code><DashboardText>VITE_SUPABASE_ANON_KEY</DashboardText></code>
        </div>
      </section>
    </main>
  );
}
