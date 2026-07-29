import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import SectionCard from '../components/SectionCard';
import {
  ComingSoonModal,
  StudentModal,
  StudentPageHeader,
} from '../components/student/StudentPortalComponents';
import { fetchStudentDashboardData, saveStudentSettings, studentPortalMock, type StudentSettings as StudentSettingsData } from '../services/studentService';

function SettingToggle({ label, description, enabled, name }: { label: string; description: string; enabled: boolean; name: string }) {
  return (
    <label className="student-setting-toggle">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input name={name} type="checkbox" defaultChecked={enabled} />
    </label>
  );
}

export default function StudentSettings() {
  const [settings, setSettings] = useState<StudentSettingsData>(studentPortalMock.settings);
  const [saved, setSaved] = useState(false);
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentDashboardData().then((data) => {
      setSettings({
        ...studentPortalMock.settings,
        displayName: data.profile.name,
        email: data.profile.parentEmail,
        whatsapp: data.profile.parentWhatsapp,
        timezone: data.profile.timezone,
      });
    });
  }, []);

  return (
    <div className="dashboard-page dashboard-page--management dashboard-page--student-settings">
      {saved && (
        <StudentModal title="Preferences Saved" description="Your editable student portal preferences were saved locally for this workflow." onClose={() => setSaved(false)} footer={<ActionButton onClick={() => setSaved(false)}>Close</ActionButton>}>
          <p className="student-modal-copy">Admin-managed academic, attendance, payment, and teacher assignment fields remain view-only.</p>
        </StudentModal>
      )}
      {comingSoon && <ComingSoonModal feature={comingSoon} onClose={() => setComingSoon(null)} />}

      <StudentPageHeader title="Settings" subtitle="Preferences, notifications, password, language, and timezone." />

      <form
        className="dashboard-grid dashboard-grid--two student-settings-layout"
        onSubmit={(event) => {
          event.preventDefault();
          saveStudentSettings(settings).then(() => setSaved(true));
        }}
      >
        <SectionCard title="Account Settings" subtitle="Contact changes are request-based if academy records need updating.">
          <div className="student-settings-fields">
            <label><span>Display name</span><input value={settings.displayName} onChange={(event) => setSettings((current) => ({ ...current, displayName: event.target.value }))} /></label>
            <label><span>Email</span><input value={settings.email} onChange={(event) => setSettings((current) => ({ ...current, email: event.target.value }))} /></label>
            <label><span>WhatsApp</span><input value={settings.whatsapp} onChange={(event) => setSettings((current) => ({ ...current, whatsapp: event.target.value }))} /></label>
            <div className="student-card-actions">
              <DashboardActionMenu
                primaryAction={{ label: 'Change Password', icon: <Icon name="lock" size={15} />, onClick: () => setComingSoon('Change Password') }}
                actions={[
                  { label: 'Request Contact Update', icon: <Icon name="send" size={15} />, onClick: () => setComingSoon('Request Contact Update') },
                ]}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Notification Preferences">
          <div className="student-settings-list">
            <SettingToggle name="classReminders" label="Class reminders" description="Send a reminder before each scheduled class." enabled={settings.notifications.classReminders} />
            <SettingToggle name="homeworkReminders" label="Homework reminders" description="Notify when homework is due or reviewed." enabled={settings.notifications.homeworkReminders} />
            <SettingToggle name="paymentReminders" label="Payment reminders" description="Notify before package renewal or due dates." enabled={settings.notifications.paymentReminders} />
            <SettingToggle name="progressReports" label="Progress report notifications" description="Send updates when teacher feedback is available." enabled={settings.notifications.progressReports} />
            <SettingToggle name="whatsappNotifications" label="WhatsApp notifications" description="Use WhatsApp as the primary reminder channel." enabled={settings.notifications.whatsappNotifications} />
            <SettingToggle name="emailNotifications" label="Email notifications" description="Send copies of important portal messages by email." enabled={settings.notifications.emailNotifications} />
          </div>
        </SectionCard>

        <SectionCard title="Learning Preferences">
          <div className="student-settings-fields">
            <label><span>Preferred class time</span><select value={settings.preferredClassTime} onChange={(event) => setSettings((current) => ({ ...current, preferredClassTime: event.target.value }))}><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
            <label><span>Preferred language</span><select value={settings.preferredLanguage} onChange={(event) => setSettings((current) => ({ ...current, preferredLanguage: event.target.value }))}><option>English with Arabic terms</option><option>Arabic</option><option>English</option><option>Urdu</option></select></label>
            <label><span>Timezone</span><select value={settings.timezone} onChange={(event) => setSettings((current) => ({ ...current, timezone: event.target.value }))}><option>Africa/Cairo</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Dubai</option></select></label>
          </div>
        </SectionCard>

        <SectionCard title="Parent Communication">
          <div className="student-settings-list">
            <SettingToggle name="parentClassReminders" label="Send class reminders to parent" description="Parent receives scheduled class reminders." enabled={settings.parentCommunication.parentClassReminders} />
            <SettingToggle name="parentAbsenceAlerts" label="Send absence alerts" description="Parent receives absence and late alerts." enabled={settings.parentCommunication.parentAbsenceAlerts} />
            <SettingToggle name="parentProgressReports" label="Send progress reports to parent" description="Parent receives progress summaries." enabled={settings.parentCommunication.parentProgressReports} />
          </div>
        </SectionCard>

        <SectionCard title="Privacy & Security">
          <div className="student-security-list">
            <button type="button" onClick={() => setComingSoon('Change Password')}><Icon name="lock" size={17} /><span>Change password</span><Icon name="chevronRight" size={16} /></button>
            <button type="button" onClick={() => setComingSoon('Active Sessions')}><Icon name="laptop" size={17} /><span>Active sessions</span><Icon name="chevronRight" size={16} /></button>
            <button type="button" onClick={() => setComingSoon('Two-Factor Authentication')}><Icon name="shieldCheck" size={17} /><span>Two-factor authentication</span><Icon name="chevronRight" size={16} /></button>
          </div>
        </SectionCard>

        <div className="dashboard-form-actions student-settings-actions">
          <ActionButton type="submit" variant="copper"><Icon name="check" size={16} />Save Preferences</ActionButton>
        </div>
      </form>
    </div>
  );
}
