import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu, { type DashboardMenuAction, type DashboardPrimaryAction } from '../components/DashboardActionMenu';
import DashboardDrawer from '../components/DashboardDrawer';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import ProgressBar from '../components/ProgressBar';
import ProgramSelect from '../components/ProgramSelect';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { type ToastMessage } from '../components/Toast';
import { useAuth, type AuthRole } from '../auth/AuthProvider';
import {
  adminPayments,
  adminReports,
  adminStudents,
  freeTrials,
  recentClasses,
  rolePermissionMatrix,
} from '../data/mockData';
import {
  assignStudentTeacher,
  deactivateStudent,
  fetchStudentActionLookups,
  fetchStudentAttendanceRecords,
  fetchStudentManagementRows,
  fetchStudentPaymentRecords,
  updateStudentLevel,
  updateStudentProgram,
  updateStudentSchedule,
  updateStudentSetup,
  type StudentActionTeacher,
  type StudentAttendanceRecord,
  type StudentPaymentRecord,
  type StudentProgramOption,
} from '../services/studentsService';
import { fetchAdminTeacherRows } from '../services/teachersService';
import { usePrograms } from '../services/programsService';

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
type AdminActionType =
  | 'view_record'
  | 'complete_setup'
  | 'set_program'
  | 'assign_teacher'
  | 'set_schedule'
  | 'update_level'
  | 'view_attendance'
  | 'view_payments'
  | 'deactivate_student'
  | 'view_details'
  | 'edit_profile'
  | 'update_availability'
  | 'view_assigned_students'
  | 'view_trials'
  | 'record_payment'
  | 'mark_paid'
  | 'mark_overdue'
  | 'set_homework'
  | 'reschedule'
  | 'cancel';
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
const studentProgramManagerRoles: AuthRole[] = ['super_admin', 'admin', 'academic_manager'];

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
              onClick={action.onClick || onClose}
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
  enableProgramFilter = false,
}: {
  rows: GenericRow[];
  columns: Array<DataTableColumn<GenericRow>>;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  enableProgramFilter?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const { programs: filterPrograms } = usePrograms();
  const statuses = useMemo(() => Array.from(new Set(rows.map((row) => String(row.status || '')).filter(Boolean))), [rows]);
  const selectedProgramName = filterPrograms.find((program) => program.id === programFilter)?.name || '';
  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesStatus = statusFilter === 'all' || String(row.status || '').toLowerCase() === statusFilter;
    const matchesProgram = !enableProgramFilter
      || programFilter === 'all'
      || row.programId === programFilter
      || row.program_id === programFilter
      || row.program === selectedProgramName
      || row.programName === selectedProgramName;
    return matchesStatus && matchesProgram && rowMatches(row, search);
  }), [enableProgramFilter, programFilter, rows, search, selectedProgramName, statusFilter]);

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
        {enableProgramFilter && <ProgramSelect label="Program" value={programFilter} onChange={setProgramFilter} includeAllOption />}
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
      programId: row.programId || row.program_id || null,
      program: program || 'Program not assigned',
      assignedTeacherId: row.assignedTeacherId || row.assigned_teacher_id || null,
      teacher: teacher || 'Teacher unassigned',
      level: level || 'Placement pending',
      attendance: row.attendance || row.attendanceRate || 'Not started',
      status: incomplete ? 'setup pending' : String(row.status || 'active'),
      nextClass: nextClass || 'Schedule pending',
      scheduleNotes: row.scheduleNotes || row.schedule_notes || null,
      startDate: row.startDate || row.start_date || null,
      setupReady: !incomplete,
    };
  });
}

function buildRows(section: AdminSection, studentRows: GenericRow[] | null, teacherRows: GenericRow[] | null): GenericRow[] {
  if (section === 'students') {
    return normalizeStudents(studentRows || []);
  }

  if (section === 'teachers') {
    return teacherRows || [];
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
        { label: 'Close', tone: 'secondary' },
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
        { label: 'View Assigned Students', onClick: () => navigate('/dashboard/admin/students') },
        { label: 'View Trials', tone: 'secondary', onClick: () => navigate('/dashboard/admin/free-trials') },
        { label: 'Close', tone: 'secondary' },
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
        { label: 'Open Leads CRM', onClick: () => navigate('/dashboard/admin/leads') },
        { label: 'View Feedback', tone: 'secondary' },
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
        { label: 'Open Meeting', onClick: () => row.meeting && row.meeting !== 'Pending' ? window.open(String(row.meeting), '_blank', 'noopener,noreferrer') : notify('Meeting link is not available.', 'info') },
        { label: 'View Attendance', tone: 'secondary', onClick: () => navigate('/dashboard/admin/attendance') },
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
        { label: 'Confirm Attendance', onClick: () => notify('Attendance confirmed.', 'success') },
        { label: 'View Student', tone: 'secondary', onClick: () => navigate('/dashboard/admin/students') },
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
        { label: isPaid ? 'View Receipt' : 'Record Payment', onClick: () => navigate('/dashboard/admin/payments') },
        { label: row.status === 'overdue' ? 'Contact Parent' : 'View Invoice', tone: 'secondary', onClick: () => navigate('/dashboard/admin/payments') },
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
        { label: 'Export Report', tone: 'secondary', onClick: () => exportRows('reports', [row]) },
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
    actions: [],
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

const studentRecordTabs = ['Overview', 'Personal & Parent Info', 'Academic Setup', 'Schedule', 'Attendance', 'Payments', 'Notes'] as const;
type StudentRecordDrawerTab = (typeof studentRecordTabs)[number];

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function FieldValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span>
      {label}
      <strong>{value || '-'}</strong>
    </span>
  );
}

function MissingFields({ row }: { row: GenericRow }) {
  const missing = [
    !row.assignedTeacherId && 'Assigned teacher',
    (!row.programId && String(row.program).includes('not assigned')) && 'Program',
    String(row.level).includes('pending') && 'Level',
    String(row.nextClass).includes('pending') && 'Schedule',
    !row.scheduleNotes && 'Timezone / class notes',
  ].filter(Boolean);

  if (!missing.length) {
    return <StatusBadge label="Setup complete" tone="success" />;
  }

  return (
    <div className="admin-action-missing-list">
      {missing.map((item) => <StatusBadge key={String(item)} label={String(item)} tone="warning" />)}
    </div>
  );
}

function SetProgramDrawer({
  row,
  saving,
  onClose,
  onSubmit,
}: {
  row: GenericRow;
  saving: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const canWrite = isUuid(row.id);
  const formId = 'student-set-program-form';

  return (
    <DashboardDrawer
      title="Set Program"
      subtitle="Assign or update the student's academic program."
      size="md"
      onClose={onClose}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="submit" form={formId} variant="copper" disabled={saving || !canWrite}>{saving ? 'Saving' : 'Save Program'}</ActionButton>
        </>
      )}
    >
      {!canWrite && <p className="dashboard-inline-error">This action requires a live Supabase student record.</p>}
      <form id={formId} className="dashboard-form" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>
        <label><span>Student</span><input value={String(row.name)} readOnly /></label>
        <label><span>Current Program</span><input value={String(row.program || 'Program not assigned')} readOnly /></label>
        <ProgramSelect label="Program" name="programId" value={String(row.programId || '')} required />
        <label><span>Optional note</span><textarea name="notes" rows={4} placeholder="Add an academic note about this program update..." /></label>
      </form>
    </DashboardDrawer>
  );
}

function StudentActionDrawer({
  action,
  row,
  teachers,
  programs,
  attendanceRecords,
  paymentRecords,
  recordTab,
  saving,
  onRecordTabChange,
  onClose,
  onNavigateRecord,
  onSubmit,
}: {
  action: AdminActionType;
  row: GenericRow;
  teachers: StudentActionTeacher[];
  programs: StudentProgramOption[];
  attendanceRecords: StudentAttendanceRecord[];
  paymentRecords: StudentPaymentRecord[];
  recordTab: StudentRecordDrawerTab;
  saving: boolean;
  onRecordTabChange: (tab: StudentRecordDrawerTab) => void;
  onClose: () => void;
  onNavigateRecord: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const canWrite = isUuid(row.id);
  const selectedTeacher = teachers.find((teacher) => teacher.id === row.assignedTeacherId);
  const selectedProgram = programs.find((program) => program.id === row.programId);
  const attendanceTotal = attendanceRecords.length;
  const attendanceCounts = attendanceRecords.reduce<Record<string, number>>((summary, record) => {
    summary[record.status] = (summary[record.status] || 0) + 1;
    return summary;
  }, {});
  const presentCount = (attendanceCounts.present || 0) + (attendanceCounts.late || 0);
  const attendanceRate = attendanceTotal ? `${Math.round((presentCount / attendanceTotal) * 100)}%` : '0%';
  const latestPayment = paymentRecords[0];
  const titleByAction: Record<AdminActionType, string> = {
    view_record: 'Student Record',
    complete_setup: 'Complete Student Setup',
    set_program: 'Set Program',
    assign_teacher: 'Assign Teacher',
    set_schedule: 'Set Schedule',
    update_level: 'Update Level',
    view_attendance: 'Attendance',
    view_payments: 'Payments',
    deactivate_student: 'Deactivate Student',
    view_details: 'Details',
    edit_profile: 'Edit Profile',
    update_availability: 'Update Availability',
    view_assigned_students: 'Assigned Students',
    view_trials: 'Trials',
    record_payment: 'Record Payment',
    mark_paid: 'Mark as Paid',
    mark_overdue: 'Mark as Overdue',
    set_homework: 'Set Homework',
    reschedule: 'Reschedule',
    cancel: 'Cancel',
  };
  const formId = `student-action-${action}`;

  if (action === 'set_program') {
    return <SetProgramDrawer row={row} saving={saving} onClose={onClose} onSubmit={onSubmit} />;
  }

  if (action === 'view_record') {
    return (
      <DashboardDrawer
        title={String(row.name)}
        subtitle="Student record from live academy data. Empty fields mean no record has been saved yet."
        size="xl"
        onClose={onClose}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={onNavigateRecord}>Open Full Page</ActionButton>
            <ActionButton variant="copper" onClick={onClose}>Done</ActionButton>
          </>
        )}
      >
        <div className="admin-tabs" role="tablist" aria-label="Student record sections">
          {studentRecordTabs.map((tab) => (
            <button key={tab} type="button" className={recordTab === tab ? 'is-active' : ''} onClick={() => onRecordTabChange(tab)}>{tab}</button>
          ))}
        </div>
        {recordTab === 'Overview' && (
          <div className="lead-summary-grid">
            <FieldValue label="Student" value={row.name} />
            <FieldValue label="Status" value={<StatusBadge label={String(row.status)} tone={statusTone(String(row.status))} />} />
            <FieldValue label="Program" value={row.program} />
            <FieldValue label="Teacher" value={row.teacher} />
            <FieldValue label="Level" value={row.level} />
            <FieldValue label="Attendance rate" value={attendanceRate} />
          </div>
        )}
        {recordTab === 'Personal & Parent Info' && (
          <div className="lead-summary-grid">
            <FieldValue label="Student name" value={row.name} />
            <FieldValue label="Parent name" value={row.parentName} />
            <FieldValue label="Parent WhatsApp" value={row.whatsapp} />
            <FieldValue label="Country" value={row.country} />
            <FieldValue label="Age" value={row.age} />
          </div>
        )}
        {recordTab === 'Academic Setup' && (
          <div className="lead-summary-grid">
            <FieldValue label="Program" value={selectedProgram?.name || row.program} />
            <FieldValue label="Teacher" value={selectedTeacher?.full_name || row.teacher} />
            <FieldValue label="Level" value={row.level} />
            <FieldValue label="Start date" value={row.startDate} />
            <FieldValue label="Missing setup" value={<MissingFields row={row} />} />
          </div>
        )}
        {recordTab === 'Schedule' && (
          <div className="lead-summary-grid">
            <FieldValue label="Next class" value={row.nextClass} />
            <FieldValue label="Schedule notes" value={row.scheduleNotes} />
          </div>
        )}
        {recordTab === 'Attendance' && (
          <div className="admin-action-list">
            <div className="lead-summary-grid">
              <FieldValue label="Attendance rate" value={attendanceRate} />
              <FieldValue label="Total classes" value={attendanceTotal} />
              <FieldValue label="Present" value={attendanceCounts.present || 0} />
              <FieldValue label="Absent" value={attendanceCounts.absent || 0} />
              <FieldValue label="Late" value={attendanceCounts.late || 0} />
              <FieldValue label="Excused" value={attendanceCounts.excused || 0} />
            </div>
            {attendanceRecords.map((record) => (
              <article key={record.id} className="admin-action-row">
                <strong>{record.classDate || record.marked_at || 'Class date not recorded'}</strong>
                <span>{record.classTime || '-'} - {record.notes || 'No note'}</span>
                <StatusBadge label={record.status} tone={statusTone(record.status)} />
              </article>
            ))}
            {!attendanceRecords.length && <EmptyState title="No attendance records" description="Attendance records will appear after classes are submitted." />}
          </div>
        )}
        {recordTab === 'Payments' && (
          <div className="admin-action-list">
            <div className="lead-summary-grid">
              <FieldValue label="Current package" value={latestPayment?.notes || 'No package record'} />
              <FieldValue label="Payment status" value={latestPayment?.status || 'No payment record'} />
              <FieldValue label="Next due date" value={latestPayment?.next_due_date} />
              <FieldValue label="Remaining sessions" value="-" />
            </div>
            {paymentRecords.map((payment) => (
              <article key={payment.id} className="admin-action-row">
                <strong>{payment.currency || 'USD'} {payment.amount ?? 0}</strong>
                <span>{payment.payment_date || 'No payment date'} - {payment.payment_method || 'Method not recorded'}</span>
                <StatusBadge label={payment.status || 'pending'} tone={statusTone(payment.status || 'pending')} />
              </article>
            ))}
            {!paymentRecords.length && <EmptyState title="No payments" description="Payment records will appear after finance records a package or payment." />}
          </div>
        )}
        {recordTab === 'Notes' && <p className="dashboard-empty-copy">{row.scheduleNotes || 'No notes recorded.'}</p>}
      </DashboardDrawer>
    );
  }

  if (action === 'view_attendance') {
    return (
      <DashboardDrawer title={`${row.name} Attendance`} subtitle="Read-only attendance summary." size="lg" onClose={onClose} footer={<ActionButton onClick={onClose}>Close</ActionButton>}>
        <div className="lead-summary-grid">
          <FieldValue label="Attendance rate" value={attendanceRate} />
          <FieldValue label="Total classes" value={attendanceTotal} />
          <FieldValue label="Present" value={attendanceCounts.present || 0} />
          <FieldValue label="Absent" value={attendanceCounts.absent || 0} />
          <FieldValue label="Late" value={attendanceCounts.late || 0} />
          <FieldValue label="Excused" value={attendanceCounts.excused || 0} />
        </div>
        <div className="admin-action-list">
          {attendanceRecords.map((record) => (
            <article key={record.id} className="admin-action-row">
              <strong>{record.classDate || record.marked_at || 'Date not recorded'}</strong>
              <span>{record.notes || 'No note'}</span>
              <StatusBadge label={record.status} tone={statusTone(record.status)} />
            </article>
          ))}
          {!attendanceRecords.length && <EmptyState title="No attendance records" description="No attendance has been submitted for this student yet." />}
        </div>
      </DashboardDrawer>
    );
  }

  if (action === 'view_payments') {
    return (
      <DashboardDrawer title={`${row.name} Payments`} subtitle="Package and payment history from finance records." size="lg" onClose={onClose} footer={<ActionButton onClick={onClose}>Close</ActionButton>}>
        <div className="lead-summary-grid">
          <FieldValue label="Current package" value={latestPayment?.notes || 'No package record'} />
          <FieldValue label="Payment status" value={latestPayment?.status || 'No payment record'} />
          <FieldValue label="Next due date" value={latestPayment?.next_due_date} />
          <FieldValue label="Remaining sessions" value="-" />
        </div>
        <div className="dashboard-form-actions">
          <ActionButton variant="secondary" disabled>Record Payment requires finance workflow</ActionButton>
          <ActionButton variant="secondary" disabled>View Receipt requires receipt file</ActionButton>
          <ActionButton variant="secondary" disabled={latestPayment?.status === 'overdue'}>Mark Overdue requires payment record</ActionButton>
        </div>
        <div className="admin-action-list">
          {paymentRecords.map((payment) => (
            <article key={payment.id} className="admin-action-row">
              <strong>{payment.currency || 'USD'} {payment.amount ?? 0}</strong>
              <span>{payment.payment_date || 'No payment date'} - next due {payment.next_due_date || '-'}</span>
              <StatusBadge label={payment.status || 'pending'} tone={statusTone(payment.status || 'pending')} />
            </article>
          ))}
          {!paymentRecords.length && <EmptyState title="No payments" description="No payment history is recorded for this student yet." />}
        </div>
      </DashboardDrawer>
    );
  }

  if (action === 'deactivate_student') {
    return (
      <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Deactivate ${row.name}`}>
        <button className="dashboard-modal__backdrop" type="button" aria-label="Close deactivation confirmation" onClick={onClose} />
        <section className="dashboard-modal__panel dashboard-modal__panel--small">
          <div className="dashboard-modal__header">
            <div>
              <h2>Deactivate Student</h2>
              <p>This changes status only. Student records, attendance, and payments are not deleted.</p>
            </div>
            <button type="button" className="dashboard-icon-button" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
          </div>
          <form id={formId} className="dashboard-form" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>
            <div className="lead-summary-grid"><FieldValue label="Student" value={row.name} /></div>
            <label><span>Reason</span><textarea name="reason" rows={4} required /></label>
            {!canWrite && <p className="dashboard-inline-error">This action requires a live Supabase student record.</p>}
            <div className="dashboard-form-actions">
              <ActionButton type="submit" variant="danger" disabled={saving || !canWrite}>{saving ? 'Deactivating' : 'Deactivate Student'}</ActionButton>
              <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <DashboardDrawer
      title={titleByAction[action]}
      subtitle={String(row.name)}
      size="lg"
      onClose={onClose}
      footer={(
        <>
          <ActionButton type="submit" form={formId} variant="copper" disabled={saving || !canWrite}>{saving ? 'Saving' : 'Save'}</ActionButton>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
        </>
      )}
    >
      {!canWrite && <p className="dashboard-inline-error">This action requires a live Supabase student record.</p>}
      {action === 'complete_setup' && <MissingFields row={row} />}
      <form id={formId} className="dashboard-form" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>
        {(action === 'complete_setup' || action === 'assign_teacher' || action === 'set_schedule') && (
          <>
            <label><span>Student</span><input value={String(row.name)} readOnly /></label>
            {(action === 'complete_setup' || action === 'set_schedule') && (
              <ProgramSelect label="Program" name="programId" value={String(row.programId || '')} />
            )}
            <label><span>Teacher</span><select name="teacherId" defaultValue={String(row.assignedTeacherId || '')} required={action === 'assign_teacher' || action === 'set_schedule'}><option value="">Unassigned</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}{teacher.specialization ? ` - ${teacher.specialization}` : ''}</option>)}</select></label>
            {action === 'assign_teacher' && <label><span>Current program</span><input value={String(row.program)} readOnly /></label>}
          </>
        )}
        {(action === 'complete_setup' || action === 'update_level') && (
          <label><span>{action === 'update_level' ? 'New level' : 'Level'}</span><input name="level" defaultValue={action === 'update_level' ? '' : String(row.level === 'Placement pending' ? '' : row.level)} required /></label>
        )}
        {(action === 'complete_setup' || action === 'set_schedule') && (
          <>
            <label><span>Class days</span><input name="classDays" defaultValue="" /></label>
            <label><span>Class time</span><input name="classTime" type="time" /></label>
            <label><span>Timezone</span><input name="timezone" defaultValue="Africa/Cairo" /></label>
            <label><span>Session duration</span><input name="durationMinutes" type="number" min="15" step="15" defaultValue="30" /></label>
            <label><span>Platform</span><select name="platform" defaultValue="Zoom"><option>Zoom</option><option>Google Meet</option><option>Academy Classroom</option></select></label>
            <label><span>Meeting link</span><input name="meetingLink" type="url" /></label>
            <label><span>Start date</span><input name="startDate" type="date" defaultValue={String(row.startDate || '')} /></label>
          </>
        )}
        {action === 'complete_setup' && <label><span>Package/payment status</span><input name="paymentStatus" /></label>}
        {action === 'update_level' && (
          <>
            <label><span>Current level</span><input value={String(row.level)} readOnly /></label>
            <label><span>Effective date</span><input name="effectiveDate" type="date" /></label>
          </>
        )}
        <label><span>{action === 'update_level' ? 'Reason / academic note' : 'Notes'}</span><textarea name="notes" rows={4} /></label>
      </form>
    </DashboardDrawer>
  );
}

const availabilityDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function TeacherProfileDrawer({
  row,
  onClose,
  onViewStudents,
  onViewSchedule,
}: {
  row: GenericRow;
  onClose: () => void;
  onViewStudents: () => void;
  onViewSchedule: () => void;
}) {
  return (
    <DashboardDrawer
      title={String(row.name || 'Teacher')}
      subtitle="Teacher profile, capacity, availability, and operational status."
      size="md"
      onClose={onClose}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onViewStudents}>Assign Students</ActionButton>
          <ActionButton variant="secondary" onClick={onViewSchedule}>View Schedule</ActionButton>
          <ActionButton variant="copper" onClick={onClose}>Done</ActionButton>
        </>
      )}
    >
      <div className="admin-teacher-drawer">
        <section className="admin-teacher-drawer__hero">
          <div className="admin-teacher-drawer__avatar">{String(row.name || 'T').slice(0, 1).toUpperCase()}</div>
          <div>
            <span className="dashboard-eyebrow">TEACHER PROFILE</span>
            <h3>{row.name}</h3>
            <p>{row.email || 'Email not set'}</p>
          </div>
          <StatusBadge label={String(row.status || 'active')} tone={statusTone(String(row.status || 'active'))} />
        </section>

        <section className="admin-teacher-drawer__section">
          <h3>Academic Profile</h3>
          <div className="lead-summary-grid">
            <FieldValue label="Specialization" value={row.specialization} />
            <FieldValue label="Availability" value={row.availability} />
            <FieldValue label="Phone" value={row.phone} />
            <FieldValue label="Profile ID" value={row.profileId} />
          </div>
        </section>

        <section className="admin-teacher-drawer__section">
          <h3>Capacity</h3>
          <div className="lead-summary-grid">
            <FieldValue label="Assigned students" value={row.students} />
            <FieldValue label="Upcoming classes" value={row.upcomingClasses} />
            <FieldValue label="Assigned trials" value={row.trials} />
            <FieldValue label="Status" value={<StatusBadge label={String(row.status || 'active')} tone={statusTone(String(row.status || 'active'))} />} />
          </div>
        </section>
      </div>
    </DashboardDrawer>
  );
}

function TeacherAvailabilityDrawer({
  row,
  onClose,
}: {
  row: GenericRow;
  onClose: () => void;
}) {
  const formId = 'teacher-availability-form';

  return (
    <DashboardDrawer
      title="Update Availability"
      subtitle="Set teacher weekly teaching availability."
      size="md"
      onClose={onClose}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="submit" form={formId} variant="copper">Save Availability</ActionButton>
        </>
      )}
    >
      <form id={formId} className="dashboard-form admin-availability-form" onSubmit={(event) => { event.preventDefault(); onClose(); }}>
        <label>
          <span>Teacher</span>
          <input value={String(row.name || 'Teacher')} readOnly />
        </label>
        <label>
          <span>Timezone</span>
          <select name="timezone" defaultValue="Africa/Cairo">
            <option value="Africa/Cairo">Africa/Cairo</option>
            <option value="Asia/Riyadh">Asia/Riyadh</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </label>

        <section className="admin-availability-form__week">
          <div className="admin-availability-form__heading">
            <h3>Weekly Availability</h3>
            <p>{row.availability || 'No availability details saved yet.'}</p>
          </div>

          {availabilityDays.map((day, index) => (
            <div className="admin-availability-day" key={day}>
              <label className="admin-availability-day__toggle">
                <input type="checkbox" name={`${day.toLowerCase()}Available`} defaultChecked={index < 5} />
                <span>{day}</span>
              </label>
              <label>
                <span>Start</span>
                <input type="time" name={`${day.toLowerCase()}Start`} defaultValue="09:00" />
              </label>
              <label>
                <span>End</span>
                <input type="time" name={`${day.toLowerCase()}End`} defaultValue="17:00" />
              </label>
              <label className="admin-availability-day__notes">
                <span>Notes</span>
                <input name={`${day.toLowerCase()}Notes`} placeholder="Optional notes" />
              </label>
            </div>
          ))}
        </section>
      </form>
    </DashboardDrawer>
  );
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
  const { role } = useAuth();
  const page = pageCopy[section];
  const [studentRows, setStudentRows] = useState<GenericRow[] | null>(null);
  const [teacherRows, setTeacherRows] = useState<GenericRow[] | null>(null);
  const [selectedRow, setSelectedRow] = useState<GenericRow | null>(null);
  const [activeAction, setActiveAction] = useState<AdminActionType | null>(null);
  const [teachers, setTeachers] = useState<StudentActionTeacher[]>([]);
  const [programs, setPrograms] = useState<StudentProgramOption[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<StudentPaymentRecord[]>([]);
  const [studentRecordTab, setStudentRecordTab] = useState<StudentRecordDrawerTab>('Overview');
  const [savingAction, setSavingAction] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeReportTab, setActiveReportTab] = useState<(typeof reportTabs)[number]>('Admissions');
  const [activeSettingsTab, setActiveSettingsTab] = useState<(typeof settingsTabs)[number]>('Academy Info');
  const canSetStudentProgram = Boolean(role && studentProgramManagerRoles.includes(role));

  function notify(message: string, type: ToastMessage['type'] = 'info') {
    setToast({ type, message });
  }

  async function loadStudentRows() {
    return fetchStudentManagementRows()
      .then((rows) => {
        if (rows.length) {
          setStudentRows(rows as GenericRow[]);
        }
      })
      .catch(() => setStudentRows(null));
  }

  async function loadTeacherRows() {
    return fetchAdminTeacherRows()
      .then((rows) => {
        setTeacherRows(rows as GenericRow[]);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('Admin teacher rows fetch failed:', error);
        }
        setTeacherRows([]);
      });
  }

  useEffect(() => {
    if (section !== 'students') {
      return;
    }

    loadStudentRows();
    fetchStudentActionLookups()
      .then((lookups) => {
        setTeachers(lookups.teachers);
        setPrograms(lookups.programs);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('Student action lookups failed:', error);
        }
        setTeachers([]);
        setPrograms([]);
      });
  }, [section]);

  useEffect(() => {
    if (section !== 'teachers') {
      return;
    }

    loadTeacherRows();
  }, [section]);

  const rows = useMemo(() => buildRows(section, studentRows, teacherRows), [section, studentRows, teacherRows]);
  const stats = useMemo(() => buildStats(section, rows), [rows, section]);

  useEffect(() => {
    if (!selectedRow || !activeAction || !isUuid(selectedRow.id)) {
      setAttendanceRecords([]);
      setPaymentRecords([]);
      return;
    }

    if (activeAction === 'view_record' || activeAction === 'view_attendance') {
      fetchStudentAttendanceRecords(String(selectedRow.id))
        .then(setAttendanceRecords)
        .catch(() => setAttendanceRecords([]));
    }

    if (activeAction === 'view_record' || activeAction === 'view_payments') {
      fetchStudentPaymentRecords(String(selectedRow.id))
        .then(setPaymentRecords)
        .catch(() => setPaymentRecords([]));
    }
  }, [activeAction, selectedRow]);

  function openAction(action: AdminActionType, row: GenericRow) {
    setSelectedRow(row);
    setActiveAction(action);
    if (action === 'view_record') {
      setStudentRecordTab('Overview');
    }
  }

  function closeAction() {
    setSelectedRow(null);
    setActiveAction(null);
    setAttendanceRecords([]);
    setPaymentRecords([]);
    setSavingAction(false);
  }

  async function handleStudentActionSubmit(formData: FormData) {
    if (!selectedRow || !activeAction || !isUuid(selectedRow.id)) {
      notify('This action requires a live Supabase student record.', 'error');
      return;
    }

    setSavingAction(true);

    try {
      if (activeAction === 'set_program') {
        const programId = String(formData.get('programId') || '');
        if (!programId) {
          notify('Select a program before saving.', 'error');
          return;
        }
        await updateStudentProgram(String(selectedRow.id), programId, String(formData.get('notes') || ''));
        notify('Program updated successfully.', 'success');
      }

      if (activeAction === 'assign_teacher') {
        await assignStudentTeacher(String(selectedRow.id), String(formData.get('teacherId') || ''), String(formData.get('notes') || ''));
        notify('Teacher assigned successfully.', 'success');
      }

      if (activeAction === 'complete_setup') {
        await updateStudentSetup(String(selectedRow.id), {
          programId: String(formData.get('programId') || '') || null,
          teacherId: String(formData.get('teacherId') || '') || null,
          level: String(formData.get('level') || ''),
          classDays: String(formData.get('classDays') || ''),
          classTime: String(formData.get('classTime') || ''),
          timezone: String(formData.get('timezone') || ''),
          paymentStatus: String(formData.get('paymentStatus') || ''),
          startDate: String(formData.get('startDate') || ''),
          notes: String(formData.get('notes') || ''),
        });
        notify('Student setup completed.', 'success');
      }

      if (activeAction === 'set_schedule') {
        await updateStudentSchedule(String(selectedRow.id), {
          teacherId: String(formData.get('teacherId') || '') || null,
          programId: String(formData.get('programId') || selectedRow.programId || '') || null,
          classDays: String(formData.get('classDays') || ''),
          classTime: String(formData.get('classTime') || ''),
          timezone: String(formData.get('timezone') || ''),
          durationMinutes: Number(formData.get('durationMinutes') || 30),
          platform: String(formData.get('platform') || ''),
          meetingLink: String(formData.get('meetingLink') || ''),
          startDate: String(formData.get('startDate') || ''),
          notes: String(formData.get('notes') || ''),
        });
        notify('Student schedule updated.', 'success');
      }

      if (activeAction === 'update_level') {
        await updateStudentLevel(String(selectedRow.id), String(formData.get('level') || ''), String(formData.get('notes') || ''));
        notify('Student level updated.', 'success');
      }

      if (activeAction === 'deactivate_student') {
        await deactivateStudent(String(selectedRow.id), String(formData.get('reason') || ''));
        notify('Student deactivated.', 'success');
      }

      await loadStudentRows();
      closeAction();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Student action failed:', error);
      }
      const errorByAction: Partial<Record<AdminActionType, string>> = {
        set_program: 'Failed to update program. Please try again.',
        assign_teacher: 'Failed to assign teacher. Please try again.',
        complete_setup: 'Failed to update student setup. Please try again.',
        set_schedule: error instanceof Error ? error.message : 'Unable to save schedule.',
        update_level: 'Failed to update student level. Please try again.',
        deactivate_student: 'Failed to deactivate student. Please try again.',
      };
      notify(errorByAction[activeAction] || 'Unable to complete action. Please try again.', 'error');
    } finally {
      setSavingAction(false);
    }
  }

  const primaryAction = (row: GenericRow): DashboardPrimaryAction => {
    const openDrawer = () => setSelectedRow(row);

    if (section === 'students') {
      return { label: 'Open Record', onClick: () => openAction('view_record', row), variant: 'primary' };
    }

    if (section === 'teachers') {
      return { label: 'View Profile', onClick: () => openAction('view_details', row), variant: 'primary' };
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
      const canWriteStudent = isUuid(row.id);
      return [
        { label: 'Complete Setup', onClick: () => openAction('complete_setup', row), disabled: Boolean(row.setupReady) || !canWriteStudent },
        { label: 'Set Program', onClick: () => openAction('set_program', row), disabled: !canWriteStudent, hidden: !canSetStudentProgram },
        { label: 'Assign Teacher', onClick: () => openAction('assign_teacher', row), disabled: !canWriteStudent },
        { label: 'Set Schedule', onClick: () => openAction('set_schedule', row), disabled: !canWriteStudent },
        { label: 'Update Level', onClick: () => openAction('update_level', row), disabled: !canWriteStudent },
        { label: 'View Attendance', onClick: () => openAction('view_attendance', row) },
        { label: 'View Payments', onClick: () => openAction('view_payments', row) },
        { label: 'Deactivate Student', onClick: () => openAction('deactivate_student', row), disabled: !canWriteStudent, danger: true },
      ];
    }

    if (section === 'teachers') {
      return [
        { label: 'View Profile', onClick: () => openAction('view_details', row) },
        { label: 'Update Availability', onClick: () => openAction('update_availability', row) },
        { label: 'Assign Students', onClick: () => navigate('/dashboard/admin/students') },
        { label: 'View Schedule', onClick: () => navigate('/dashboard/admin/classes') },
        { label: 'Deactivate Teacher', onClick: openDrawer, disabled: String(row.status) !== 'active', danger: true },
      ];
    }

    if (section === 'free-trials') {
      return [
        { label: 'Assign Teacher', onClick: openDrawer },
        { label: 'Reschedule Trial', onClick: openDrawer },
        { label: 'Open Meeting', onClick: openDrawer },
        { label: 'Mark Completed', onClick: openDrawer },
        { label: 'Mark No Show', onClick: openDrawer, danger: true },
        { label: 'View Feedback', onClick: openDrawer },
        { label: 'Convert to Student', onClick: openDrawer },
      ];
    }

    if (section === 'classes') {
      return [
        { label: 'Open Meeting', onClick: openDrawer },
        { label: 'View Attendance', onClick: openDrawer },
        { label: 'View Teacher Report', onClick: openDrawer },
        { label: 'Set Homework', onClick: openDrawer },
        { label: 'Reschedule Class', onClick: openDrawer },
        { label: 'Cancel Class', onClick: openDrawer, danger: true },
      ];
    }

    if (section === 'attendance') {
      return [
        { label: 'Confirm Attendance', onClick: openDrawer },
        { label: 'Request Correction', onClick: openDrawer },
        { label: 'Contact Parent', onClick: openDrawer },
        { label: 'Mark Follow-up Done', onClick: openDrawer },
      ];
    }

    if (section === 'payments') {
      return [
        { label: 'Create Invoice', onClick: openDrawer, disabled: true },
        { label: 'View Invoice', onClick: openDrawer },
        { label: 'Download Receipt', onClick: openDrawer, disabled: row.status !== 'paid' },
        { label: 'Contact Parent', onClick: openDrawer },
        { label: 'Mark as Paid', onClick: openDrawer, disabled: row.status === 'paid' },
        { label: 'Upload Receipt', onClick: openDrawer, disabled: true },
        { label: 'Mark as Overdue', onClick: openDrawer, danger: true },
      ];
    }

    if (section === 'reports') {
      return [
        { label: 'Export Report', onClick: () => exportRows('reports', [row]) },
        { label: 'Schedule Report', onClick: openDrawer, disabled: true },
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
        { header: 'Teacher', accessor: (row) => <DetailCell primary={row.name} secondary={row.email} /> },
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
  }, [canSetStudentProgram, section, navigate, rows]);

  const visibleRows = section === 'reports'
    ? rows.filter((row) => row.category === activeReportTab)
    : rows;
  const visibleActive = visibleRows.filter((row) => ['active', 'present', 'paid', 'completed'].includes(String(row.status).toLowerCase())).length;
  const visiblePending = visibleRows.filter((row) => ['pending', 'setup pending', 'scheduled', 'late'].includes(String(row.status).toLowerCase())).length;
  const visibleRisk = visibleRows.filter((row) => ['absent', 'overdue', 'cancelled'].includes(String(row.status).toLowerCase())).length;

  return (
    <div className={`dashboard-page dashboard-page--management dashboard-page--${section}`}>
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
              {activeSettingsTab === 'Programs' && <ActionButton variant="secondary" disabled>Add Program requires database setup</ActionButton>}
              {activeSettingsTab === 'Notifications' && <ActionButton variant="secondary" disabled>Notification templates require setup</ActionButton>}
              {activeSettingsTab === 'Integrations' && <ActionButton variant="secondary" disabled>WhatsApp/Email integration requires setup</ActionButton>}
              {activeSettingsTab === 'Schedule Defaults' && <ActionButton variant="secondary" disabled>Timezone defaults require setup</ActionButton>}
            </div>
          </div>
        </SectionCard>
      ) : (
        <div className={section === 'reports' ? 'dashboard-grid dashboard-grid--two' : ''}>
          <SectionCard
            title={section === 'settings' ? 'Roles & Permissions' : page.title}
            subtitle={section === 'settings' ? 'Role defaults for dashboard access and operational permissions.' : `${page.title} operational records`}
          >
            <BasicTable
              rows={visibleRows}
              columns={columns}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              enableProgramFilter={['students', 'free-trials', 'classes', 'attendance', 'payments'].includes(section)}
            />
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

      {selectedRow && activeAction && section === 'students' && (
        <StudentActionDrawer
          action={activeAction}
          row={selectedRow}
          teachers={teachers}
          programs={programs}
          attendanceRecords={attendanceRecords}
          paymentRecords={paymentRecords}
          recordTab={studentRecordTab}
          saving={savingAction}
          onRecordTabChange={setStudentRecordTab}
          onClose={closeAction}
          onNavigateRecord={() => navigate(`/dashboard/admin/students/${selectedRow.id}`)}
          onSubmit={handleStudentActionSubmit}
        />
      )}

      {selectedRow && activeAction === 'view_details' && section === 'teachers' && (
        <TeacherProfileDrawer
          row={selectedRow}
          onClose={closeAction}
          onViewStudents={() => {
            closeAction();
            navigate('/dashboard/admin/students');
          }}
          onViewSchedule={() => {
            closeAction();
            navigate('/dashboard/admin/classes');
          }}
        />
      )}

      {selectedRow && activeAction === 'update_availability' && section === 'teachers' && (
        <TeacherAvailabilityDrawer
          row={selectedRow}
          onClose={closeAction}
        />
      )}

      {selectedRow && !activeAction && (
        <DetailDrawer
          content={getDrawerContent(section, selectedRow, notify, navigate)}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
