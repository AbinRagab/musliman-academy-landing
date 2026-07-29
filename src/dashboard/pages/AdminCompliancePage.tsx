import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardDrawer from '../components/DashboardDrawer';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { type ToastMessage } from '../components/Toast';
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
  const [data, setData] = useState<ComplianceDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<ComplianceTab>('Today Monitoring');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedCheckin, setSelectedCheckin] = useState<ComplianceCheckinRow | null>(null);
  const [selectedWarning, setSelectedWarning] = useState<TeacherWarningRow | null>(null);
  const [editingRule, setEditingRule] = useState<ComplianceRuleRow | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateRow | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const nextData = await fetchComplianceDashboardData();
    setData(nextData);
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
    { header: 'Attendance', accessor: (row) => <StatusBadge label={row.attendanceSubmitted} /> },
    { header: 'Report', accessor: (row) => <StatusBadge label={row.reportSubmitted} /> },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="dashboard-table-actions dashboard-table-actions--wrap">
          <ActionButton variant="ghost" onClick={() => notify(`Reminder queued for ${row.teacher}.`)}>Send Reminder Now</ActionButton>
          <ActionButton variant="ghost" onClick={() => notify(`Teacher contact workflow opened for ${row.teacher}.`)}>Contact Teacher</ActionButton>
          <ActionButton variant="ghost" onClick={() => setSelectedCheckin(row)}>View Logs</ActionButton>
          <ActionButton variant="ghost" onClick={() => notify(`Warning form prepared for ${row.teacher}.`)}>Create Warning</ActionButton>
        </div>
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
        <div className="dashboard-table-actions dashboard-table-actions--wrap">
          <ActionButton variant="ghost" onClick={() => setSelectedWarning(row)}>View Warning</ActionButton>
          <ActionButton variant="ghost" onClick={() => handleWarning(row, 'approved')}>Approve Warning</ActionButton>
          <ActionButton variant="ghost" onClick={() => handleWarning(row, 'excused')}>Mark Excused</ActionButton>
          <ActionButton variant="ghost" onClick={() => handleWarning(row, 'resolved')}>Resolve</ActionButton>
        </div>
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
    notify(`Warning marked ${status}.`, 'success');
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
            <ActionButton variant="secondary" onClick={async () => { await runTeacherComplianceCheck(); notify('Compliance check completed.', 'success'); await loadData(); }}>
              <Icon name="shieldCheck" size={17} />
              Run Compliance Check
            </ActionButton>
            <ActionButton variant="copper" onClick={async () => { await sendTestNotification('in_app'); notify('Test in-app notification sent.', 'success'); await loadData(); }}>
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
        <div className="student-info-grid">
          <span>In-app notifications <strong><StatusBadge label="configured" /></strong></span>
          <span>Email provider <strong><StatusBadge label={data.providerStatus.emailConfigured ? 'configured' : 'missing secrets'} /></strong></span>
          <span>WhatsApp provider <strong><StatusBadge label={data.providerStatus.whatsappConfigured ? 'configured' : 'missing secrets'} /></strong></span>
          <span>Default cron cadence <strong>Every 5 minutes</strong></span>
        </div>
        <div className="dashboard-form-actions">
          <ActionButton variant="secondary" onClick={async () => { await sendTestNotification('email'); notify('Email test queued. Check logs for provider result.', 'success'); await loadData(); }}>Test Email</ActionButton>
          <ActionButton variant="secondary" onClick={async () => { await sendTestNotification('whatsapp'); notify('WhatsApp test queued. Check logs for provider result.', 'success'); await loadData(); }}>Test WhatsApp</ActionButton>
        </div>
      </SectionCard>

      <div className="admin-tabs admin-tabs--settings" role="tablist" aria-label="Compliance sections">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? 'is-active' : ''} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
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
                  <span>Teacher<strong>{selectedCheckin.teacher}</strong></span>
                  <span>Student<strong>{selectedCheckin.student}</strong></span>
                  <span>Scheduled time<strong>{selectedCheckin.scheduledTime}</strong></span>
                  <span>Ready<strong><StatusBadge label={selectedCheckin.teacherReady} /></strong></span>
                  <span>Joined<strong><StatusBadge label={selectedCheckin.joined} /></strong></span>
                  <span>Status<strong><StatusBadge label={selectedCheckin.status} /></strong></span>
                </div>
              ),
            },
          ]}
          actions={[
            { label: 'Send Reminder Now', icon: 'bell', variant: 'copper', onClick: () => notify(`Reminder queued for ${selectedCheckin.teacher}.`) },
            { label: 'Contact Teacher', icon: 'message', onClick: () => notify(`Contact workflow opened for ${selectedCheckin.teacher}.`) },
            { label: 'Mark Excused', icon: 'check', onClick: () => notify('Class monitoring record marked excused for review.') },
            { label: 'Open Class Details', icon: 'calendar', onClick: () => notify('Class details are available from Admin Classes.') },
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
                  <span>Warning type<strong>{selectedWarning.warningType}</strong></span>
                  <span>Class<strong>{selectedWarning.className}</strong></span>
                  <span>Date<strong>{selectedWarning.date}</strong></span>
                  <span>Severity<strong><StatusBadge label={selectedWarning.severity} /></strong></span>
                  <span>Status<strong><StatusBadge label={selectedWarning.status} /></strong></span>
                </div>
              ),
            },
          ]}
          actions={[
            { label: 'Approve Warning', variant: 'copper', onClick: () => handleWarning(selectedWarning, 'approved') },
            { label: 'Cancel Warning', onClick: () => handleWarning(selectedWarning, 'cancelled') },
            { label: 'Mark Excused', onClick: () => handleWarning(selectedWarning, 'excused') },
            { label: 'Resolve', onClick: () => handleWarning(selectedWarning, 'resolved') },
            { label: 'Suspend Account', variant: 'danger', onClick: () => notify('Suspension remains admin-controlled and follows the configured escalation rule.') },
            { label: 'Reactivate Account', onClick: () => notify('Reactivation action prepared for admin account review.') },
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
                  notify('Compliance rule saved.', 'success');
                  await loadData();
                }}>
                  <label><span>Reminder before class minutes</span><input name="reminderBefore" type="number" defaultValue="10" /></label>
                  <label><span>Late grace minutes</span><input name="lateGraceMinutes" type="number" defaultValue={editingRule.lateGraceMinutes} /></label>
                  <label><span>No-show after minutes</span><input name="noShowAfterMinutes" type="number" defaultValue={editingRule.noShowAfterMinutes} /></label>
                  <label><span>Max warnings</span><input name="maxWarnings" type="number" defaultValue={editingRule.maxWarnings} /></label>
                  <label><span>Period days</span><input name="periodDays" type="number" defaultValue={editingRule.periodDays} /></label>
                  <label><span>Action after limit</span><select name="actionAfterLimit" defaultValue={editingRule.actionAfterLimit}><option value="flag_for_review">Flag for review</option><option value="auto_suspend">Auto suspend</option><option value="admin_review_only">Admin review only</option></select></label>
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
                  notify('Notification template saved.', 'success');
                  await loadData();
                }}>
                  <label><span>Title</span><input name="title" defaultValue={editingTemplate.title} /></label>
                  <label><span>WhatsApp template name</span><input name="whatsappTemplateName" defaultValue={editingTemplate.whatsappTemplateName || ''} /></label>
                  <label><span>Body</span><textarea name="body" rows={8} defaultValue={editingTemplate.body} /></label>
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
