import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import CalendarMiniCard from '../components/CalendarMiniCard';
import DashboardActionMenu from '../components/DashboardActionMenu';
import DashboardDrawer from '../components/DashboardDrawer';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { type ToastMessage } from '../components/Toast';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';
import { fetchAdminDashboardData, type AdminDashboardClass as RecentClass, type AdminDashboardData } from '../services/adminDashboardService';

function openMeetingLink(meeting: string, notify: (message: string) => void, t: (message: string) => string) {
  if (meeting.toLowerCase().includes('zoom') || meeting.toLowerCase().includes('meet')) {
    notify(t('The meeting link is ready in the class details workflow.'));
    return;
  }

  notify(t('Meeting link is not assigned yet.'));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useDashboardLanguage();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [selectedClass, setSelectedClass] = useState<RecentClass | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetchAdminDashboardData().then(setDashboardData).catch(() => setDashboardData({
      stats: [],
      health: [],
      recentActivity: [],
      todayClasses: [],
    }));
  }, []);

  function notify(message: string, type: ToastMessage['type'] = 'info') {
    setToast({ type, message });
  }

  const classColumns: Array<DataTableColumn<RecentClass>> = [
    { header: 'Time', accessor: 'time' },
    { header: 'Class', accessor: 'className' },
    { header: 'Teacher', accessor: 'teacher' },
    { header: 'Students', accessor: 'students' },
    { header: 'Attendance', accessor: (row) => <StatusBadge label={row.attendanceSubmitted} /> },
    { header: 'Teacher Report', accessor: (row) => <StatusBadge label={row.teacherReport} /> },
    { header: 'Homework', accessor: (row) => <StatusBadge label={row.homeworkSet} /> },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <DashboardActionMenu
          primaryAction={{ label: 'Class Details', onClick: () => setSelectedClass(row) }}
          actions={[
            { label: 'Open Meeting', onClick: () => openMeetingLink(row.meeting, notify, t) },
            { label: 'View Attendance', onClick: () => navigate('/dashboard/admin/attendance') },
            { label: 'View Teacher Report', onClick: () => setSelectedClass(row) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">{t('Admin Overview')}</span>
          <h1>{t('Academy Operations Dashboard')}</h1>
          <p>{t('Monitor admissions, trials, students, classes, attendance, payments, and reports from one control surface.')}</p>
        </div>
        <ActionButton onClick={() => navigate('/dashboard/admin/classes')}>
          <Icon name="calendar" size={18} />
          {t('Review Today Classes')}
        </ActionButton>
      </div>

      <div className="dashboard-page-actions">
        <ActionButton variant="copper" onClick={() => navigate('/dashboard/admin/leads')}><Icon name="plus" size={17} />{t('Add Lead')}</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/free-trials')}><Icon name="gift" size={17} />{t('Schedule Trial')}</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/students')}><Icon name="student" size={17} />{t('Add Student')}</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/teachers')}><Icon name="teacher" size={17} />{t('Add Teacher')}</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/payments')}><Icon name="award" size={17} />{t('Create Invoice')}</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/reports')}><Icon name="report" size={17} />{t('View Reports')}</ActionButton>
      </div>

      <div className="dashboard-stats-grid dashboard-stats-grid--accounts">
        {(dashboardData?.stats || []).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Operational Health" subtitle="Current academy workflow signals">
          <div className="dashboard-metric-list">
            {(dashboardData?.health || []).map((item) => (
              <div className="dashboard-metric" key={item.title}>
                <span>{t(item.title)}</span>
                <strong>{item.value}</strong>
                <p>{t(item.meta)}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Activity" subtitle="Latest workflow updates">
          <div className="teacher-task-list">
            {(dashboardData?.recentActivity || []).length === 0 && <p className="dashboard-empty-copy">{t('No recent activity logged yet.')}</p>}
            {(dashboardData?.recentActivity || []).map((item) => (
              <article key={item.title}>
                <Icon name={item.icon} size={18} />
                <div>
                  <strong>{t(item.title)}</strong>
                  <span>{t(item.meta)}</span>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Upcoming Focus" subtitle="Priority operational items for today">
          <div className="dashboard-focus-row">
            <CalendarMiniCard month="Jul" day="29" label="Academic reports" />
            <div>
              <h3>{t('Teacher report completion')}</h3>
              <p>{t('Review classes with pending attendance or teacher reports before closing the day.')}</p>
            </div>
          </div>
          <div className="dashboard-focus-row">
            <CalendarMiniCard month="Jul" day="30" label="Trial conversion" />
            <div>
              <h3>{t('Trial feedback review')}</h3>
              <p>{t('Check completed trials, recommended levels, and conversion readiness.')}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Workflow Shortcuts" subtitle="Continue the academy flow">
          <div className="teacher-checklist">
            <button type="button" onClick={() => navigate('/dashboard/admin/leads')}><Icon name="phone" size={16} />{t('Review admissions pipeline')}</button>
            <button type="button" onClick={() => navigate('/dashboard/admin/free-trials')}><Icon name="gift" size={16} />{t('Coordinate free trials')}</button>
            <button type="button" onClick={() => navigate('/dashboard/admin/students')}><Icon name="student" size={16} />{t('Complete student setup')}</button>
            <button type="button" onClick={() => navigate('/dashboard/admin/payments')}><Icon name="award" size={16} />{t('Follow up payments')}</button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Today Classes" subtitle="Scheduled classes with attendance, reports, homework, and status">
        {(dashboardData?.todayClasses || []).length === 0
          ? <p className="dashboard-empty-copy">{t('No classes scheduled for today.')}</p>
          : <DataTable columns={classColumns} rows={dashboardData?.todayClasses || []} getRowKey={(row) => row.id} />}
      </SectionCard>

      {selectedClass && (
        <DashboardDrawer
          eyebrow="CLASS OPERATIONS"
          title={selectedClass.className}
          subtitle="Class details, meeting link, attendance, report, and homework operations."
          onClose={() => setSelectedClass(null)}
          sections={[
            {
              title: 'Class Details',
              children: (
                <div className="lead-summary-grid">
                  <span>{t('Time')}<strong>{selectedClass.time}</strong></span>
                  <span>{t('Teacher')}<strong>{t(selectedClass.teacher)}</strong></span>
                  <span>{t('Students')}<strong>{t(selectedClass.students)}</strong></span>
                  <span>{t('Meeting')}<strong>{t(selectedClass.meeting)}</strong></span>
                  <span>{t('Status')}<strong><StatusBadge label={selectedClass.status} /></strong></span>
                </div>
              ),
            },
            {
              title: 'Teaching Workflow',
              children: (
                <div className="lead-summary-grid">
                  <span>{t('Attendance')}<strong><StatusBadge label={selectedClass.attendanceSubmitted} /></strong></span>
                  <span>{t('Teacher report')}<strong><StatusBadge label={selectedClass.teacherReport} /></strong></span>
                  <span>{t('Homework')}<strong><StatusBadge label={selectedClass.homeworkSet} /></strong></span>
                  <span>{t('Reschedule history')}<strong>{t('No recent changes')}</strong></span>
                </div>
              ),
            },
          ]}
          actions={[
            { label: 'Open Meeting', icon: 'video', variant: 'copper', onClick: () => openMeetingLink(selectedClass.meeting, notify, t) },
            { label: 'View Attendance', icon: 'clipboard', onClick: () => navigate('/dashboard/admin/attendance') },
            { label: 'View Teacher Report', icon: 'report', onClick: () => navigate('/dashboard/admin/classes') },
            { label: 'Set Homework', icon: 'document', onClick: () => notify(t('Homework setup is handled from the class operations page.')) },
            { label: 'Reschedule Class', icon: 'calendar', onClick: () => navigate('/dashboard/admin/classes') },
          ]}
        />
      )}
    </div>
  );
}
