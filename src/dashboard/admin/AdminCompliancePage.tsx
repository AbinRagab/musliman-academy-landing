import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import DashboardDrawer from '../components/DashboardDrawer';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { type ToastMessage } from '../components/Toast';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';
import {
  fetchComplianceDashboardData,
  runTeacherComplianceCheck,
  saveComplianceRule,
  saveNotificationTemplate,
  sendTestNotification,
  updateWarningStatus,
  type ComplianceCheckinRow,
  type ComplianceDashboardData,
  type ComplianceRuleRow,
  type NotificationLogRow,
  type NotificationTemplateRow,
  type TeacherWarningRow,
} from '../services/adminComplianceService';

const tabs = ['Today Monitoring', 'Teacher Warnings', 'Compliance Rules', 'Notification Templates', 'Notification Logs'] as const;
type ComplianceTab = (typeof tabs)[number];

export default function AdminCompliancePage() {
  const { t } = useDashboardLanguage();
  const [data, setData] = useState<ComplianceDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<ComplianceTab>('Today Monitoring');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedCheckin, setSelectedCheckin] = useState<ComplianceCheckinRow | null>(null);
  const [selectedWarning, setSelectedWarning] = useState<TeacherWarningRow | null>(null);
  const [editingRule, setEditingRule] = useState<ComplianceRuleRow | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const nextData = await fetchComplianceDashboardData();
      setData(nextData);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t('Unable to load compliance data.'));
      setData({
        checkins: [],
        warnings: [],
        rules: [],
        templates: [],
        logs: [],
        providerStatus: { emailConfigured: false, whatsappConfigured: false },
      });
    }
  }

  function notify(message: string, type: ToastMessage['type'] = 'info') {
    setToast({ type, message });
  }

  const stats = useMemo(() => {
    const source = data;
    return [
      { label: 'Classes Monitored', value: source?.checkins.length || 0, trend: 'Today and recent sessions', icon: 'calendar' },
      { label: 'Teacher Warnings', value: source?.warnings.length || 0, trend: 'Current review queue', icon: 'shieldCheck' },
      { label: 'Active Rules', value: source?.rules.filter((rule) => rule.isActive).length || 0, trend: 'Compliance settings', icon: 'settings' },
      { label: 'Notification Logs', value: source?.logs.length || 0, trend: 'Latest delivery events', icon: 'bell' },
    ];
  }, [data]);

  if (!data) {
    return (
      <div className="dashboard-page dashboard-page--management">
        <DashboardPageHeader eyebrow="COMPLIANCE" title="Teacher Compliance" subtitle="Loading notification rules, check-ins, warnings, and logs." />
        <DashboardSkeleton cards={4} rows={7} />
      </div>
    );
  }

  const checkinColumns: Array<DataTableColumn<ComplianceCheckinRow>> = [
    { header: 'Class', accessor: 'className' },
    { header: 'Teacher', accessor: 'teacher' },
    { header: 'Student', accessor: 'student' },
    { header: 'Scheduled Time', accessor: 'scheduledTime' },
    { header: 'Teacher Ready', accessor: (row) => <StatusBadge label={row.teacherReady} /> },
    { header: 'Joined', accessor: (row) => <StatusBadge label={row.joined} /> },
    { header: 'Started', accessor: (row) => <StatusBadge label={row.started} /> },
    { header: 'Ended', accessor: (row) => <StatusBadge label={row.ended} /> },
    { header: 'Attendance', accessor: (row) => <StatusBadge label={row.attendanceSubmitted} /> },
    { header: 'Report', accessor: (row) => <StatusBadge label={row.reportSubmitted} /> },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <DashboardActionMenu
          primaryAction={{ label: 'View Logs', onClick: () => setSelectedCheckin(row) }}
          actions={[
            { label: 'Run Compliance Check', onClick: async () => { await runTeacherComplianceCheck(); notify(t('Compliance check completed.'), 'success'); await loadData(); } },
            { label: 'Contact Teacher requires messaging recipient', onClick: () => null, disabled: true },
            { label: 'Create Warning requires warning form setup', onClick: () => null, disabled: true },
            { label: 'Mark Excused requires linked warning', onClick: () => null, disabled: true },
          ]}
        />
      ),
    },
  ];

  const warningColumns: Array<DataTableColumn<TeacherWarningRow>> = [
    { header: 'Teacher', accessor: 'teacher' },
    { header: 'Warning Type', accessor: 'warningType' },
    { header: 'Class', accessor: 'className' },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Date', accessor: 'date' },
    { header: 'Severity', accessor: (row) => <StatusBadge label={row.severity} /> },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <DashboardActionMenu
          primaryAction={{ label: 'View Warning', onClick: () => setSelectedWarning(row) }}
          actions={[
            { label: 'Approve Warning', onClick: () => handleWarning(row, 'approved') },
            { label: 'Mark Excused', onClick: () => handleWarning(row, 'excused') },
            { label: 'Resolve', onClick: () => handleWarning(row, 'resolved') },
            { label: 'Cancel Warning', onClick: () => handleWarning(row, 'cancelled'), danger: true },
          ]}
        />
      ),
    },
  ];

  const ruleColumns: Array<DataTableColumn<ComplianceRuleRow>> = [
    { header: 'Rule', accessor: 'ruleName' },
    { header: 'Grace', accessor: (row) => `${row.lateGraceMinutes} min` },
    { header: 'No-show', accessor: (row) => `${row.noShowAfterMinutes} min` },
    { header: 'Max Warnings', accessor: 'maxWarnings' },
    { header: 'Period', accessor: (row) => `${row.periodDays} days` },
    { header: 'Action', accessor: 'actionAfterLimit' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.isActive ? 'active' : 'inactive'} /> },
    { header: 'Actions', accessor: (row) => <ActionButton variant="ghost" onClick={() => setEditingRule(row)}>Edit Rule</ActionButton> },
  ];

  const templateColumns: Array<DataTableColumn<NotificationTemplateRow>> = [
    { header: 'Template', accessor: 'templateKey' },
    { header: 'Channel', accessor: 'channel' },
    { header: 'Title', accessor: 'title' },
    { header: 'WhatsApp Template', accessor: (row) => row.whatsappTemplateName || '-' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.isActive ? 'active' : 'inactive'} /> },
    { header: 'Actions', accessor: (row) => <ActionButton variant="ghost" onClick={() => setEditingTemplate(row)}>Edit Template</ActionButton> },
  ];

  const logColumns: Array<DataTableColumn<NotificationLogRow>> = [
    { header: 'Recipient', accessor: 'recipient' },
    { header: 'Channel', accessor: 'channel' },
    { header: 'Template', accessor: 'templateKey' },
    { header: 'Provider', accessor: 'provider' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    { header: 'Error', accessor: 'errorMessage' },
    { header: 'Sent At', accessor: 'sentAt' },
  ];

  async function handleWarning(row: TeacherWarningRow, status: string) {
    await updateWarningStatus(row.id, status, `Admin marked warning ${status}.`);
    notify(t('Warning marked {{status}}.', { status: t(status) }), 'success');
    await loadData();
  }

  return (
    <div className="dashboard-page dashboard-page--management">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardPageHeader
        eyebrow="COMPLIANCE"
        title="Teacher Compliance"
        subtitle="Class reminders, teacher check-ins, warnings, notification templates, and delivery logs."
        action={(
          <div className="dashboard-page-actions">
            <ActionButton variant="secondary" onClick={async () => { await runTeacherComplianceCheck(); notify(t('Compliance check completed.'), 'success'); await loadData(); }}>
              <Icon name="shieldCheck" size={17} />
              Run Compliance Check
            </ActionButton>
            <ActionButton variant="copper" onClick={async () => { await sendTestNotification('in_app'); notify(t('Test in-app notification sent.'), 'success'); await loadData(); }}>
              <Icon name="bell" size={17} />
              Send Test Notification
            </ActionButton>
          </div>
        )}
      />

      <div className="dashboard-stats-grid">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <SectionCard title="Provider Status" subtitle="Secrets are checked server-side only; values are never exposed.">
        {loadError && <p className="dashboard-inline-error">{loadError}</p>}
        <div className="student-info-grid">
          <span>{t('In-app notifications')} <strong><StatusBadge label="configured" /></strong></span>
          <span>{t('Email provider')} <strong><StatusBadge label={data.providerStatus.emailConfigured ? 'configured' : 'missing secrets'} /></strong></span>
          <span>{t('WhatsApp provider')} <strong><StatusBadge label={data.providerStatus.whatsappConfigured ? 'configured' : 'missing secrets'} /></strong></span>
          <span>{t('Default cron cadence')} <strong>{t('Every 5 minutes')}</strong></span>
        </div>
        <div className="dashboard-form-actions">
          <ActionButton variant="secondary" onClick={async () => { await sendTestNotification('email'); notify(t('Email test queued. Check logs for provider result.'), 'success'); await loadData(); }}>Test Email</ActionButton>
          <ActionButton variant="secondary" onClick={async () => { await sendTestNotification('whatsapp'); notify(t('WhatsApp test queued. Check logs for provider result.'), 'success'); await loadData(); }}>Test WhatsApp</ActionButton>
        </div>
      </SectionCard>

      <div className="admin-tabs admin-tabs--settings" role="tablist" aria-label={t('Compliance sections')}>
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? 'is-active' : ''} type="button" onClick={() => setActiveTab(tab)}>
            {t(tab)}
          </button>
        ))}
      </div>

      {activeTab === 'Today Monitoring' && (
        <SectionCard title="Today's Class Monitoring" subtitle="Teacher readiness, join status, attendance, class reports, and actions.">
          <DataTable columns={checkinColumns} rows={data.checkins} getRowKey={(row) => row.id} />
        </SectionCard>
      )}

      {activeTab === 'Teacher Warnings' && (
        <SectionCard title="Teacher Warnings" subtitle="Admin-reviewed warning records and escalation actions.">
          <DataTable columns={warningColumns} rows={data.warnings} getRowKey={(row) => row.id} />
        </SectionCard>
      )}

      {activeTab === 'Compliance Rules' && (
        <SectionCard title="Compliance Rules" subtitle="Configure grace periods, warning limits, and escalation actions.">
          <DataTable columns={ruleColumns} rows={data.rules} getRowKey={(row) => row.id} />
        </SectionCard>
      )}

      {activeTab === 'Notification Templates' && (
        <SectionCard title="Notification Templates" subtitle="Edit in-app, email, and WhatsApp template content and names.">
          <DataTable columns={templateColumns} rows={data.templates} getRowKey={(row) => row.id} />
        </SectionCard>
      )}

      {activeTab === 'Notification Logs' && (
        <SectionCard title="Notification Logs" subtitle="Provider response, delivery status, and error messages.">
          <DataTable columns={logColumns} rows={data.logs} getRowKey={(row) => row.id} />
        </SectionCard>
      )}

      {selectedCheckin && (
        <DashboardDrawer
          eyebrow="CLASS MONITORING"
          title={selectedCheckin.className}
          subtitle="Readiness, join, attendance, report, and notification history."
          onClose={() => setSelectedCheckin(null)}
          sections={[
            {
              title: 'Session Status',
              children: (
                <div className="lead-summary-grid">
                  <span>{t('Teacher')}<strong>{selectedCheckin.teacher}</strong></span>
                  <span>{t('Student')}<strong>{selectedCheckin.student}</strong></span>
                  <span>{t('Scheduled time')}<strong>{selectedCheckin.scheduledTime}</strong></span>
                  <span>{t('Ready')}<strong><StatusBadge label={selectedCheckin.teacherReady} /></strong></span>
                  <span>{t('Joined')}<strong><StatusBadge label={selectedCheckin.joined} /></strong></span>
                  <span>{t('Status')}<strong><StatusBadge label={selectedCheckin.status} /></strong></span>
                </div>
              ),
            },
          ]}
          actions={[
            { label: 'Run Compliance Check', icon: 'bell', variant: 'copper', onClick: async () => { await runTeacherComplianceCheck(); notify(t('Compliance check completed.'), 'success'); await loadData(); } },
            { label: 'Open Class Details', icon: 'calendar', onClick: () => window.location.assign('/dashboard/admin/classes') },
          ]}
        />
      )}

      {selectedWarning && (
        <DashboardDrawer
          eyebrow="TEACHER WARNING"
          title={selectedWarning.teacher}
          subtitle={selectedWarning.reason}
          onClose={() => setSelectedWarning(null)}
          sections={[
            {
              title: 'Warning Details',
              children: (
                <div className="lead-summary-grid">
                  <span>{t('Warning type')}<strong>{t(selectedWarning.warningType)}</strong></span>
                  <span>{t('Class')}<strong>{selectedWarning.className}</strong></span>
                  <span>{t('Date')}<strong>{selectedWarning.date}</strong></span>
                  <span>{t('Severity')}<strong><StatusBadge label={selectedWarning.severity} /></strong></span>
                  <span>{t('Status')}<strong><StatusBadge label={selectedWarning.status} /></strong></span>
                </div>
              ),
            },
          ]}
          actions={[
            { label: 'Approve Warning', variant: 'copper', onClick: () => handleWarning(selectedWarning, 'approved') },
            { label: 'Cancel Warning', onClick: () => handleWarning(selectedWarning, 'cancelled') },
            { label: 'Mark Excused', onClick: () => handleWarning(selectedWarning, 'excused') },
            { label: 'Resolve', onClick: () => handleWarning(selectedWarning, 'resolved') },
            { label: 'Suspend Account requires escalation rule', variant: 'danger', disabled: true, onClick: () => null },
            { label: 'Reactivate Account requires account review', disabled: true, onClick: () => null },
          ]}
        />
      )}

      {editingRule && (
        <DashboardDrawer
          eyebrow="COMPLIANCE RULE"
          title={editingRule.ruleName}
          subtitle="Edit warning thresholds and escalation behavior."
          onClose={() => setEditingRule(null)}
          sections={[
            {
              title: 'Rule Settings',
              children: (
                <form className="dashboard-form" id="compliance-rule-form" onSubmit={async (event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  await saveComplianceRule({
                    ...editingRule,
                    lateGraceMinutes: Number(formData.get('lateGraceMinutes') || editingRule.lateGraceMinutes),
                    noShowAfterMinutes: Number(formData.get('noShowAfterMinutes') || editingRule.noShowAfterMinutes),
                    maxWarnings: Number(formData.get('maxWarnings') || editingRule.maxWarnings),
                    periodDays: Number(formData.get('periodDays') || editingRule.periodDays),
                    actionAfterLimit: String(formData.get('actionAfterLimit') || editingRule.actionAfterLimit),
                  });
                  setEditingRule(null);
                  notify(t('Compliance rule saved.'), 'success');
                  await loadData();
                }}>
                  <label><span>{t('Reminder before class minutes')}</span><input name="reminderBefore" type="number" defaultValue="10" /></label>
                  <label><span>{t('Late grace minutes')}</span><input name="lateGraceMinutes" type="number" defaultValue={editingRule.lateGraceMinutes} /></label>
                  <label><span>{t('No-show after minutes')}</span><input name="noShowAfterMinutes" type="number" defaultValue={editingRule.noShowAfterMinutes} /></label>
                  <label><span>{t('Max warnings')}</span><input name="maxWarnings" type="number" defaultValue={editingRule.maxWarnings} /></label>
                  <label><span>{t('Period days')}</span><input name="periodDays" type="number" defaultValue={editingRule.periodDays} /></label>
                  <label><span>{t('Action after limit')}</span><select name="actionAfterLimit" defaultValue={editingRule.actionAfterLimit}><option value="flag_for_review">{t('Flag for review')}</option><option value="auto_suspend">{t('Auto suspend')}</option><option value="admin_review_only">{t('Admin review only')}</option></select></label>
                </form>
              ),
            },
          ]}
          actions={[
            { label: 'Save Rule', icon: 'check', variant: 'copper', onClick: () => document.getElementById('compliance-rule-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) },
          ]}
        />
      )}

      {editingTemplate && (
        <DashboardDrawer
          eyebrow="NOTIFICATION TEMPLATE"
          title={editingTemplate.templateKey}
          subtitle={`${editingTemplate.channel} template`}
          onClose={() => setEditingTemplate(null)}
          width="wide"
          sections={[
            {
              title: 'Template Content',
              children: (
                <form className="dashboard-form" id="notification-template-form" onSubmit={async (event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  await saveNotificationTemplate({
                    ...editingTemplate,
                    title: String(formData.get('title') || editingTemplate.title),
                    body: String(formData.get('body') || editingTemplate.body),
                    whatsappTemplateName: String(formData.get('whatsappTemplateName') || editingTemplate.whatsappTemplateName || ''),
                  });
                  setEditingTemplate(null);
                  notify(t('Notification template saved.'), 'success');
                  await loadData();
                }}>
                  <label><span>{t('Title')}</span><input name="title" defaultValue={editingTemplate.title} /></label>
                  <label><span>{t('WhatsApp template name')}</span><input name="whatsappTemplateName" defaultValue={editingTemplate.whatsappTemplateName || ''} /></label>
                  <label><span>{t('Body')}</span><textarea name="body" rows={8} defaultValue={editingTemplate.body} /></label>
                </form>
              ),
            },
          ]}
          actions={[
            { label: 'Save Template', icon: 'check', variant: 'copper', onClick: () => document.getElementById('notification-template-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) },
          ]}
        />
      )}
    </div>
  );
}
