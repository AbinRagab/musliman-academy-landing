import Icon from '../../components/Icon';
import { supabaseConfigMessage } from '../../lib/supabaseClient';

export default function SupabaseSetupPage() {
  return (
    <main className="dashboard-auth-screen">
      <section className="dashboard-auth-card">
        <div className="dashboard-empty__icon">
          <Icon name="shieldCheck" />
        </div>
        <h1>Supabase setup required</h1>
        <p>{supabaseConfigMessage}</p>
        <div className="dashboard-env-list">
          <code>VITE_SUPABASE_URL</code>
          <code>VITE_SUPABASE_ANON_KEY</code>
        </div>
      </section>
    </main>
  );
}
