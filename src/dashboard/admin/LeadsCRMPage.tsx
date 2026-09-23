import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardSkeleton from '../components/DashboardSkeleton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import AssignTeacherModal from '../components/AssignTeacherModal';
import ConvertLeadModal from '../components/ConvertLeadModal';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import FollowUpModal from '../components/FollowUpModal';
import LeadDetailDrawer from '../components/LeadDetailDrawer';
import LeadKanbanBoard from '../components/LeadKanbanBoard';
import LeadStatusBadge from '../components/LeadStatusBadge';
import LeadTypeBadge from '../components/LeadTypeBadge';
import ProgramSelect from '../components/ProgramSelect';
import ScheduleTrialModal from '../components/ScheduleTrialModal';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import Toast, { type ToastMessage } from '../components/Toast';
import { useAuth, type AuthRole } from '../auth/AuthProvider';
import {
  addLeadNote,
  addLeadFollowUp,
  assignLeadOwner,
  assignLeadTeacher,
  convertLeadToStudent,
  createLead,
  fetchAssignableProfiles,
  fetchLeadActivity,
  fetchLeads,
  fetchTeacherOptions,
  scheduleFreeTrial,
  updateLead,
  updateLeadStatus,
  type LeadActivity,
  type LeadRecord,
  type LeadStatus,
  type LeadType,
  type TeacherOption,
  type UpdateLeadPayload,
} from '../services/leadsService';
import {
  getLeadAcquisition,
  leadMatchesAttributionSearch,
  marketingAttributionFieldKeys,
} from '../services/leadAttribution';
import { usePrograms, type ProgramRecord } from '../../shared/services/programsService';
import { DashboardText, useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

type ProgramOption = ProgramRecord;
type OwnerOption = { id: string; full_name: string; email: string; role: string; status: string };

const statusOptions: Array<{ value: LeadStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'no_response', label: 'No Response' },
  { value: 'follow_up_later', label: 'Follow-up Later' },
  { value: 'trial_scheduled', label: 'Trial Scheduled' },
  { value: 'trial_completed', label: 'Trial Completed' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'lost', label: 'Lost' },
];

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  no_response: 'No Response',
  follow_up_later: 'Follow-up Later',
  trial_scheduled: 'Trial Scheduled',
  trial_completed: 'Trial Completed',
  enrolled: 'Enrolled',
  lost: 'Lost',
};

const leadManagerRoles: AuthRole[] = ['super_admin', 'admin', 'admissions', 'academic_manager'];
const teacherTrainingStatuses: LeadStatus[] = ['new', 'contacted', 'follow_up_later', 'lost'];
const studentPipelineStatuses: LeadStatus[] = [
  'new',
  'contacted',
  'no_response',
  'follow_up_later',
  'trial_scheduled',
  'trial_completed',
  'lost',
];
const pageSizeOptions = [25, 50, 100];
type LeadsSortKey = 'created_desc' | 'created_asc' | 'follow_up_asc' | 'name_asc' | 'status_asc';

function formatDate(value?: string | null, locale = 'en') {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function isDueToday(value?: string | null) {
  if (!value) {
    return false;
  }

  return new Date(value).toDateString() === new Date().toDateString();
}

function csvEscape(value: unknown) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportLeadRows(rows: LeadRecord[]) {
  const keys: Array<keyof LeadRecord> = [
    'full_name',
    'whatsapp',
    'country',
    'programName',
    'source',
    'status',
    'assignedOwnerName',
    'assignedTeacherName',
    'next_follow_up_at',
    'created_at',
    ...marketingAttributionFieldKeys,
  ];
  const csv = [keys.join(','), ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `musliman-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function CompactCell({
  primary,
  secondary,
  tertiary,
  children,
}: {
  primary?: string | null;
  secondary?: string | null;
  tertiary?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="lead-table-cell">
      {children || <strong>{primary || '-'}</strong>}
      {secondary && <span>{secondary}</span>}
      {tertiary && <small>{tertiary}</small>}
    </div>
  );
}

function LeadActions({
  lead,
  onDetails,
  onEdit,
  onStatus,
  onOwner,
  onTeacher,
  onTrial,
  onFollowUp,
  onLost,
  onConvert,
}: {
  lead: LeadRecord;
  onDetails: () => void;
  onEdit: () => void;
  onStatus: (status: LeadStatus) => void;
  onOwner: () => void;
  onTeacher: () => void;
  onTrial: () => void;
  onFollowUp: () => void;
  onLost: () => void;
  onConvert: () => void;
}) {
  const isTeacherTraining = lead.lead_type === 'teacher_training';
  const primaryLabel =
    lead.status === 'trial_scheduled'
      ? 'View Trial'
      : lead.status === 'trial_completed'
        ? 'Convert to Student'
        : 'View Details';
  const primaryAction = lead.status === 'trial_completed' && !isTeacherTraining ? onConvert : onDetails;

  return (
    <DashboardActionMenu
      label={`Actions for ${lead.full_name}`}
      primaryAction={{
        label: primaryLabel,
        onClick: primaryAction,
        variant: lead.status === 'trial_completed' && !isTeacherTraining ? 'primary' : 'secondary',
      }}
      actions={[
        { label: 'Edit Lead', onClick: onEdit },
        { label: 'Mark Contacted', onClick: () => onStatus('contacted') },
        { label: isTeacherTraining ? 'Assign Reviewer' : 'Assign Owner', onClick: onOwner },
        ...(isTeacherTraining
          ? [
              { label: 'Review Application', onClick: onDetails },
              { label: 'Contact Applicant', onClick: onFollowUp },
            ]
          : [
              { label: 'Assign Teacher', onClick: onTeacher },
              { label: 'Schedule Trial', onClick: onTrial },
              { label: 'Add Follow-up', onClick: onFollowUp },
              { label: 'Convert to Student', onClick: onConvert, hidden: lead.status === 'trial_completed' },
            ]),
        { label: 'Mark Lost', onClick: onLost, danger: true },
      ]}
    />
  );
}

export default function LeadsCRMPage() {
  const { t, language } = useDashboardLanguage();
  const locale = language === 'ar' ? 'ar-EG' : 'en';
  const { role } = useAuth();
  const { programs } = usePrograms();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockFallback, setUsingMockFallback] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadType | 'all'>('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [followUpToday, setFollowUpToday] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit'>('view');
  const [savingLead, setSavingLead] = useState(false);
  const [teacherLead, setTeacherLead] = useState<LeadRecord | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [ownerLead, setOwnerLead] = useState<LeadRecord | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [trialLead, setTrialLead] = useState<LeadRecord | null>(null);
  const [followUpLead, setFollowUpLead] = useState<LeadRecord | null>(null);
  const [convertLead, setConvertLead] = useState<LeadRecord | null>(null);
  const [lostLead, setLostLead] = useState<LeadRecord | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [view, setView] = useState<'pipeline' | 'table'>(() => {
    if (typeof window === 'undefined') {
      return 'table';
    }

    const storedView = localStorage.getItem('musliman-leads-view');
    return storedView === 'pipeline' || storedView === 'table' ? storedView : 'table';
  });
  const [sortBy, setSortBy] = useState<LeadsSortKey>('created_desc');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const canDragLeads = role ? leadManagerRoles.includes(role) : false;

  async function loadLeads() {
    setLoading(true);

    try {
      const [leadRows, ownerRows, teacherRows] = await Promise.all([
        fetchLeads(),
        fetchAssignableProfiles(),
        fetchTeacherOptions(),
      ]);
      setLeads(leadRows);
      setOwners(ownerRows as OwnerOption[]);
      setTeachers(teacherRows);
      setUsingMockFallback(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Leads CRM load failed:', error);
      }
      setLeads([]);
      setOwners([]);
      setTeachers([]);
      setUsingMockFallback(false);
      setToast({ type: 'error', message: 'Live leads could not be loaded. No lead records are displayed.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musliman-leads-view', view);
    }
  }, [view]);

  async function openLead(lead: LeadRecord, mode: 'view' | 'edit' = 'view') {
    setSelectedLead(lead);
    setDrawerMode(mode);

    try {
      setActivities(await fetchLeadActivity(lead.id));
    } catch {
      setActivities([]);
    }
  }

  async function handleLeadSave(payload: UpdateLeadPayload) {
    if (!selectedLead) {
      return;
    }

    setSavingLead(true);

    try {
      const updated = await updateLead(selectedLead.id, payload);
      setSelectedLead(updated);
      await loadLeads();
      setActivities(await fetchLeadActivity(selectedLead.id));

      setDrawerMode('view');
      setToast({ type: 'success', message: 'Lead updated successfully.' });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Lead update failed:', error);
      }

      setToast({ type: 'error', message: 'Lead could not be updated.' });
    } finally {
      setSavingLead(false);
    }
  }

  const sources = useMemo(() => Array.from(new Set(leads.map((lead) => lead.source || 'website'))), [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        lead.full_name.toLowerCase().includes(query) ||
        (lead.whatsapp || '').toLowerCase().includes(query) ||
        leadMatchesAttributionSearch(lead, query);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesLeadType = leadTypeFilter === 'all' || (lead.lead_type || 'student') === leadTypeFilter;
      const matchesProgram =
        programFilter === 'all' || lead.program_id === programFilter || lead.programName === programFilter;
      const matchesSource = sourceFilter === 'all' || (lead.source || 'website') === sourceFilter;
      const matchesOwner = ownerFilter === 'all' || lead.assigned_to === ownerFilter;
      const matchesTeacher = teacherFilter === 'all' || lead.assigned_teacher_id === teacherFilter;
      const matchesFollowUp = !followUpToday || isDueToday(lead.next_follow_up_at);
      const createdTime = new Date(lead.created_at).getTime();
      const matchesDateFrom = !dateFrom || createdTime >= new Date(`${dateFrom}T00:00:00`).getTime();
      const matchesDateTo = !dateTo || createdTime <= new Date(`${dateTo}T23:59:59`).getTime();
      return (
        matchesSearch &&
        matchesStatus &&
        matchesLeadType &&
        matchesProgram &&
        matchesSource &&
        matchesOwner &&
        matchesTeacher &&
        matchesFollowUp &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    dateFrom,
    dateTo,
    followUpToday,
    leadTypeFilter,
    leads,
    ownerFilter,
    programFilter,
    search,
    sourceFilter,
    statusFilter,
    teacherFilter,
  ]);

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((first, second) => {
      if (sortBy === 'created_asc') {
        return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
      }

      if (sortBy === 'follow_up_asc') {
        const firstTime = first.next_follow_up_at
          ? new Date(first.next_follow_up_at).getTime()
          : Number.MAX_SAFE_INTEGER;
        const secondTime = second.next_follow_up_at
          ? new Date(second.next_follow_up_at).getTime()
          : Number.MAX_SAFE_INTEGER;
        return firstTime - secondTime;
      }

      if (sortBy === 'name_asc') {
        return first.full_name.localeCompare(second.full_name);
      }

      if (sortBy === 'status_asc') {
        return statusLabels[first.status].localeCompare(statusLabels[second.status]);
      }

      return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    });
  }, [filteredLeads, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedLeads]);
  const tableStart = sortedLeads.length ? (currentPage - 1) * pageSize + 1 : 0;
  const tableEnd = Math.min(currentPage * pageSize, sortedLeads.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    dateFrom,
    dateTo,
    followUpToday,
    leadTypeFilter,
    ownerFilter,
    pageSize,
    programFilter,
    search,
    sortBy,
    sourceFilter,
    statusFilter,
    teacherFilter,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const total = leads.length;
    const studentLeads = leads.filter((lead) => (lead.lead_type || 'student') === 'student').length;
    const trainingLeads = leads.filter((lead) => lead.lead_type === 'teacher_training').length;
    const newCount = leads.filter((lead) => lead.status === 'new').length;
    const trials = leads.filter((lead) => lead.status === 'trial_scheduled').length;
    const enrolled = leads.filter((lead) => lead.status === 'enrolled').length;
    const conversionRate = leads.length ? Math.round((enrolled / leads.length) * 100) : 0;
    const dueToday = leads.filter((lead) => isDueToday(lead.next_follow_up_at)).length;

    return [
      { label: t('Total Leads'), value: total, trend: t('All admissions inquiries'), icon: 'chart' },
      { label: t('Student Free Trial Leads'), value: studentLeads, trend: t('Trial pipeline'), icon: 'student' },
      { label: t('Teacher Training Leads'), value: trainingLeads, trend: t('Training applications'), icon: 'teacher' },
      { label: t('New Leads'), value: newCount, trend: t('Awaiting first contact'), icon: 'gift' },
      { label: t('Trials Scheduled'), value: trials, trend: t('Assigned to teachers'), icon: 'calendar' },
      { label: t('Enrolled Students'), value: enrolled, trend: t('Converted students'), icon: 'checkCircle' },
      { label: t('Conversion Rate'), value: `${conversionRate}%`, trend: t('Lead to enrollment'), icon: 'chart' },
      { label: t('Follow-ups Due Today'), value: dueToday, trend: t('Admissions action'), icon: 'clock' },
    ];
  }, [leads, t]);

  async function handleStatusChange(lead: LeadRecord, status: LeadStatus) {
    if (usingMockFallback) {
      setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status } : item)));
      setToast({ type: 'success', message: 'Lead status updated locally.' });
      return;
    }

    await updateLeadStatus(lead.id, status, lead.status);
    setToast({ type: 'success', message: 'Lead status updated.' });
    await loadLeads();
  }

  async function handlePipelineMove(lead: LeadRecord, status: LeadStatus) {
    if (!canDragLeads || lead.status === status) {
      return;
    }

    if (status === 'enrolled' && !lead.converted_student_id) {
      setToast({ type: 'error', message: 'Convert this lead to a student before marking it as enrolled.' });
      return;
    }

    if (lead.lead_type === 'teacher_training' && !teacherTrainingStatuses.includes(status)) {
      setToast({ type: 'error', message: 'Teacher training leads follow a separate review flow.' });
      return;
    }

    if (
      (lead.lead_type || 'student') === 'student' &&
      status !== 'enrolled' &&
      !studentPipelineStatuses.includes(status)
    ) {
      setToast({ type: 'error', message: 'This status is not available for student leads.' });
      return;
    }

    const previousLeads = leads;
    const oldStatus = lead.status;
    const movedLead = { ...lead, status, updated_at: new Date().toISOString() };

    setLeads((current) => current.map((item) => (item.id === lead.id ? movedLead : item)));
    if (selectedLead?.id === lead.id) {
      setSelectedLead(movedLead);
    }

    try {
      if (!usingMockFallback) {
        const updated = await updateLeadStatus(lead.id, status, oldStatus);
        setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ...updated } : item)));
        if (selectedLead?.id === lead.id) {
          setSelectedLead((current) => (current ? { ...current, ...updated } : current));
        }
      }

      setToast({ type: 'success', message: `Lead moved to ${statusLabels[status]}.` });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Lead drag status update failed:', error);
      }

      setLeads(previousLeads);
      if (selectedLead?.id === lead.id) {
        setSelectedLead(previousLeads.find((item) => item.id === lead.id) || lead);
      }
      setToast({ type: 'error', message: 'Could not update lead status. Please try again.' });
    }
  }

  async function handleFollowUpSave(dateTime: string, note: string) {
    if (!followUpLead) return;

    if (usingMockFallback) {
      setLeads((current) =>
        current.map((lead) =>
          lead.id === followUpLead.id
            ? {
                ...lead,
                next_follow_up_at: new Date(dateTime).toISOString(),
                notes: [lead.notes, note].filter(Boolean).join('\n\n'),
              }
            : lead,
        ),
      );
    } else {
      await addLeadFollowUp(followUpLead.id, new Date(dateTime).toISOString(), note || 'Follow-up added.');
    }

    setFollowUpLead(null);
    setToast({ type: 'success', message: 'Follow-up added.' });
    await loadLeads();
  }

  async function handleAddNote(note: string) {
    if (!selectedLead) return;

    if (!usingMockFallback) {
      await addLeadNote(selectedLead.id, note);
      const updated = await fetchLeadActivity(selectedLead.id);
      setActivities(updated);
      await loadLeads();
    }

    setSelectedLead((current) =>
      current ? { ...current, notes: [current.notes, note].filter(Boolean).join('\n\n') } : current,
    );
    setToast({ type: 'success', message: 'Lead note added.' });
  }

  async function handleMarkLost() {
    if (!lostLead) return;

    if (!lostReason.trim()) {
      setToast({ type: 'error', message: 'Add a lost reason before closing the lead.' });
      return;
    }

    if (usingMockFallback) {
      setLeads((current) =>
        current.map((lead) =>
          lead.id === lostLead.id
            ? { ...lead, status: 'lost', lost_reason: lostReason.trim(), updated_at: new Date().toISOString() }
            : lead,
        ),
      );
      setToast({ type: 'success', message: 'Lead marked lost locally.' });
    } else {
      await updateLead(lostLead.id, { status: 'lost', lost_reason: lostReason.trim() });
      setToast({ type: 'success', message: 'Lead marked lost.' });
      await loadLeads();
    }

    setLostLead(null);
    setLostReason('');
  }

  const tableColumns: Array<DataTableColumn<LeadRecord>> = [
    {
      header: t('Lead'),
      accessor: (row) => <CompactCell primary={row.full_name} secondary={row.country || t('Country not set')} />,
    },
    {
      header: t('Contact'),
      accessor: (row) => <CompactCell primary={row.whatsapp || '-'} secondary={row.source || t('website')} />,
    },
    {
      header: t('Program'),
      accessor: (row) => (
        <CompactCell
          secondary={
            row.form_type === 'teacher_training'
              ? t('Teacher Training form')
              : row.form_type === 'free_trial'
                ? t('Free Trial form')
                : row.form_type || undefined
          }
        >
          <strong>{row.programName || '-'}</strong>
          <LeadTypeBadge type={row.lead_type} />
        </CompactCell>
      ),
    },
    {
      header: t('Acquisition'),
      accessor: (row) => {
        const acquisition = getLeadAcquisition(row);

        return (
          <CompactCell
            primary={acquisition.primary}
            secondary={acquisition.secondary}
            tertiary={acquisition.tertiary ? `Ad: ${acquisition.tertiary}` : null}
          />
        );
      },
    },
    { header: t('Status'), accessor: (row) => <LeadStatusBadge status={row.status} /> },
    {
      header: t('Assignment'),
      accessor: (row) => (
        <CompactCell
          primary={row.assignedOwnerName || t('Unassigned')}
          secondary={row.lead_type === 'teacher_training' ? t('Reviewer') : row.assignedTeacherName || t('No teacher')}
        />
      ),
    },
    {
      header: t('Dates'),
      accessor: (row) => (
        <CompactCell
          primary={formatDate(row.next_follow_up_at, locale)}
          secondary={t('Created {{date}}', { date: formatDate(row.created_at, locale) })}
        />
      ),
    },
    {
      header: t('Actions'),
      accessor: (row) => (
        <LeadActions
          lead={row}
          onDetails={() => openLead(row, 'view')}
          onEdit={() => openLead(row, 'edit')}
          onStatus={(status) => handleStatusChange(row, status)}
          onOwner={() => {
            setOwnerLead(row);
            setSelectedOwnerId(row.assigned_to || owners[0]?.id || '');
          }}
          onTeacher={() => {
            setTeacherLead(row);
            setSelectedTeacherId(row.assigned_teacher_id || teachers[0]?.id || '');
          }}
          onTrial={() => setTrialLead(row)}
          onFollowUp={() => setFollowUpLead(row)}
          onLost={() => setLostLead(row)}
          onConvert={() => setConvertLead(row)}
        />
      ),
    },
  ];

  async function handleAddLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await createLead({
      full_name: String(formData.get('full_name') || ''),
      whatsapp: String(formData.get('whatsapp') || ''),
      country: String(formData.get('country') || ''),
      program_id: String(formData.get('program_id') || '') || undefined,
      program_name: String(formData.get('program_name') || '') || undefined,
      source: 'dashboard',
      form_type: String(formData.get('lead_type') || '') === 'teacher_training' ? 'teacher_training' : 'manual',
      lead_type: String(formData.get('lead_type') || '') === 'teacher_training' ? 'teacher_training' : 'student',
      preferred_time: String(formData.get('preferred_time') || ''),
      message: String(formData.get('message') || ''),
    });
    setAddLeadOpen(false);
    setToast({ type: 'success', message: 'Lead added successfully.' });
    await loadLeads();
  }

  return (
    <div className="dashboard-page dashboard-page--leads">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardPageHeader
        eyebrow={t('LEADS CRM')}
        title={t('Admissions Pipeline')}
        subtitle={t('Track new inquiries, parent follow-ups, sources, trial readiness, and enrollment progress.')}
        action={
          <div className="dashboard-page-actions">
            <ActionButton variant="copper" onClick={() => setAddLeadOpen(true)}>
              <Icon name="plus" size={18} /> {t('Add Lead')}
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => exportLeadRows(sortedLeads)}>
              <Icon name="download" size={18} /> {t('Export Leads')}
            </ActionButton>
            <ActionButton variant="secondary" onClick={loadLeads}>
              <Icon name="shieldCheck" size={18} /> {t('Refresh')}
            </ActionButton>
          </div>
        }
      />

      <div className="dashboard-stats-grid dashboard-stats-grid--leads">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <SectionCard className="dashboard-card--lead-workspace">
        <div className="lead-toolbar">
          <FilterBar search={search} onSearchChange={setSearch}>
            <label>
              <span>{t('Status')}</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as LeadStatus | 'all')}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('Lead Type')}</span>
              <select
                value={leadTypeFilter}
                onChange={(event) => setLeadTypeFilter(event.target.value as LeadType | 'all')}
              >
                <option value="all">{t('All lead types')}</option>
                <option value="student">{t('Student')}</option>
                <option value="teacher_training">{t('Teacher Training')}</option>
              </select>
            </label>
            <ProgramSelect label={t('Program')} value={programFilter} onChange={setProgramFilter} includeAllOption />
            <label>
              <span>{t('Source')}</span>
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                <option value="all">{t('All sources')}</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('Owner')}</span>
              <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
                <option value="all">{t('All owners')}</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('Teacher')}</span>
              <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
                <option value="all">{t('All teachers')}</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </label>
          </FilterBar>
          <div className="lead-toolbar__bottom">
            <label className="dashboard-check-filter">
              <input
                type="checkbox"
                checked={followUpToday}
                onChange={(event) => setFollowUpToday(event.target.checked)}
              />{' '}
              {t('Follow-up due today')}
            </label>
            <div className="lead-date-range">
              <label>
                <span>{t('From')}</span>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </label>
              <label>
                <span>{t('To')}</span>
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </label>
            </div>
            <div className="dashboard-view-toggle">
              <button className={view === 'table' ? 'is-active' : ''} type="button" onClick={() => setView('table')}>
                {t('Table')}
              </button>
              <button
                className={view === 'pipeline' ? 'is-active' : ''}
                type="button"
                onClick={() => setView('pipeline')}
              >
                {t('Pipeline')}
              </button>
            </div>
          </div>
        </div>

        {loading && <DashboardSkeleton cards={4} rows={7} label={t('Loading admissions pipeline')} />}
        {!loading && filteredLeads.length === 0 && (
          <EmptyState
            title={t('No leads found')}
            description={t('New website form submissions and manually added leads will appear here.')}
          />
        )}
        {!loading && filteredLeads.length > 0 && view === 'pipeline' && (
          <LeadKanbanBoard
            leads={filteredLeads}
            canDrag={canDragLeads}
            onMoveLead={handlePipelineMove}
            onOpenLead={openLead}
            onQuickStatus={(lead) => handleStatusChange(lead, lead.status === 'new' ? 'contacted' : 'follow_up_later')}
          />
        )}
        {!loading && filteredLeads.length > 0 && view === 'table' && (
          <>
            <div className="lead-table-operations">
              <div>
                <strong>{t('{{count}} leads', { count: sortedLeads.length })}</strong>
                <span>{t('Showing {{start}}-{{end}}', { start: tableStart, end: tableEnd })}</span>
              </div>
              <label>
                {t('Sort')}
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as LeadsSortKey)}>
                  <option value="created_desc">{t('Newest first')}</option>
                  <option value="created_asc">{t('Oldest first')}</option>
                  <option value="follow_up_asc">{t('Follow-up due')}</option>
                  <option value="name_asc">{t('Name A-Z')}</option>
                  <option value="status_asc">{t('Status A-Z')}</option>
                </select>
              </label>
              <label>
                {t('Rows')}
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <DataTable
              className="lead-crm-table-wrap"
              tableClassName="lead-crm-table"
              columns={tableColumns}
              rows={paginatedLeads}
              getRowKey={(row) => row.id}
            />
            <div className="lead-table-pagination">
              <ActionButton
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                {t('Previous')}
              </ActionButton>
              <span>{t('Page {{current}} of {{total}}', { current: currentPage, total: totalPages })}</span>
              <ActionButton
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                {t('Next')}
              </ActionButton>
            </div>
          </>
        )}
      </SectionCard>

      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          activities={activities}
          mode={drawerMode}
          programs={programs}
          owners={owners}
          teachers={teachers}
          saving={savingLead}
          onClose={() => setSelectedLead(null)}
          onEdit={() => setDrawerMode('edit')}
          onSave={handleLeadSave}
          onAddFollowUp={() => setFollowUpLead(selectedLead)}
          onAssignOwner={() => {
            setOwnerLead(selectedLead);
            setSelectedOwnerId(selectedLead.assigned_to || owners[0]?.id || '');
          }}
          onAssignTeacher={() => {
            setTeacherLead(selectedLead);
            setSelectedTeacherId(selectedLead.assigned_teacher_id || teachers[0]?.id || '');
          }}
          onScheduleTrial={() => setTrialLead(selectedLead)}
          onAddNote={handleAddNote}
          onMarkLost={() => setLostLead(selectedLead)}
          onConvert={() => setConvertLead(selectedLead)}
        />
      )}

      {teacherLead && (
        <AssignTeacherModal
          lead={teacherLead}
          teachers={teachers}
          selectedTeacherId={selectedTeacherId}
          onSelectTeacher={setSelectedTeacherId}
          onClose={() => setTeacherLead(null)}
          onSave={async () => {
            await assignLeadTeacher(teacherLead.id, selectedTeacherId);
            setTeacherLead(null);
            setToast({ type: 'success', message: t('Teacher assigned.') });
            await loadLeads();
          }}
        />
      )}
      {followUpLead && (
        <FollowUpModal lead={followUpLead} onClose={() => setFollowUpLead(null)} onSave={handleFollowUpSave} />
      )}
      {trialLead && (
        <ScheduleTrialModal
          lead={trialLead}
          teachers={teachers}
          onClose={() => setTrialLead(null)}
          onSave={async (payload) => {
            await scheduleFreeTrial({ leadId: trialLead.id, ...payload });
            setTrialLead(null);
            setToast({ type: 'success', message: t('Free trial scheduled.') });
            await loadLeads();
          }}
        />
      )}
      {convertLead && (
        <ConvertLeadModal
          lead={convertLead}
          teachers={teachers}
          onClose={() => setConvertLead(null)}
          onSave={async (payload) => {
            await convertLeadToStudent(convertLead.id, payload);
            setConvertLead(null);
            setToast({ type: 'success', message: t('Lead converted to student.') });
            await loadLeads();
          }}
        />
      )}

      {ownerLead && (
        <div
          className="dashboard-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('Assign owner to {{name}}', { name: ownerLead.full_name })}
        >
          <div className="dashboard-modal__panel dashboard-modal__panel--small">
            <div className="dashboard-card__header">
              <div>
                <h2>{t('Assign Owner')}</h2>
                <p>{ownerLead.full_name}</p>
              </div>
            </div>
            <div className="dashboard-form">
              <label>
                <span>{t('Admissions owner')}</span>
                <select value={selectedOwnerId} onChange={(event) => setSelectedOwnerId(event.target.value)}>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name} - {owner.role}
                    </option>
                  ))}
                </select>
              </label>
              <div className="dashboard-form-actions">
                <ActionButton
                  variant="copper"
                  onClick={async () => {
                    await assignLeadOwner(ownerLead.id, selectedOwnerId);
                    setOwnerLead(null);
                    setToast({ type: 'success', message: t('Owner assigned.') });
                    await loadLeads();
                  }}
                >
                  {t('Save Owner')}
                </ActionButton>
                <ActionButton variant="secondary" onClick={() => setOwnerLead(null)}>
                  <DashboardText>Cancel</DashboardText>
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {lostLead && (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={t('Mark {{name}} lost', { name: lostLead.full_name })}>
          <div className="dashboard-modal__panel dashboard-modal__panel--small">
            <div className="dashboard-card__header">
              <div>
                <h2>{t('Mark Lost')}</h2>
                <p>{t('This closes the lead without enrollment.')}</p>
              </div>
            </div>
            <div className="dashboard-form">
              <label>
                <span>{t('Lost reason')}</span>
                <textarea
                  rows={3}
                  value={lostReason}
                  onChange={(event) => setLostReason(event.target.value)}
                  placeholder={t('Budget, timing, no response, chose another academy...')}
                />
              </label>
              <div className="dashboard-form-actions">
                <ActionButton variant="danger" onClick={handleMarkLost}>
                  {t('Confirm Mark Lost')}
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  onClick={() => {
                    setLostLead(null);
                    setLostReason('');
                  }}
                >
                  <DashboardText>Cancel</DashboardText>
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {addLeadOpen && (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={t('Add Lead')}>
          <div className="dashboard-modal__panel">
            <div className="dashboard-card__header">
              <div>
                <h2>{t('Add Lead')}</h2>
                <p>{t('Create a manual admissions lead.')}</p>
              </div>
              <ActionButton variant="ghost" onClick={() => setAddLeadOpen(false)}>
                <DashboardText>Close</DashboardText>
              </ActionButton>
            </div>
            <form className="dashboard-form" onSubmit={handleAddLead}>
              <label>
                <span>{t('Full name')}</span>
                <input name="full_name" required />
              </label>
              <label>
                <span><DashboardText>WhatsApp</DashboardText></span>
                <input name="whatsapp" />
              </label>
              <label>
                <span>{t('Country')}</span>
                <input name="country" />
              </label>
              <label>
                <span>{t('Lead type')}</span>
                <select name="lead_type" defaultValue="student">
                  <option value="student">{t('Student free trial')}</option>
                  <option value="teacher_training">{t('Teacher training')}</option>
                </select>
              </label>
              <ProgramSelect label={t('Program')} name="program_id" />
              <label>
                <span>{t('Program name fallback')}</span>
                <input name="program_name" placeholder={t('Used if no program is selected')} />
              </label>
              <label>
                <span>{t('Preferred time')}</span>
                <input name="preferred_time" />
              </label>
              <label>
                <span>{t('Message')}</span>
                <textarea name="message" rows={3} />
              </label>
              <div className="dashboard-form-actions">
                <ActionButton variant="copper" type="submit">
                  {t('Create Lead')}
                </ActionButton>
                <ActionButton variant="secondary" type="button" onClick={() => setAddLeadOpen(false)}>
                  <DashboardText>Cancel</DashboardText>
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
