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
import { fetchAdminDashboardData, type AdminDashboardClass as RecentClass, type AdminDashboardData } from '../services/adminDashboardService';

function openMeetingLink(meeting: string, notify: (message: string) => void) {
  if (meeting.toLowerCase().includes('zoom') || meeting.toLowerCase().includes('meet')) {
    notify(`${meeting} link is ready in the class details workflow.`);
    return;
  }

  notify('Meeting link is not assigned yet.');
}

export default function AdminDashboard() {
  const navigate = useNavigate();
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
            { label: 'Open Meeting', onClick: () => openMeetingLink(row.meeting, notify) },
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
          <span className="dashboard-eyebrow">Admin Overview</span>
          <h1>Academy Operations Dashboard</h1>
          <p>Monitor admissions, trials, students, classes, attendance, payments, and reports from one control surface.</p>
        </div>
        <ActionButton onClick={() => navigate('/dashboard/admin/classes')}>
          <Icon name="calendar" size={18} />
          Review Today Classes
        </ActionButton>
      </div>

      <div className="dashboard-page-actions">
        <ActionButton variant="copper" onClick={() => navigate('/dashboard/admin/leads')}><Icon name="plus" size={17} />Add Lead</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/free-trials')}><Icon name="gift" size={17} />Schedule Trial</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/students')}><Icon name="student" size={17} />Add Student</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/teachers')}><Icon name="teacher" size={17} />Add Teacher</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/payments')}><Icon name="award" size={17} />Create Invoice</ActionButton>
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/admin/reports')}><Icon name="report" size={17} />View Reports</ActionButton>
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
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <p>{item.meta}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Activity" subtitle="Latest workflow updates">
          <div className="teacher-task-list">
            {(dashboardData?.recentActivity || []).length === 0 && <p className="dashboard-empty-copy">No recent activity logged yet.</p>}
            {(dashboardData?.recentActivity || []).map((item) => (
              <article key={item.title}>
                <Icon name={item.icon} size={18} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
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
              <h3>Teacher report completion</h3>
              <p>Review classes with pending attendance or teacher reports before closing the day.</p>
            </div>
          </div>
          <div className="dashboard-focus-row">
            <CalendarMiniCard month="Jul" day="30" label="Trial conversion" />
            <div>
              <h3>Trial feedback review</h3>
              <p>Check completed trials, recommended levels, and conversion readiness.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Workflow Shortcuts" subtitle="Continue the academy flow">
          <div className="teacher-checklist">
            <button type="button" onClick={() => navigate('/dashboard/admin/leads')}><Icon name="phone" size={16} />Review admissions pipeline</button>
            <button type="button" onClick={() => navigate('/dashboard/admin/free-trials')}><Icon name="gift" size={16} />Coordinate free trials</button>
            <button type="button" onClick={() => navigate('/dashboard/admin/students')}><Icon name="student" size={16} />Complete student setup</button>
            <button type="button" onClick={() => navigate('/dashboard/admin/payments')}><Icon name="award" size={16} />Follow up payments</button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Today Classes" subtitle="Scheduled classes with attendance, reports, homework, and status">
        {(dashboardData?.todayClasses || []).length === 0
          ? <p className="dashboard-empty-copy">No classes scheduled for today.</p>
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
                  <span>Time<strong>{selectedClass.time}</strong></span>
                  <span>Teacher<strong>{selectedClass.teacher}</strong></span>
                  <span>Students<strong>{selectedClass.students}</strong></span>
                  <span>Meeting<strong>{selectedClass.meeting}</strong></span>
                  <span>Status<strong><StatusBadge label={selectedClass.status} /></strong></span>
                </div>
              ),
            },
            {
              title: 'Teaching Workflow',
              children: (
                <div className="lead-summary-grid">
                  <span>Attendance<strong><StatusBadge label={selectedClass.attendanceSubmitted} /></strong></span>
                  <span>Teacher report<strong><StatusBadge label={selectedClass.teacherReport} /></strong></span>
                  <span>Homework<strong><StatusBadge label={selectedClass.homeworkSet} /></strong></span>
                  <span>Reschedule history<strong>No recent changes</strong></span>
                </div>
              ),
            },
          ]}
          actions={[
            { label: 'Open Meeting', icon: 'video', variant: 'copper', onClick: () => openMeetingLink(selectedClass.meeting, notify) },
            { label: 'View Attendance', icon: 'clipboard', onClick: () => navigate('/dashboard/admin/attendance') },
            { label: 'View Teacher Report', icon: 'report', onClick: () => navigate('/dashboard/admin/classes') },
            { label: 'Set Homework', icon: 'document', onClick: () => notify('Homework setup is handled from the class operations page.') },
            { label: 'Reschedule Class', icon: 'calendar', onClick: () => navigate('/dashboard/admin/classes') },
          ]}
        />
      )}
    </div>
  );
}
