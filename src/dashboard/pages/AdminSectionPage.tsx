import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu, { type DashboardMenuAction, type DashboardPrimaryAction } from '../components/DashboardActionMenu';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { type ToastMessage } from '../components/Toast';
import {
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

type GenericRow = Record<string, string | number | boolean | null | undefined>;
type DetailAction = {
  label: string;
  tone?: 'primary' | 'danger' | 'secondary';
  onClick?: () => void;
};
type DrawerContent = {
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    items: Array<{ label: string; value: ReactNode }>;
  }>;
  actions: DetailAction[];
};

const reportTabs = ['Admissions', 'Academic', 'Attendance', 'Teachers', 'Finance'] as const;
const settingsTabs = ['Academy Info', 'Programs', 'Roles & Permissions', 'Notifications', 'Payment Settings', 'Schedule Defaults', 'Integrations', 'Security'] as const;

function rowMatches(row: GenericRow, search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(query));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();

  if (['active', 'paid', 'present', 'completed', 'enabled', 'submitted', 'yes'].includes(normalized)) {
    return 'success' as const;
  }

  if (['pending', 'scheduled', 'late', 'warning', 'rescheduled'].includes(normalized)) {
    return 'warning' as const;
  }

  if (['inactive', 'cancelled', 'absent', 'overdue', 'disabled', 'no'].includes(normalized)) {
    return 'danger' as const;
  }

  return 'neutral' as const;
}

function csvEscape(value: unknown) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportRows(section: AdminSection, rows: GenericRow[]) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter((key) => key !== 'actions');
  const csv = [
    keys.join(','),
    ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `musliman-${section}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function DetailCell({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <div className="admin-detail-cell">
      <strong>{primary}</strong>
      {secondary && <span>{secondary}</span>}
    </div>
  );
}

function DetailDrawer({
  content,
  onClose,
}: {
  content: DrawerContent;
  onClose: () => void;
}) {
  return (
    <div className="lead-drawer admin-detail-drawer" role="dialog" aria-modal="true" aria-label={content.title}>
      <button type="button" className="lead-drawer__backdrop" aria-label="Close details" onClick={onClose} />
      <aside className="lead-drawer__panel">
        <div className="lead-drawer__header">
          <div>
            <span className="dashboard-eyebrow">ADMIN DETAILS</span>
            <h2>{content.title}</h2>
            <p>{content.subtitle}</p>
          </div>
          <button type="button" className="dashboard-icon-button" aria-label="Close details" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        {content.sections.map((section) => (
          <section className="lead-drawer__section" key={section.title}>
            <h3>{section.title}</h3>
            <div className="lead-summary-grid">
              {section.items.map((item) => (
                <span key={item.label}>
                  {item.label}
                  <strong>{item.value}</strong>
                </span>
              ))}
            </div>
          </section>
        ))}

        <div className="lead-drawer__footer">
          {content.actions.map((action) => (
            <ActionButton
              key={action.label}
              variant={action.tone === 'danger' ? 'danger' : action.tone === 'secondary' ? 'secondary' : 'copper'}
              onClick={action.onClick}
            >
              {action.label}
            </ActionButton>
          ))}
        </div>
      </aside>
    </div>
  );
}

function BasicTable({
  rows,
  columns,
  statusFilter,
  onStatusFilterChange,
}: {
  rows: GenericRow[];
  columns: Array<DataTableColumn<GenericRow>>;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}) {
  const [search, setSearch] = useState('');
  const statuses = useMemo(() => Array.from(new Set(rows.map((row) => String(row.status || '')).filter(Boolean))), [rows]);
  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesStatus = statusFilter === 'all' || String(row.status || '').toLowerCase() === statusFilter;
    return matchesStatus && rowMatches(row, search);
  }), [rows, search, statusFilter]);

  return (
    <>
      <FilterBar search={search} onSearchChange={setSearch}>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status.toLowerCase()}>{status}</option>
            ))}
          </select>
        </label>
      </FilterBar>
      {filteredRows.length > 0 ? (
        <DataTable columns={columns} rows={filteredRows} getRowKey={(row, index) => String(row.id || Object.values(row)[0] || index)} />
      ) : (
        <EmptyState title="No matching records" description="Adjust filters or create the next academy record from the related workflow." />
      )}
    </>
  );
}

const statusColumn = (key = 'status'): DataTableColumn<GenericRow> => ({
  header: 'Status',
  accessor: (row) => <StatusBadge label={String(row[key] || '-')} tone={statusTone(String(row[key] || ''))} />,
});

function createActionsColumn(
  label: string,
  getPrimary: (row: GenericRow) => DashboardPrimaryAction,
  getItems: (row: GenericRow) => DashboardMenuAction[],
): DataTableColumn<GenericRow> {
  return {
    header: 'Actions',
    accessor: (row) => (
      <DashboardActionMenu
        label={`${label} actions`}
        primaryAction={getPrimary(row)}
        actions={getItems(row)}
      />
    ),
  };
}

function normalizeStudents(rows: GenericRow[]) {
  const sourceRows = (rows.length ? rows : adminStudents) as GenericRow[];

  return sourceRows.map((row, index) => {
    const name = String(row.name || row.student || row.student_name || `Student ${index + 1}`);
    const program = String(row.program || row.programName || '');
    const teacher = String(row.teacher || row.teacherName || '');
    const level = String(row.level || '');
    const nextClass = String(row.nextClass || row.next_class || '');
    const incomplete = !program || !teacher || !level || !nextClass || row.status === 'pending';

    return {
      id: row.id || slug(name),
      name,
      program: program || 'Program not assigned',
      teacher: teacher || 'Teacher unassigned',
      level: level || 'Placement pending',
      attendance: row.attendance || row.attendanceRate || 'Not started',
      status: incomplete ? 'setup pending' : String(row.status || 'active'),
      nextClass: nextClass || 'Schedule pending',
      setupReady: !incomplete,
    };
  });
}

function buildRows(section: AdminSection, studentRows: GenericRow[] | null): GenericRow[] {
  if (section === 'students') {
    return normalizeStudents(studentRows || []);
  }

  if (section === 'teachers') {
    return adminTeachers.map((teacher) => ({
      ...teacher,
      id: slug(teacher.name),
      completedClasses: Number(teacher.students) * 3,
      rating: '4.8',
      feedback: 'Strong parent feedback',
      documents: 'Certificates on file',
    }));
  }

  if (section === 'free-trials') {
    return freeTrials.map((trial, index) => ({
      id: slug(`${trial.student}-${index}`),
      student: trial.student,
      lead: trial.student,
      whatsapp: '+20 100 000 0000',
      program: trial.program,
      dateTime: trial.dateTime,
      teacher: 'Teacher unassigned',
      meetingLink: index === 2 ? 'Pending' : 'Zoom link ready',
      status: index === 2 ? 'pending' : 'scheduled',
      result: 'Awaiting trial',
      recommendedLevel: 'Placement pending',
    }));
  }

  if (section === 'classes') {
    return recentClasses.map((item, index) => ({
      id: slug(`${item.className}-${item.time}`),
      time: item.time,
      className: item.className,
      teacher: item.teacher,
      students: item.students,
      meeting: 'Zoom',
      attendanceSubmitted: index === 0 ? 'yes' : 'no',
      homeworkSet: index === 2 ? 'no' : 'yes',
      reportSubmitted: index === 0 ? 'yes' : 'no',
      lesson: index === 0 ? 'Revision and recitation' : 'Scheduled lesson plan',
      status: item.status.toLowerCase(),
    }));
  }

  if (section === 'attendance') {
    return adminStudents.map((student, index) => ({
      id: slug(`${student.name}-attendance`),
      student: student.name,
      program: student.program,
      teacher: student.teacher,
      className: student.nextClass,
      status: index === 2 ? 'late' : index === 3 ? 'absent' : 'present',
      notes: index === 2 || index === 3 ? 'Needs parent follow-up' : 'Submitted by teacher',
      submittedBy: student.teacher,
      submittedAt: 'Today',
    }));
  }

  if (section === 'payments') {
    return adminPayments.map((payment) => ({
      id: slug(`${payment.student}-${payment.packageName}`),
      ...payment,
      currency: payment.amount.startsWith('$') ? 'USD' : 'USD',
      paidDate: payment.status === 'paid' ? 'Jul 20, 2026' : '-',
      remainingSessions: payment.status === 'overdue' ? '0' : '6',
    }));
  }

  if (section === 'reports') {
    return adminReports.map((report, index) => ({
      id: slug(report.report),
      ...report,
      category: reportTabs[index % reportTabs.length],
      exportFormat: 'CSV ready',
    }));
  }

  if (section === 'settings') {
    return rolePermissionMatrix.map((row) => ({ id: slug(row.area), ...row }));
  }

  return [];
}

function getDrawerContent(section: AdminSection, row: GenericRow, notify: (message: string, type?: ToastMessage['type']) => void, navigate: (path: string) => void): DrawerContent {
  if (section === 'students') {
    return {
      title: String(row.name),
      subtitle: 'Learner record, setup readiness, assignment, and class operations.',
      sections: [
        { title: 'Student Setup', items: [
          { label: 'Program', value: row.program },
          { label: 'Teacher', value: row.teacher },
          { label: 'Level', value: row.level },
          { label: 'Schedule', value: row.nextClass },
          { label: 'Attendance', value: row.attendance },
        ] },
        { title: 'Readiness', items: [
          { label: 'Setup status', value: <StatusBadge label={String(row.status)} tone={statusTone(String(row.status))} /> },
          { label: 'Payments', value: 'Package check required' },
          { label: 'Parent contact', value: '+20 100 000 0000' },
        ] },
      ],
      actions: [
        { label: 'Open Full Record', onClick: () => navigate(`/dashboard/admin/students/${row.id}`) },
        { label: 'Assign Teacher', tone: 'secondary', onClick: () => notify('Assign Teacher drawer is ready for live teacher assignment wiring.') },
        { label: 'Set Schedule', tone: 'secondary', onClick: () => notify('Schedule setup action prepared for class scheduling.') },
      ],
    };
  }

  if (section === 'teachers') {
    return {
      title: String(row.name),
      subtitle: 'Teacher capacity, academic profile, assigned students, trials, and performance.',
      sections: [
        { title: 'Academic Profile', items: [
          { label: 'Specialization', value: row.specialization },
          { label: 'Languages', value: 'Arabic, English' },
          { label: 'Availability', value: row.availability },
          { label: 'Documents', value: row.documents },
          { label: 'Status', value: <StatusBadge label={String(row.status)} tone={statusTone(String(row.status))} /> },
        ] },
        { title: 'Capacity', items: [
          { label: 'Assigned students', value: row.students },
          { label: 'Assigned trials', value: row.trials },
          { label: 'Completed classes', value: row.completedClasses },
          { label: 'Rating', value: row.rating },
          { label: 'Recent feedback', value: row.feedback },
        ] },
      ],
      actions: [
        { label: 'Edit Academic Profile', onClick: () => notify('Academic profile editor is prepared for teacher profile updates.') },
        { label: 'Update Availability', tone: 'secondary', onClick: () => notify('Availability editor is prepared for teacher scheduling.') },
        { label: String(row.status) === 'active' ? 'Deactivate' : 'Activate', tone: 'danger', onClick: () => notify('Teacher status update action prepared.') },
      ],
    };
  }

  if (section === 'free-trials') {
    return {
      title: String(row.student),
      subtitle: 'Trial coordination, assignment, teacher feedback, and conversion readiness.',
      sections: [
        { title: 'Trial Details', items: [
          { label: 'Lead', value: row.lead },
          { label: 'Parent WhatsApp', value: row.whatsapp },
          { label: 'Program', value: row.program },
          { label: 'Date/time', value: row.dateTime },
          { label: 'Assigned teacher', value: row.teacher },
          { label: 'Meeting link', value: row.meetingLink },
        ] },
        { title: 'Conversion Readiness', items: [
          { label: 'Trial status', value: <StatusBadge label={String(row.status)} tone={statusTone(String(row.status))} /> },
          { label: 'Teacher feedback', value: 'Pending after trial' },
          { label: 'Recommended level', value: row.recommendedLevel },
          { label: 'Result', value: row.result },
        ] },
      ],
      actions: [
        { label: 'Schedule Trial', onClick: () => notify('Trial scheduler is ready for date, teacher, and meeting link updates.') },
        { label: 'Send Reminder', tone: 'secondary', onClick: () => notify('Reminder action prepared for WhatsApp or email integration.') },
        { label: 'Convert to Student', tone: 'secondary', onClick: () => notify('Conversion checklist requires approved program, level, contact confirmation, and package setup.') },
      ],
    };
  }

  if (section === 'classes') {
    return {
      title: String(row.className),
      subtitle: 'Class schedule, meeting link, lesson notes, homework, attendance, and report status.',
      sections: [
        { title: 'Class Details', items: [
          { label: 'Date/time', value: row.time },
          { label: 'Teacher', value: row.teacher },
          { label: 'Students', value: row.students },
          { label: 'Meeting link', value: row.meeting },
          { label: 'Class status', value: <StatusBadge label={String(row.status)} tone={statusTone(String(row.status))} /> },
        ] },
        { title: 'Teacher Operations', items: [
          { label: 'Attendance submitted?', value: row.attendanceSubmitted },
          { label: 'Homework set?', value: row.homeworkSet },
          { label: 'Teacher report submitted?', value: row.reportSubmitted },
          { label: 'Lesson covered', value: row.lesson },
          { label: 'Reschedule history', value: 'No recent changes' },
        ] },
      ],
      actions: [
        { label: 'Open Meeting', onClick: () => notify('Meeting link action prepared.') },
        { label: 'View Attendance', tone: 'secondary', onClick: () => notify('Attendance view opens the related class attendance records.') },
        { label: 'Reschedule Class', tone: 'secondary', onClick: () => notify('Reschedule workflow prepared for class operations.') },
      ],
    };
  }

  if (section === 'attendance') {
    return {
      title: String(row.student),
      subtitle: 'Attendance record, teacher submission, notes, and parent follow-up.',
      sections: [
        { title: 'Attendance Record', items: [
          { label: 'Student', value: row.student },
          { label: 'Class', value: row.className },
          { label: 'Teacher', value: row.teacher },
          { label: 'Status', value: <StatusBadge label={String(row.status)} tone={statusTone(String(row.status))} /> },
          { label: 'Notes', value: row.notes },
        ] },
        { title: 'Submission', items: [
          { label: 'Submitted by', value: row.submittedBy },
          { label: 'Submitted at', value: row.submittedAt },
          { label: 'Parent follow-up required', value: row.status === 'absent' || row.status === 'late' ? 'Yes' : 'No' },
        ] },
      ],
      actions: [
        { label: 'Confirm Attendance', onClick: () => notify('Attendance confirmed for operations review.') },
        { label: 'Request Correction', tone: 'secondary', onClick: () => notify('Correction request prepared for teacher follow-up.') },
        { label: 'Contact Parent', tone: 'secondary', onClick: () => notify('Parent contact action prepared for WhatsApp integration.') },
      ],
    };
  }

  if (section === 'payments') {
    const isPaid = row.status === 'paid';
    return {
      title: String(row.student),
      subtitle: 'Package, payment collection, invoice, receipt, and next due details.',
      sections: [
        { title: 'Payment Details', items: [
          { label: 'Program', value: row.program },
          { label: 'Package', value: row.packageName },
          { label: 'Amount', value: row.amount },
          { label: 'Currency', value: row.currency },
          { label: 'Status', value: <StatusBadge label={String(row.status)} tone={statusTone(String(row.status))} /> },
        ] },
        { title: 'Billing', items: [
          { label: 'Paid date', value: row.paidDate },
          { label: 'Next due', value: row.nextDue },
          { label: 'Remaining sessions', value: row.remainingSessions },
          { label: 'Teacher cost', value: 'Calculated from completed classes' },
        ] },
      ],
      actions: [
        { label: isPaid ? 'Download Receipt' : 'Record Payment', onClick: () => notify(isPaid ? 'Receipt download prepared.' : 'Record Payment drawer prepared.') },
        { label: 'Create Invoice', tone: 'secondary', onClick: () => notify('Invoice creation action prepared for finance workflow.') },
        { label: row.status === 'overdue' ? 'Contact Parent' : 'View Invoice', tone: 'secondary', onClick: () => notify('Finance follow-up action prepared.') },
      ],
    };
  }

  if (section === 'reports') {
    return {
      title: String(row.report),
      subtitle: 'Academy health report across admissions, academics, attendance, teachers, or finance.',
      sections: [
        { title: 'Report Summary', items: [
          { label: 'Category', value: row.category },
          { label: 'Owner', value: row.owner },
          { label: 'Period', value: row.period },
          { label: 'Status', value: <StatusBadge label={String(row.status)} tone={statusTone(String(row.status))} /> },
          { label: 'Metric', value: row.metric },
          { label: 'Export', value: row.exportFormat },
        ] },
      ],
      actions: [
        { label: 'View Report', onClick: () => notify(`${row.report} report opened.`) },
        { label: 'Export Report', tone: 'secondary', onClick: () => exportRows('reports', [row]) },
        { label: 'Schedule Report', tone: 'secondary', onClick: () => notify('Report scheduling action prepared.') },
      ],
    };
  }

  if (section === 'settings') {
    return {
      title: String(row.area),
      subtitle: 'Role permission defaults and dashboard access rules.',
      sections: [
        { title: 'Permission Matrix', items: [
          { label: 'Super Admin', value: row.superAdmin ? 'Enabled' : 'Disabled' },
          { label: 'Admin', value: row.admin ? 'Enabled' : 'Disabled' },
          { label: 'Teacher', value: row.teacher ? 'Enabled' : 'Disabled' },
          { label: 'Student', value: row.student ? 'Enabled' : 'Disabled' },
          { label: 'Finance', value: row.finance ? 'Enabled' : 'Disabled' },
        ] },
      ],
      actions: [
        { label: 'Edit Permissions', onClick: () => notify('Permission editing action prepared for secure role permissions updates.') },
        { label: 'Export Permissions', tone: 'secondary', onClick: () => exportRows('settings', [row]) },
      ],
    };
  }

  return {
    title: String(row.report || row.area || 'Details'),
    subtitle: 'Operational dashboard details.',
    sections: [
      { title: 'Summary', items: Object.entries(row).filter(([key]) => key !== 'id').slice(0, 8).map(([key, value]) => ({ label: key, value: String(value) })) },
    ],
    actions: [{ label: 'Details Logged', tone: 'secondary', onClick: () => notify('Details action prepared.') }],
  };
}

function reportActionLabel(row: GenericRow) {
  return row.status === 'scheduled' ? 'View Scheduled Report' : 'View Report';
}

function paymentActionLabel(row: GenericRow) {
  if (row.status === 'paid') return 'View Receipt';
  if (row.status === 'overdue') return 'Follow-up Payment';
  return 'Record Payment';
}

const pageCopy: Record<AdminSection, { eyebrow: string; title: string; subtitle: string; exportLabel: string }> = {
  leads: { eyebrow: 'LEADS CRM', title: 'Admissions Pipeline', subtitle: 'Admissions pipeline from form submission to enrollment.', exportLabel: 'Export Leads' },
  students: { eyebrow: 'STUDENT MANAGEMENT', title: 'Students', subtitle: 'Manage learner records, assignments, levels, attendance health, and class readiness.', exportLabel: 'Export Students' },
  teachers: { eyebrow: 'ACADEMIC TEAM', title: 'Teachers', subtitle: 'Review teacher capacity, specialization, assigned students, trials, and performance.', exportLabel: 'Export Teachers' },
  'free-trials': { eyebrow: 'TRIAL CLASSES', title: 'Free Trial Classes', subtitle: 'Coordinate trial sessions, teacher assignment, parent contact, and conversion result.', exportLabel: 'Export Trials' },
  classes: { eyebrow: 'CLASS OPERATIONS', title: 'Classes', subtitle: 'Manage scheduled classes, meeting links, lesson notes, homework, attendance, and reschedules.', exportLabel: 'Export Classes' },
  attendance: { eyebrow: 'ATTENDANCE', title: 'Attendance', subtitle: 'Monitor attendance patterns by student, teacher, class, and program.', exportLabel: 'Export Attendance' },
  payments: { eyebrow: 'FINANCE', title: 'Payments', subtitle: 'Review package status, payment collection, teacher cost, invoices, and next due dates.', exportLabel: 'Export Payments' },
  reports: { eyebrow: 'REPORTS & INSIGHTS', title: 'Reports & Insights', subtitle: 'Track academy health across admissions, attendance, academics, teachers, and finance.', exportLabel: 'Export Reports' },
  settings: { eyebrow: 'SYSTEM SETTINGS', title: 'Settings', subtitle: 'Configure academy defaults, communication preferences, and dashboard access rules.', exportLabel: 'Export Permissions' },
};

function buildStats(section: AdminSection, rows: GenericRow[]) {
  const total = rows.length;
  const active = rows.filter((row) => ['active', 'present', 'paid', 'completed'].includes(String(row.status).toLowerCase())).length;
  const pending = rows.filter((row) => ['pending', 'setup pending', 'scheduled', 'late'].includes(String(row.status).toLowerCase())).length;
  const risk = rows.filter((row) => ['absent', 'overdue', 'cancelled'].includes(String(row.status).toLowerCase())).length;

  if (section === 'payments') {
    return [
      { label: 'Paid', value: rows.filter((row) => row.status === 'paid').length, trend: 'Receipts available', icon: 'award' },
      { label: 'Pending', value: rows.filter((row) => row.status === 'pending').length, trend: 'Record payment', icon: 'clock' },
      { label: 'Overdue', value: rows.filter((row) => row.status === 'overdue').length, trend: 'Needs follow-up', icon: 'shieldCheck' },
      { label: 'Remaining Sessions', value: rows.reduce((sum, row) => sum + Number(row.remainingSessions || 0), 0), trend: 'Across packages', icon: 'calendar' },
    ];
  }

  if (section === 'reports') {
    return [
      { label: 'Report Records', value: total, trend: 'Calculated from Supabase records', icon: 'chart' },
      { label: 'Completed', value: active, trend: 'Ready to view', icon: 'checkCircle' },
      { label: 'Scheduled', value: pending, trend: 'Recurring reports', icon: 'clock' },
      { label: 'Exports', value: rows.length ? 'CSV' : 0, trend: 'Current filtered rows', icon: 'download' },
    ];
  }

  if (section === 'settings') {
    return [
      { label: 'Permission Rows', value: rows.length, trend: 'Loaded from settings data', icon: 'shieldCheck' },
      { label: 'Enabled Areas', value: active, trend: 'Active permission areas', icon: 'checkCircle' },
      { label: 'Pending Setup', value: pending, trend: 'Settings requiring action', icon: 'clock' },
      { label: 'Attention', value: risk, trend: 'Settings requiring review', icon: 'message' },
    ];
  }

  return [
    { label: 'Records', value: total, trend: 'Operational rows', icon: 'chart' },
    { label: 'Active / Complete', value: active, trend: 'Healthy workflow', icon: 'checkCircle' },
    { label: 'Pending', value: pending, trend: 'Needs action', icon: 'clock' },
    { label: 'Attention', value: risk, trend: 'Follow-up required', icon: 'shieldCheck' },
  ];
}

export default function AdminSectionPage({ section }: { section: AdminSection }) {
  const navigate = useNavigate();
  const page = pageCopy[section];
  const [studentRows, setStudentRows] = useState<GenericRow[] | null>(null);
  const [selectedRow, setSelectedRow] = useState<GenericRow | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeReportTab, setActiveReportTab] = useState<(typeof reportTabs)[number]>('Admissions');
  const [activeSettingsTab, setActiveSettingsTab] = useState<(typeof settingsTabs)[number]>('Academy Info');

  function notify(message: string, type: ToastMessage['type'] = 'info') {
    setToast({ type, message });
  }

  useEffect(() => {
    if (section !== 'students') {
      return;
    }

    fetchStudentManagementRows()
      .then((rows) => {
        if (rows.length) {
          setStudentRows(rows as GenericRow[]);
        }
      })
      .catch(() => setStudentRows(null));
  }, [section]);

  const rows = useMemo(() => buildRows(section, studentRows), [section, studentRows]);
  const stats = useMemo(() => buildStats(section, rows), [rows, section]);

  const primaryAction = (row: GenericRow): DashboardPrimaryAction => {
    const openDrawer = () => setSelectedRow(row);

    if (section === 'students') {
      return { label: 'Open Record', onClick: () => navigate(`/dashboard/admin/students/${row.id}`), variant: 'primary' };
    }

    if (section === 'teachers') {
      return { label: 'View Profile', onClick: openDrawer, variant: 'primary' };
    }

    if (section === 'free-trials') {
      return { label: 'Review Trial', onClick: openDrawer, variant: 'primary' };
    }

    if (section === 'classes') {
      return { label: 'Class Details', onClick: openDrawer, variant: 'primary' };
    }

    if (section === 'attendance') {
      return { label: 'Review Attendance', onClick: openDrawer, variant: 'primary' };
    }

    if (section === 'payments') {
      return { label: paymentActionLabel(row), onClick: openDrawer, variant: row.status === 'overdue' ? 'danger' : 'primary' };
    }

    if (section === 'reports') {
      return { label: reportActionLabel(row), onClick: openDrawer, variant: 'primary' };
    }

    return { label: 'Edit Permissions', onClick: openDrawer, variant: 'primary' };
  };

  const actions = (row: GenericRow): DashboardMenuAction[] => {
    const openDrawer = () => setSelectedRow(row);

    if (section === 'students') {
      return [
        { label: 'Complete Setup', onClick: openDrawer, disabled: Boolean(row.setupReady) },
        { label: 'Assign Teacher', onClick: () => notify('Assign Teacher drawer is prepared for live teacher assignment.') },
        { label: 'Set Schedule', onClick: () => notify('Set Schedule action is prepared for class scheduling.') },
        { label: 'Update Level', onClick: () => notify('Update Level action is prepared for placement updates.') },
        { label: 'View Attendance', onClick: openDrawer },
        { label: 'View Payments', onClick: openDrawer },
        { label: 'Deactivate Student', onClick: () => notify('Deactivate Student action is prepared for status updates.'), danger: true },
      ];
    }

    if (section === 'teachers') {
      return [
        { label: 'Edit Academic Profile', onClick: openDrawer },
        { label: 'Update Availability', onClick: () => notify('Teacher availability action prepared.') },
        { label: 'View Assigned Students', onClick: openDrawer },
        { label: 'View Trials', onClick: openDrawer },
        { label: 'View Documents', onClick: openDrawer },
        { label: String(row.status) === 'active' ? 'Deactivate' : 'Activate', onClick: () => notify('Teacher status action prepared.'), danger: row.status === 'active' },
      ];
    }

    if (section === 'free-trials') {
      return [
        { label: 'Assign Teacher', onClick: openDrawer },
        { label: 'Reschedule Trial', onClick: () => notify('Reschedule Trial action prepared.') },
        { label: 'Open Meeting', onClick: () => notify('Meeting link action prepared.') },
        { label: 'Send Reminder', onClick: () => notify('Reminder action prepared for communication integration.') },
        { label: 'Mark Completed', onClick: () => notify('Trial completion action prepared.') },
        { label: 'Mark No Show', onClick: () => notify('No-show action prepared.'), danger: true },
        { label: 'View Feedback', onClick: openDrawer },
        { label: 'Convert to Student', onClick: openDrawer },
      ];
    }

    if (section === 'classes') {
      return [
        { label: 'Open Meeting', onClick: () => notify('Meeting link action prepared.') },
        { label: 'View Attendance', onClick: openDrawer },
        { label: 'View Teacher Report', onClick: openDrawer },
        { label: 'Set Homework', onClick: () => notify('Set Homework action prepared.') },
        { label: 'Reschedule Class', onClick: () => notify('Reschedule Class action prepared.') },
        { label: 'Cancel Class', onClick: () => notify('Cancel Class action prepared.'), danger: true },
      ];
    }

    if (section === 'attendance') {
      return [
        { label: 'Confirm Attendance', onClick: () => notify('Attendance confirmed.') },
        { label: 'Request Correction', onClick: () => notify('Correction request prepared.') },
        { label: 'Contact Parent', onClick: () => notify('Parent contact action prepared.') },
        { label: 'Mark Follow-up Done', onClick: () => notify('Parent follow-up marked done.') },
      ];
    }

    if (section === 'payments') {
      return [
        { label: 'Create Invoice', onClick: () => notify('Invoice creation action prepared.') },
        { label: 'View Invoice', onClick: openDrawer },
        { label: 'Download Receipt', onClick: () => notify('Receipt export prepared.'), disabled: row.status !== 'paid' },
        { label: 'Contact Parent', onClick: () => notify('Payment follow-up action prepared.') },
        { label: 'Mark as Paid', onClick: () => notify('Mark as Paid action prepared.'), disabled: row.status === 'paid' },
        { label: 'Upload Receipt', onClick: () => notify('Receipt upload action prepared.') },
        { label: 'Mark as Overdue', onClick: () => notify('Mark as Overdue action prepared.'), danger: true },
      ];
    }

    if (section === 'reports') {
      return [
        { label: 'Export Report', onClick: () => exportRows('reports', [row]) },
        { label: 'Schedule Report', onClick: () => notify('Report scheduling action prepared.') },
      ];
    }

    return [
      { label: 'Configure Notifications', onClick: () => setActiveSettingsTab('Notifications') },
      { label: 'Configure Timezone', onClick: () => setActiveSettingsTab('Schedule Defaults') },
    ];
  };

  const columns = useMemo<Array<DataTableColumn<GenericRow>>>(() => {
    if (section === 'students') {
      return [
        { header: 'Student', accessor: (row) => <DetailCell primary={row.name} secondary={row.setupReady ? 'Enrollment ready' : 'Setup incomplete'} /> },
        { header: 'Program', accessor: 'program' },
        { header: 'Teacher', accessor: 'teacher' },
        { header: 'Level', accessor: 'level' },
        statusColumn(),
        { header: 'Next Class', accessor: 'nextClass' },
        createActionsColumn('Student', primaryAction, actions),
      ];
    }

    if (section === 'teachers') {
      return [
        { header: 'Teacher', accessor: 'name' },
        { header: 'Specialization', accessor: 'specialization' },
        { header: 'Students', accessor: 'students' },
        { header: 'Trials', accessor: 'trials' },
        { header: 'Availability', accessor: 'availability' },
        statusColumn(),
        createActionsColumn('Teacher', primaryAction, actions),
      ];
    }

    if (section === 'free-trials') {
      return [
        { header: 'Student / Lead', accessor: 'student' },
        { header: 'Program', accessor: 'program' },
        { header: 'Date/time', accessor: 'dateTime' },
        { header: 'Teacher', accessor: 'teacher' },
        statusColumn(),
        createActionsColumn('Trial', primaryAction, actions),
      ];
    }

    if (section === 'classes') {
      return [
        { header: 'Time', accessor: 'time' },
        { header: 'Class', accessor: 'className' },
        { header: 'Teacher', accessor: 'teacher' },
        { header: 'Students', accessor: 'students' },
        { header: 'Teacher report?', accessor: (row) => <StatusBadge label={String(row.reportSubmitted)} tone={statusTone(String(row.reportSubmitted))} /> },
        statusColumn(),
        createActionsColumn('Class', primaryAction, actions),
      ];
    }

    if (section === 'attendance') {
      return [
        { header: 'Student', accessor: 'student' },
        { header: 'Program', accessor: 'program' },
        { header: 'Teacher', accessor: 'teacher' },
        { header: 'Class', accessor: 'className' },
        statusColumn(),
        { header: 'Parent Follow-up', accessor: (row) => (row.status === 'absent' || row.status === 'late' ? <StatusBadge label="Needs parent follow-up" tone="warning" /> : 'Not required') },
        createActionsColumn('Attendance', primaryAction, actions),
      ];
    }

    if (section === 'payments') {
      return [
        { header: 'Student', accessor: 'student' },
        { header: 'Program', accessor: 'program' },
        { header: 'Package', accessor: 'packageName' },
        { header: 'Amount', accessor: 'amount' },
        { header: 'Currency', accessor: 'currency' },
        statusColumn(),
        { header: 'Next Due', accessor: 'nextDue' },
        { header: 'Remaining Sessions', accessor: 'remainingSessions' },
        createActionsColumn('Payment', primaryAction, actions),
      ];
    }

    if (section === 'reports') {
      return [
        { header: 'Report', accessor: 'report' },
        { header: 'Category', accessor: 'category' },
        { header: 'Owner', accessor: 'owner' },
        { header: 'Period', accessor: 'period' },
        statusColumn(),
        { header: 'Metric', accessor: 'metric' },
        createActionsColumn('Report', primaryAction, actions),
      ];
    }

    return [
      { header: 'Area', accessor: 'area' },
      { header: 'Super Admin', accessor: (row) => <StatusBadge label={row.superAdmin ? 'enabled' : 'disabled'} tone={row.superAdmin ? 'success' : 'neutral'} /> },
      { header: 'Admin', accessor: (row) => <StatusBadge label={row.admin ? 'enabled' : 'disabled'} tone={row.admin ? 'success' : 'neutral'} /> },
      { header: 'Teacher', accessor: (row) => <StatusBadge label={row.teacher ? 'enabled' : 'disabled'} tone={row.teacher ? 'success' : 'neutral'} /> },
      { header: 'Student', accessor: (row) => <StatusBadge label={row.student ? 'enabled' : 'disabled'} tone={row.student ? 'success' : 'neutral'} /> },
      { header: 'Finance', accessor: (row) => <StatusBadge label={row.finance ? 'enabled' : 'disabled'} tone={row.finance ? 'success' : 'neutral'} /> },
      createActionsColumn('Permission', primaryAction, actions),
    ];
  }, [section, navigate, rows]);

  const visibleRows = section === 'reports'
    ? rows.filter((row) => row.category === activeReportTab)
    : rows;
  const visibleActive = visibleRows.filter((row) => ['active', 'present', 'paid', 'completed'].includes(String(row.status).toLowerCase())).length;
  const visiblePending = visibleRows.filter((row) => ['pending', 'setup pending', 'scheduled', 'late'].includes(String(row.status).toLowerCase())).length;
  const visibleRisk = visibleRows.filter((row) => ['absent', 'overdue', 'cancelled'].includes(String(row.status).toLowerCase())).length;

  return (
    <div className="dashboard-page dashboard-page--management">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardPageHeader
        eyebrow={page.eyebrow}
        title={page.title}
        subtitle={page.subtitle}
        action={(
          <div className="dashboard-page-actions">
            {section === 'settings' && <ActionButton variant="copper" onClick={() => notify('Settings saved for this session.', 'success')}>Save Settings</ActionButton>}
            <ActionButton variant="secondary" onClick={() => exportRows(section, visibleRows)}>
              <Icon name="download" size={18} />
              {page.exportLabel}
            </ActionButton>
          </div>
        )}
      />

      <div className="dashboard-stats-grid">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      {section === 'reports' && (
        <div className="admin-tabs" role="tablist" aria-label="Report sections">
          {reportTabs.map((tab) => (
            <button key={tab} type="button" className={activeReportTab === tab ? 'is-active' : ''} onClick={() => setActiveReportTab(tab)}>{tab}</button>
          ))}
        </div>
      )}

      {section === 'settings' && (
        <div className="admin-tabs admin-tabs--settings" role="tablist" aria-label="Settings sections">
          {settingsTabs.map((tab) => (
            <button key={tab} type="button" className={activeSettingsTab === tab ? 'is-active' : ''} onClick={() => setActiveSettingsTab(tab)}>{tab}</button>
          ))}
        </div>
      )}

      {section === 'settings' && activeSettingsTab !== 'Roles & Permissions' ? (
        <SectionCard
          title={activeSettingsTab}
          subtitle="Configure academy defaults from the secure admin settings workflow."
          action={<ActionButton variant="copper" onClick={() => notify(`${activeSettingsTab} settings saved.`, 'success')}>Save Settings</ActionButton>}
        >
          <div className="admin-settings-panel">
            <label><span>Primary setting</span><input defaultValue={activeSettingsTab === 'Academy Info' ? 'Musliman Academy' : `${activeSettingsTab} default`} /></label>
            <label><span>Operational owner</span><select defaultValue="admin"><option value="admin">Admin Team</option><option value="academic">Academic Manager</option><option value="finance">Finance</option></select></label>
            <label><span>Status</span><select defaultValue="enabled"><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
            <div className="dashboard-form-actions">
              {activeSettingsTab === 'Programs' && <ActionButton variant="secondary" onClick={() => notify('Add Program action prepared.')}>Add Program</ActionButton>}
              {activeSettingsTab === 'Notifications' && <ActionButton variant="secondary" onClick={() => notify('Notification templates action prepared.')}>Configure Notifications</ActionButton>}
              {activeSettingsTab === 'Integrations' && <ActionButton variant="secondary" onClick={() => notify('WhatsApp and email integration action prepared.')}>Configure WhatsApp/Email</ActionButton>}
              {activeSettingsTab === 'Schedule Defaults' && <ActionButton variant="secondary" onClick={() => notify('Timezone settings action prepared.')}>Configure Timezone</ActionButton>}
            </div>
          </div>
        </SectionCard>
      ) : (
        <div className={section === 'reports' ? 'dashboard-grid dashboard-grid--two' : ''}>
          <SectionCard
            title={section === 'settings' ? 'Roles & Permissions' : page.title}
            subtitle={section === 'settings' ? 'Role defaults for dashboard access and operational permissions.' : `${page.title} operational records`}
          >
            <BasicTable rows={visibleRows} columns={columns} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
          </SectionCard>

          {section === 'reports' && (
            <SectionCard title="Health Snapshot" subtitle={`${activeReportTab} report signals`}>
              {visibleRows.length ? (
                <div className="dashboard-insight-list">
                  <ProgressBar value={Math.round((visibleActive / visibleRows.length) * 100)} label="Completed report records" />
                  <ProgressBar value={Math.round((visiblePending / visibleRows.length) * 100)} label="Pending report records" />
                  <ProgressBar value={Math.round((visibleRisk / visibleRows.length) * 100)} label="Records requiring attention" />
                </div>
              ) : (
                <EmptyState title="No report data yet" description="Supabase report records will appear here when available." />
              )}
            </SectionCard>
          )}
        </div>
      )}

      {selectedRow && (
        <DetailDrawer
          content={getDrawerContent(section, selectedRow, notify, navigate)}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
