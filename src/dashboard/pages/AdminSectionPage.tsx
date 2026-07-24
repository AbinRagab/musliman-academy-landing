import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import ProgressBar from '../components/ProgressBar';
import ProfilePanel from '../components/ProfilePanel';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminLeads,
  adminPayments,
  adminReports,
  adminStudents,
  adminTeachers,
  freeTrials,
  recentClasses,
  rolePermissionMatrix,
} from '../data/mockData';
import { fetchStudentManagementRows } from '../services/studentsService';

type AdminSection =
  | 'leads'
  | 'students'
  | 'teachers'
  | 'free-trials'
  | 'classes'
  | 'attendance'
  | 'payments'
  | 'reports'
  | 'settings';

type GenericRow = Record<string, string | number | boolean>;

function rowMatches(row: GenericRow, search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return Object.values(row).some((value) => String(value).toLowerCase().includes(query));
}

function BasicTable({ rows, columns }: { rows: GenericRow[]; columns: Array<DataTableColumn<GenericRow>> }) {
  const [search, setSearch] = useState('');
  const filteredRows = useMemo(() => rows.filter((row) => rowMatches(row, search)), [rows, search]);

  return (
    <>
      <FilterBar search={search} onSearchChange={setSearch}>
        <label>
          <span>Status</span>
          <select defaultValue="all">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </FilterBar>
      {filteredRows.length > 0 ? (
        <DataTable columns={columns} rows={filteredRows} getRowKey={(row, index) => `${Object.values(row)[0]}-${index}`} />
      ) : (
        <EmptyState title="No matching records" description="Adjust the filters or add a new academy record." />
      )}
    </>
  );
}

const statusColumn = (key: string): DataTableColumn<GenericRow> => ({
  header: 'Status',
  accessor: (row) => <StatusBadge label={String(row[key])} />,
});

const actionColumn: DataTableColumn<GenericRow> = {
  header: 'Actions',
  accessor: () => <ActionButton variant="ghost">Review</ActionButton>,
};

const config: Record<AdminSection, {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string | number; trend: string; icon: string }>;
  rows: GenericRow[];
  columns: Array<DataTableColumn<GenericRow>>;
  side?: ReactNode;
}> = {
  leads: {
    eyebrow: 'LEADS CRM',
    title: 'Admissions Pipeline',
    subtitle: 'Track new inquiries, parent follow-ups, sources, and trial readiness.',
    stats: [
      { label: 'New Leads', value: 24, trend: '+8 this week', icon: 'gift' },
      { label: 'Contacted', value: 41, trend: 'Admissions active', icon: 'phone' },
      { label: 'Trials Scheduled', value: 19, trend: 'Next 7 days', icon: 'calendar' },
      { label: 'Conversion Rate', value: '68%', trend: 'Trial to enrollment', icon: 'chart' },
    ],
    rows: adminLeads,
    columns: [
      { header: 'Name', accessor: 'name' },
      { header: 'Contact', accessor: 'contact' },
      { header: 'Program', accessor: 'program' },
      { header: 'Source', accessor: 'source' },
      { header: 'Owner', accessor: 'owner' },
      statusColumn('status'),
      { header: 'Next Follow-up', accessor: 'nextFollowUp' },
      actionColumn,
    ],
  },
  students: {
    eyebrow: 'STUDENT MANAGEMENT',
    title: 'Students',
    subtitle: 'Manage learner assignments, levels, attendance health, and class readiness.',
    stats: [
      { label: 'Active Students', value: 428, trend: '+18 this month', icon: 'users' },
      { label: 'Attendance Rate', value: '94%', trend: 'Academy average', icon: 'clipboard' },
      { label: 'At Risk', value: 12, trend: 'Needs follow-up', icon: 'shieldCheck' },
      { label: 'New Enrollments', value: 31, trend: 'July cohort', icon: 'student' },
    ],
    rows: adminStudents,
    columns: [
      { header: 'Student', accessor: 'name' },
      { header: 'Program', accessor: 'program' },
      { header: 'Teacher', accessor: 'teacher' },
      { header: 'Level', accessor: 'level' },
      { header: 'Attendance', accessor: 'attendance' },
      statusColumn('status'),
      { header: 'Next Class', accessor: 'nextClass' },
      actionColumn,
    ],
  },
  teachers: {
    eyebrow: 'ACADEMIC TEAM',
    title: 'Teachers',
    subtitle: 'Review teacher capacity, specialization, assigned learners, and trial load.',
    stats: [
      { label: 'Teachers', value: 36, trend: '7 departments', icon: 'teacher' },
      { label: 'Open Capacity', value: '18%', trend: 'Available hours', icon: 'clock' },
      { label: 'Trials Assigned', value: 10, trend: 'Next 48 hours', icon: 'gift' },
      { label: 'Avg Rating', value: '4.8', trend: 'Parent feedback', icon: 'star' },
    ],
    rows: adminTeachers,
    columns: [
      { header: 'Teacher', accessor: 'name' },
      { header: 'Specialization', accessor: 'specialization' },
      { header: 'Students', accessor: 'students' },
      { header: 'Trials', accessor: 'trials' },
      { header: 'Availability', accessor: 'availability' },
      statusColumn('status'),
      actionColumn,
    ],
  },
  'free-trials': {
    eyebrow: 'TRIAL CLASSES',
    title: 'Free Trial Classes',
    subtitle: 'Coordinate trial sessions, teacher assignment, parent contact, and conversion result.',
    stats: [
      { label: 'Scheduled Trials', value: 19, trend: 'Next 7 days', icon: 'calendar' },
      { label: 'Completed', value: 43, trend: 'This month', icon: 'checkCircle' },
      { label: 'No Show', value: 4, trend: 'Needs reschedule', icon: 'clock' },
      { label: 'Converted', value: 29, trend: 'Enrollment ready', icon: 'award' },
    ],
    rows: freeTrials.map((trial) => ({ ...trial, teacher: 'Assigned Teacher', status: 'scheduled', whatsapp: '+20 100 000 0000' })),
    columns: [
      { header: 'Student', accessor: 'student' },
      { header: 'Program', accessor: 'program' },
      { header: 'Date/time', accessor: 'dateTime' },
      { header: 'Teacher', accessor: 'teacher' },
      { header: 'Parent WhatsApp', accessor: 'whatsapp' },
      statusColumn('status'),
      actionColumn,
    ],
  },
  classes: {
    eyebrow: 'CLASS OPERATIONS',
    title: 'Classes',
    subtitle: 'Manage recurring classes, meeting links, lesson notes, homework, and status.',
    stats: [
      { label: 'Today', value: 32, trend: 'Scheduled sessions', icon: 'calendar' },
      { label: 'Completed', value: 21, trend: 'Marked by teachers', icon: 'checkCircle' },
      { label: 'Rescheduled', value: 5, trend: 'Parent requests', icon: 'clock' },
      { label: 'Homework Set', value: 18, trend: 'Lessons assigned', icon: 'document' },
    ],
    rows: recentClasses.map((item) => ({ ...item, meeting: 'Zoom', lesson: 'Revision and recitation' })),
    columns: [
      { header: 'Time', accessor: 'time' },
      { header: 'Class', accessor: 'className' },
      { header: 'Teacher', accessor: 'teacher' },
      { header: 'Students', accessor: 'students' },
      { header: 'Meeting', accessor: 'meeting' },
      { header: 'Lesson', accessor: 'lesson' },
      statusColumn('status'),
      actionColumn,
    ],
  },
  attendance: {
    eyebrow: 'ATTENDANCE',
    title: 'Attendance',
    subtitle: 'Monitor attendance patterns by student, teacher, class, and program.',
    stats: [
      { label: 'Present', value: '94%', trend: 'This week', icon: 'clipboard' },
      { label: 'Absent', value: 11, trend: 'Needs parent follow-up', icon: 'phone' },
      { label: 'Late', value: 7, trend: 'Across all classes', icon: 'clock' },
      { label: 'Completed Logs', value: '92%', trend: 'Teacher submissions', icon: 'checkCircle' },
    ],
    rows: adminStudents.map((student) => ({ student: student.name, program: student.program, teacher: student.teacher, lastClass: student.nextClass, status: student.attendance === '88%' ? 'late' : 'present', notes: 'Teacher notes available' })),
    columns: [
      { header: 'Student', accessor: 'student' },
      { header: 'Program', accessor: 'program' },
      { header: 'Teacher', accessor: 'teacher' },
      { header: 'Class', accessor: 'lastClass' },
      statusColumn('status'),
      { header: 'Notes', accessor: 'notes' },
      actionColumn,
    ],
  },
  payments: {
    eyebrow: 'FINANCE',
    title: 'Payments',
    subtitle: 'Review package status, payment collection, teacher cost, and next due dates.',
    stats: [
      { label: 'Paid', value: '$18.4k', trend: 'July billed', icon: 'award' },
      { label: 'Pending', value: '$2.1k', trend: '24 invoices', icon: 'clock' },
      { label: 'Overdue', value: '$640', trend: 'Follow-up needed', icon: 'shieldCheck' },
      { label: 'Net Revenue', value: '$11.8k', trend: 'After teacher cost', icon: 'chart' },
    ],
    rows: adminPayments,
    columns: [
      { header: 'Student', accessor: 'student' },
      { header: 'Program', accessor: 'program' },
      { header: 'Package', accessor: 'packageName' },
      { header: 'Amount', accessor: 'amount' },
      statusColumn('status'),
      { header: 'Next Due', accessor: 'nextDue' },
      actionColumn,
    ],
  },
  reports: {
    eyebrow: 'REPORTS & INSIGHTS',
    title: 'Reports & Insights',
    subtitle: 'Track academy health across admissions, attendance, academics, and finance.',
    stats: [
      { label: 'Trial Conversion', value: '68%', trend: '+6% vs last month', icon: 'chart' },
      { label: 'Attendance Health', value: '94%', trend: 'Strong', icon: 'clipboard' },
      { label: 'Teacher Utilization', value: '82%', trend: 'Balanced', icon: 'teacher' },
      { label: 'Revenue Collected', value: '91%', trend: 'Monthly target', icon: 'award' },
    ],
    rows: adminReports,
    columns: [
      { header: 'Report', accessor: 'report' },
      { header: 'Owner', accessor: 'owner' },
      { header: 'Period', accessor: 'period' },
      statusColumn('status'),
      { header: 'Metric', accessor: 'metric' },
      actionColumn,
    ],
    side: (
      <SectionCard title="Insights Snapshot">
        <div className="dashboard-insight-list">
          <ProgressBar value={68} label="Trial conversion" />
          <ProgressBar value={94} label="Attendance health" />
          <ProgressBar value={82} label="Teacher utilization" />
        </div>
      </SectionCard>
    ),
  },
  settings: {
    eyebrow: 'SYSTEM SETTINGS',
    title: 'Settings',
    subtitle: 'Configure academy defaults, communication preferences, and dashboard access rules.',
    stats: [
      { label: 'Programs', value: 9, trend: 'Active catalog', icon: 'book' },
      { label: 'Roles', value: 8, trend: 'Access levels', icon: 'shieldCheck' },
      { label: 'Notifications', value: 14, trend: 'Templates ready', icon: 'message' },
      { label: 'Timezone', value: 'UTC+2', trend: 'Academy default', icon: 'clock' },
    ],
    rows: rolePermissionMatrix as unknown as GenericRow[],
    columns: [
      { header: 'Area', accessor: 'area' },
      { header: 'Super Admin', accessor: (row) => <StatusBadge label={row.superAdmin ? 'enabled' : 'disabled'} /> },
      { header: 'Admin', accessor: (row) => <StatusBadge label={row.admin ? 'enabled' : 'disabled'} /> },
      { header: 'Teacher', accessor: (row) => <StatusBadge label={row.teacher ? 'enabled' : 'disabled'} /> },
      { header: 'Student', accessor: (row) => <StatusBadge label={row.student ? 'enabled' : 'disabled'} /> },
      { header: 'Finance', accessor: (row) => <StatusBadge label={row.finance ? 'enabled' : 'disabled'} /> },
    ],
  },
};

export default function AdminSectionPage({ section }: { section: AdminSection }) {
  const page = config[section];
  const [studentRows, setStudentRows] = useState<GenericRow[] | null>(null);

  useEffect(() => {
    if (section !== 'students') {
      return;
    }

    fetchStudentManagementRows()
      .then((rows) => {
        if (rows.length) {
          setStudentRows(rows);
        }
      })
      .catch(() => setStudentRows(null));
  }, [section]);

  const rows = section === 'students' && studentRows ? studentRows : page.rows;

  return (
    <div className="dashboard-page dashboard-page--management">
      <DashboardPageHeader
        eyebrow={page.eyebrow}
        title={page.title}
        subtitle={page.subtitle}
        action={(
          <ActionButton variant="secondary">
            <Icon name="download" size={18} />
            Export
          </ActionButton>
        )}
      />

      <div className="dashboard-stats-grid">
        {page.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className={page.side ? 'dashboard-grid dashboard-grid--two' : ''}>
        <SectionCard title={page.title} subtitle="Mock data prepared for Supabase wiring in the next data phase">
          <BasicTable rows={rows} columns={page.columns} />
        </SectionCard>
        {page.side}
      </div>

      {section === 'students' && (
        <ProfilePanel
          name="Yusuf Ahmed"
          subtitle="Quran Reading Level 3"
          role="student"
          status="active"
          items={[
            { label: 'Assigned teacher', value: 'Ust. Maryam Ali' },
            { label: 'Parent contact', value: '+20 100 000 0000' },
            { label: 'Attendance', value: '96%' },
            { label: 'Next class', value: 'Mon 05:00 PM' },
          ]}
        />
      )}
    </div>
  );
}
