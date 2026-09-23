import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { supabase } from '../../lib/supabaseClient';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import SectionCard from '../components/SectionCard';
import {
  StudentModal,
  StudentPageHeader,
} from '../components/student/StudentPortalComponents';
import {
  emptyStudentSettings,
  fetchStudentDashboardData,
  requestStudentSupportUpdate,
  saveStudentSettings,
  type StudentSettings as StudentSettingsData,
} from '../services/studentService';
import { DashboardText } from '../i18n/DashboardLanguageProvider';

function SettingToggle({ label, description, enabled, name, onChange }: { label: string; description: string; enabled: boolean; name: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="student-setting-toggle">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input name={name} type="checkbox" checked={enabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export default function StudentSettings() {
  const [settings, setSettings] = useState<StudentSettingsData>(emptyStudentSettings);
  const [saved, setSaved] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudentDashboardData().then((data) => {
      setSettings({
        ...emptyStudentSettings,
        displayName: data.profile.name,
        email: data.profile.parentEmail,
        whatsapp: data.profile.parentWhatsapp,
        timezone: data.profile.timezone,
      });
    });
  }, []);

  async function handlePasswordReset() {
    if (!supabase || !settings.email) {
      setSecurityMessage('A profile email is required before a password reset email can be sent.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(settings.email, {
      redirectTo: `${window.location.origin}/dashboard/login`,
    });

    setSecurityMessage(error ? error.message : `Password reset email sent to ${settings.email}.`);
  }

  return (
    <div className="dashboard-page dashboard-page--management dashboard-page--student-settings">
      {saved && (
        <StudentModal title="Preferences Saved" description="Your editable student portal preferences were saved." onClose={() => setSaved(false)} footer={<ActionButton onClick={() => setSaved(false)}><DashboardText>Close</DashboardText></ActionButton>}>
          <p className="student-modal-copy"><DashboardText>Admin-managed academic, attendance, payment, and teacher assignment fields remain view-only.</DashboardText></p>
        </StudentModal>
      )}
      {securityMessage && (
        <StudentModal title="Security Action" onClose={() => setSecurityMessage('')} footer={<ActionButton onClick={() => setSecurityMessage('')}><DashboardText>Close</DashboardText></ActionButton>}>
          <p className="student-modal-copy">{securityMessage}</p>
        </StudentModal>
      )}

      <StudentPageHeader title="Settings" subtitle="Preferences, notifications, password, language, and timezone." />

      <form
        className="dashboard-grid dashboard-grid--two student-settings-layout"
        onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          saveStudentSettings(settings)
            .then(() => setSaved(true))
            .catch((error) => setSecurityMessage(error instanceof Error ? error.message : 'Unable to save preferences.'))
            .finally(() => setSaving(false));
        }}
      >
        <SectionCard title="Account Settings" subtitle="Contact changes are request-based if academy records need updating.">
          <div className="student-settings-fields">
            <label><span><DashboardText>Display name</DashboardText></span><input value={settings.displayName} onChange={(event) => setSettings((current) => ({ ...current, displayName: event.target.value }))} /></label>
            <label><span><DashboardText>Email</DashboardText></span><input value={settings.email} onChange={(event) => setSettings((current) => ({ ...current, email: event.target.value }))} /></label>
            <label><span><DashboardText>WhatsApp</DashboardText></span><input value={settings.whatsapp} onChange={(event) => setSettings((current) => ({ ...current, whatsapp: event.target.value }))} /></label>
            <div className="student-card-actions">
              <DashboardActionMenu
                primaryAction={{ label: 'Change Password', icon: <Icon name="lock" size={15} />, onClick: handlePasswordReset }}
                actions={[
                  {
                    label: 'Request Contact Update',
                    icon: <Icon name="send" size={15} />,
                    onClick: async () => {
                      try {
                        await requestStudentSupportUpdate({
                          subject: 'Student contact update request',
                          message: `Please review contact details.\nEmail: ${settings.email}\nWhatsApp: ${settings.whatsapp}`,
                        });
                        setSecurityMessage('Contact update request sent to the academy team.');
                      } catch (error) {
                        setSecurityMessage(error instanceof Error ? error.message : 'Unable to send contact update request.');
                      }
                    },
                  },
                ]}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notification Preferences">
          <div className="student-settings-list">
            <SettingToggle name="classReminders" label="Class reminders" description="Send a reminder before each scheduled class." enabled={settings.notifications.classReminders} onChange={(checked) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, classReminders: checked } }))} />
            <SettingToggle name="homeworkReminders" label="Homework reminders" description="Notify when homework is due or reviewed." enabled={settings.notifications.homeworkReminders} onChange={(checked) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, homeworkReminders: checked } }))} />
            <SettingToggle name="paymentReminders" label="Payment reminders" description="Notify before package renewal or due dates." enabled={settings.notifications.paymentReminders} onChange={(checked) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, paymentReminders: checked } }))} />
            <SettingToggle name="progressReports" label="Progress report notifications" description="Send updates when teacher feedback is available." enabled={settings.notifications.progressReports} onChange={(checked) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, progressReports: checked } }))} />
            <SettingToggle name="whatsappNotifications" label="WhatsApp notifications" description="Use WhatsApp as the primary reminder channel." enabled={settings.notifications.whatsappNotifications} onChange={(checked) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, whatsappNotifications: checked } }))} />
            <SettingToggle name="emailNotifications" label="Email notifications" description="Send copies of important portal messages by email." enabled={settings.notifications.emailNotifications} onChange={(checked) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, emailNotifications: checked } }))} />
          </div>
        </SectionCard>

        <SectionCard title="Learning Preferences">
          <div className="student-settings-fields">
            <label><span><DashboardText>Preferred class time</DashboardText></span><select value={settings.preferredClassTime} onChange={(event) => setSettings((current) => ({ ...current, preferredClassTime: event.target.value }))}><option><DashboardText>Morning</DashboardText></option><option><DashboardText>Afternoon</DashboardText></option><option><DashboardText>Evening</DashboardText></option></select></label>
            <label><span><DashboardText>Preferred language</DashboardText></span><select value={settings.preferredLanguage} onChange={(event) => setSettings((current) => ({ ...current, preferredLanguage: event.target.value }))}><option><DashboardText>English with Arabic terms</DashboardText></option><option><DashboardText>Arabic</DashboardText></option><option><DashboardText>English</DashboardText></option><option><DashboardText>Urdu</DashboardText></option></select></label>
            <label><span><DashboardText>Timezone</DashboardText></span><select value={settings.timezone} onChange={(event) => setSettings((current) => ({ ...current, timezone: event.target.value }))}><option><DashboardText>Africa/Cairo</DashboardText></option><option><DashboardText>Europe/London</DashboardText></option><option><DashboardText>America/New_York</DashboardText></option><option><DashboardText>Asia/Dubai</DashboardText></option></select></label>
          </div>
        </SectionCard>

        <SectionCard title="Parent Communication">
          <div className="student-settings-list">
            <SettingToggle name="parentClassReminders" label="Send class reminders to parent" description="Parent receives scheduled class reminders." enabled={settings.parentCommunication.parentClassReminders} onChange={(checked) => setSettings((current) => ({ ...current, parentCommunication: { ...current.parentCommunication, parentClassReminders: checked } }))} />
            <SettingToggle name="parentAbsenceAlerts" label="Send absence alerts" description="Parent receives absence and late alerts." enabled={settings.parentCommunication.parentAbsenceAlerts} onChange={(checked) => setSettings((current) => ({ ...current, parentCommunication: { ...current.parentCommunication, parentAbsenceAlerts: checked } }))} />
            <SettingToggle name="parentProgressReports" label="Send progress reports to parent" description="Parent receives progress summaries." enabled={settings.parentCommunication.parentProgressReports} onChange={(checked) => setSettings((current) => ({ ...current, parentCommunication: { ...current.parentCommunication, parentProgressReports: checked } }))} />
          </div>
        </SectionCard>

        <SectionCard title="Privacy & Security">
          <div className="student-security-list">
            <button type="button" onClick={handlePasswordReset}><Icon name="lock" size={17} /><span><DashboardText>Change password</DashboardText></span><Icon name="chevronRight" size={16} /></button>
            <button type="button" disabled title="This feature requires database setup."><Icon name="laptop" size={17} /><span><DashboardText>Active sessions require setup</DashboardText></span><Icon name="chevronRight" size={16} /></button>
            <button type="button" disabled title="This feature requires database setup."><Icon name="shieldCheck" size={17} /><span><DashboardText>Two-factor authentication requires setup</DashboardText></span><Icon name="chevronRight" size={16} /></button>
          </div>
        </SectionCard>

        <div className="dashboard-form-actions student-settings-actions">
          <ActionButton type="submit" variant="copper" disabled={saving}><Icon name="check" size={16} />{saving ? 'Saving...' : 'Save Preferences'}</ActionButton>
        </div>
      </form>
    </div>
  );
}
