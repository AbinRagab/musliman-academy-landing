import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import CalendarMiniCard from '../components/CalendarMiniCard';
import DashboardDrawer from '../components/DashboardDrawer';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { type ToastMessage } from '../components/Toast';
import { academyOperations, recentClasses } from '../data/mockData';

type RecentClass = (typeof recentClasses)[number] & {
  meeting: string;
  attendanceSubmitted: string;
  teacherReport: string;
  homeworkSet: string;
};

const operationStats = [
  { label: 'New Leads', value: 12, trend: 'Admissions queue', icon: 'phone' },
  { label: 'Trials Scheduled', value: 19, trend: 'Next 7 days', icon: 'gift' },
  { label: 'Active Students', value: 428, trend: 'Enrolled learners', icon: 'users' },
  { label: 'Today Classes', value: 84, trend: 'Live schedule', icon: 'calendar' },
  { label: 'Pending Payments', value: 24, trend: 'Finance follow-up', icon: 'award' },
  { label: 'Attendance Issues', value: 7, trend: 'Needs review', icon: 'clipboard' },
  { label: 'Pending Reports', value: 11, trend: 'Teacher reports', icon: 'report' },
  { label: 'Upcoming Trials', value: 5, trend: 'Next 48 hours', icon: 'clock' },
];

const operationalClasses: RecentClass[] = recentClasses.map((classItem, index) => ({
  ...classItem,
  meeting: index === 0 ? 'Zoom classroom' : 'Google Meet',
  attendanceSubmitted: index === 0 ? 'submitted' : 'pending',
  teacherReport: index === 0 ? 'submitted' : 'needs report',
  homeworkSet: index === 2 ? 'pending' : 'set',
}));

const recentActivity = [
  { title: 'Website lead received', meta: 'Admissions pipeline - Quran Reading', icon: 'phone' },
  { title: 'Trial feedback submitted', meta: 'Teacher feedback ready for admin review', icon: 'gift' },
  { title: 'Attendance correction requested', meta: 'Late record needs teacher confirmation', icon: 'clipboard' },
  { title: 'Payment follow-up queued', meta: 'Overdue package renewal', icon: 'award' },
];

function openMeetingLink(meeting: string, notify: (message: string) => void) {
  if (meeting.toLowerCase().includes('zoom') || meeting.toLowerCase().includes('meet')) {
    notify(`${meeting} link is ready in the class details workflow.`);
    return;
  }

  notify('Meeting link is not assigned yet.');
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<RecentClass | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

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
        <div className="dashboard-table-actions dashboard-table-actions--wrap">
          <ActionButton variant="ghost" onClick={() => setSelectedClass(row)}>Class Details</ActionButton>
          <ActionButton variant="ghost" onClick={() => openMeetingLink(row.meeting, notify)}>Open Meeting</ActionButton>
        </div>
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
        {operationStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Operational Health" subtitle="Current academy workflow signals">
          <div className="dashboard-metric-list">
            {academyOperations.map((item) => (
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
            {recentActivity.map((item) => (
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
        <DataTable columns={classColumns} rows={operationalClasses} getRowKey={(row) => `${row.time}-${row.className}`} />
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
