import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardSkeleton from '../components/DashboardSkeleton';
import ActionMenu from '../components/ActionMenu';
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
import ScheduleTrialModal from '../components/ScheduleTrialModal';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import Toast, { type ToastMessage } from '../components/Toast';
import { useAuth, type AuthRole } from '../auth/AuthProvider';
import { adminLeads } from '../data/mockData';
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
  fetchPrograms,
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

type ProgramOption = { id: string; name: string; slug: string };
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
const studentPipelineStatuses: LeadStatus[] = ['new', 'contacted', 'no_response', 'follow_up_later', 'trial_scheduled', 'trial_completed', 'lost'];
const pageSizeOptions = [25, 50, 100];
type LeadsSortKey = 'created_desc' | 'created_asc' | 'follow_up_asc' | 'name_asc' | 'status_asc';

function mockLeads(): LeadRecord[] {
  return adminLeads.map((lead, index) => ({
    id: `mock-${index}`,
    full_name: lead.name,
    whatsapp: lead.contact,
    country: index === 0 ? 'United Kingdom' : index === 1 ? 'United States' : 'Australia',
    student_age: index === 2 ? 'Adult' : 'Child',
    program_id: null,
    program_name: lead.program,
    preferred_time: 'Evening',
    message: 'Interested in a structured online learning path.',
    source: lead.source,
    form_type: lead.program === 'Teacher Training' ? 'teacher_training' : 'free_trial',
    lead_type: lead.program === 'Teacher Training' ? 'teacher_training' : 'student',
    status: lead.status as LeadStatus,
    assigned_to: null,
    assigned_teacher_id: null,
    last_contact_at: null,
    next_follow_up_at: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
    notes: 'Admissions note for dashboard preview.',
    lead_priority: 'normal',
    lost_reason: null,
    converted_student_id: null,
    created_at: new Date(Date.now() - index * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    programName: lead.program,
    assignedOwnerName: lead.owner,
    assignedTeacherName: index === 2 ? 'Ust. Maryam Ali' : 'Unassigned',
  }));
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
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
  ];
  const csv = [
    keys.join(','),
    ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(',')),
  ].join('\n');
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
  children,
}: {
  primary?: string | null;
  secondary?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="lead-table-cell">
      {children || <strong>{primary || '-'}</strong>}
      {secondary && <span>{secondary}</span>}
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

  return (
    <ActionMenu
      label={`Actions for ${lead.full_name}`}
      items={[
        { label: 'View Details', onClick: onDetails },
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
            { label: 'Convert to Student', onClick: onConvert },
          ]),
        { label: 'Mark Lost', onClick: onLost, danger: true },
      ]}
    />
  );
}

export default function LeadsCRMPage() {
  const { role } = useAuth();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
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
      const [leadRows, programRows, ownerRows, teacherRows] = await Promise.all([
        fetchLeads(),
        fetchPrograms(),
        fetchAssignableProfiles(),
        fetchTeacherOptions(),
      ]);
      setLeads(leadRows);
      setPrograms(programRows as ProgramOption[]);
      setOwners(ownerRows as OwnerOption[]);
      setTeachers(teacherRows);
      setUsingMockFallback(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Leads CRM load failed:', error);
      }
      setLeads(mockLeads());
      setUsingMockFallback(true);
      setToast({ type: 'error', message: 'Live leads could not be loaded. Showing local admissions records.' });
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

    if (lead.id.startsWith('mock-')) {
      setActivities([]);
      return;
    }

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
      if (usingMockFallback || selectedLead.id.startsWith('mock-')) {
        const updated = {
          ...selectedLead,
          ...payload,
          programName: payload.program_name || selectedLead.programName,
          assignedOwnerName: owners.find((owner) => owner.id === payload.assigned_to)?.full_name || selectedLead.assignedOwnerName,
          assignedTeacherName: teachers.find((teacher) => teacher.id === payload.assigned_teacher_id)?.full_name || selectedLead.assignedTeacherName,
          updated_at: new Date().toISOString(),
        } as LeadRecord;

        setLeads((current) => current.map((lead) => lead.id === selectedLead.id ? updated : lead));
        setSelectedLead(updated);
      } else {
        const updated = await updateLead(selectedLead.id, payload);
        setSelectedLead(updated);
        await loadLeads();
        setActivities(await fetchLeadActivity(selectedLead.id));
      }

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
      const matchesSearch = !query || lead.full_name.toLowerCase().includes(query) || (lead.whatsapp || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesLeadType = leadTypeFilter === 'all' || (lead.lead_type || 'student') === leadTypeFilter;
      const matchesProgram = programFilter === 'all' || lead.program_id === programFilter || lead.programName === programFilter;
      const matchesSource = sourceFilter === 'all' || (lead.source || 'website') === sourceFilter;
      const matchesOwner = ownerFilter === 'all' || lead.assigned_to === ownerFilter;
      const matchesTeacher = teacherFilter === 'all' || lead.assigned_teacher_id === teacherFilter;
      const matchesFollowUp = !followUpToday || isDueToday(lead.next_follow_up_at);
      const createdTime = new Date(lead.created_at).getTime();
      const matchesDateFrom = !dateFrom || createdTime >= new Date(`${dateFrom}T00:00:00`).getTime();
      const matchesDateTo = !dateTo || createdTime <= new Date(`${dateTo}T23:59:59`).getTime();
      return matchesSearch && matchesStatus && matchesLeadType && matchesProgram && matchesSource && matchesOwner && matchesTeacher && matchesFollowUp && matchesDateFrom && matchesDateTo;
    });
  }, [dateFrom, dateTo, followUpToday, leadTypeFilter, leads, ownerFilter, programFilter, search, sourceFilter, statusFilter, teacherFilter]);

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((first, second) => {
      if (sortBy === 'created_asc') {
        return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
      }

      if (sortBy === 'follow_up_asc') {
        const firstTime = first.next_follow_up_at ? new Date(first.next_follow_up_at).getTime() : Number.MAX_SAFE_INTEGER;
        const secondTime = second.next_follow_up_at ? new Date(second.next_follow_up_at).getTime() : Number.MAX_SAFE_INTEGER;
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
  }, [dateFrom, dateTo, followUpToday, leadTypeFilter, ownerFilter, pageSize, programFilter, search, sortBy, sourceFilter, statusFilter, teacherFilter]);

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
      { label: 'Total Leads', value: total, trend: 'All admissions inquiries', icon: 'chart' },
      { label: 'Student Free Trial Leads', value: studentLeads, trend: 'Trial pipeline', icon: 'student' },
      { label: 'Teacher Training Leads', value: trainingLeads, trend: 'Training applications', icon: 'teacher' },
      { label: 'New Leads', value: newCount, trend: 'Awaiting first contact', icon: 'gift' },
      { label: 'Trials Scheduled', value: trials, trend: 'Assigned to teachers', icon: 'calendar' },
      { label: 'Enrolled Students', value: enrolled, trend: 'Converted students', icon: 'checkCircle' },
      { label: 'Conversion Rate', value: `${conversionRate}%`, trend: 'Lead to enrollment', icon: 'chart' },
      { label: 'Follow-ups Due Today', value: dueToday, trend: 'Admissions action', icon: 'clock' },
    ];
  }, [leads]);

  async function handleStatusChange(lead: LeadRecord, status: LeadStatus) {
    if (usingMockFallback) {
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status } : item));
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

    if ((lead.lead_type || 'student') === 'student' && status !== 'enrolled' && !studentPipelineStatuses.includes(status)) {
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
      if (!usingMockFallback && !lead.id.startsWith('mock-')) {
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
      setLeads((current) => current.map((lead) => lead.id === followUpLead.id ? { ...lead, next_follow_up_at: new Date(dateTime).toISOString(), notes: [lead.notes, note].filter(Boolean).join('\n\n') } : lead));
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

    setSelectedLead((current) => current ? { ...current, notes: [current.notes, note].filter(Boolean).join('\n\n') } : current);
    setToast({ type: 'success', message: 'Lead note added.' });
  }

  async function handleMarkLost() {
    if (!lostLead) return;

    if (!lostReason.trim()) {
      setToast({ type: 'error', message: 'Add a lost reason before closing the lead.' });
      return;
    }

    if (usingMockFallback || lostLead.id.startsWith('mock-')) {
      setLeads((current) => current.map((lead) => (
        lead.id === lostLead.id
          ? { ...lead, status: 'lost', lost_reason: lostReason.trim(), updated_at: new Date().toISOString() }
          : lead
      )));
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
    { header: 'Lead', accessor: (row) => <CompactCell primary={row.full_name} secondary={row.country || 'Country not set'} /> },
    { header: 'Contact', accessor: (row) => <CompactCell primary={row.whatsapp || '-'} secondary={row.source || 'website'} /> },
    {
      header: 'Program',
      accessor: (row) => (
        <CompactCell secondary={row.form_type === 'teacher_training' ? 'Teacher Training form' : row.form_type === 'free_trial' ? 'Free Trial form' : row.form_type || undefined}>
          <strong>{row.programName || '-'}</strong>
          <LeadTypeBadge type={row.lead_type} />
        </CompactCell>
      ),
    },
    { header: 'Status', accessor: (row) => <LeadStatusBadge status={row.status} /> },
    {
      header: 'Assignment',
      accessor: (row) => (
        <CompactCell
          primary={row.assignedOwnerName || 'Unassigned'}
          secondary={row.lead_type === 'teacher_training' ? 'Reviewer' : row.assignedTeacherName || 'No teacher'}
        />
      ),
    },
    { header: 'Dates', accessor: (row) => <CompactCell primary={formatDate(row.next_follow_up_at)} secondary={`Created ${formatDate(row.created_at)}`} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <LeadActions
          lead={row}
          onDetails={() => openLead(row, 'view')}
          onEdit={() => openLead(row, 'edit')}
          onStatus={(status) => handleStatusChange(row, status)}
          onOwner={() => { setOwnerLead(row); setSelectedOwnerId(row.assigned_to || owners[0]?.id || ''); }}
          onTeacher={() => { setTeacherLead(row); setSelectedTeacherId(row.assigned_teacher_id || teachers[0]?.id || ''); }}
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
        eyebrow="LEADS CRM"
        title="Admissions Pipeline"
        subtitle="Track new inquiries, parent follow-ups, sources, trial readiness, and enrollment progress."
        action={(
          <div className="dashboard-page-actions">
            <ActionButton variant="copper" onClick={() => setAddLeadOpen(true)}><Icon name="plus" size={18} /> Add Lead</ActionButton>
            <ActionButton variant="secondary" onClick={() => exportLeadRows(sortedLeads)}><Icon name="download" size={18} /> Export Leads</ActionButton>
            <ActionButton variant="secondary" onClick={loadLeads}><Icon name="shieldCheck" size={18} /> Refresh</ActionButton>
          </div>
        )}
      />

      <div className="dashboard-stats-grid dashboard-stats-grid--leads">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <SectionCard className="dashboard-card--lead-workspace">
        <div className="lead-toolbar">
          <FilterBar search={search} onSearchChange={setSearch}>
            <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | 'all')}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label><span>Lead Type</span><select value={leadTypeFilter} onChange={(event) => setLeadTypeFilter(event.target.value as LeadType | 'all')}><option value="all">All lead types</option><option value="student">Student</option><option value="teacher_training">Teacher Training</option></select></label>
            <label><span>Program</span><select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}><option value="all">All programs</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}{programs.length === 0 && Array.from(new Set(leads.map((lead) => lead.programName).filter(Boolean))).map((program) => <option key={program} value={program}>{program}</option>)}</select></label>
            <label><span>Source</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">All sources</option>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
            <label><span>Owner</span><select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="all">All owners</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}</option>)}</select></label>
            <label><span>Teacher</span><select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}><option value="all">All teachers</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select></label>
          </FilterBar>
          <div className="lead-toolbar__bottom">
            <label className="dashboard-check-filter"><input type="checkbox" checked={followUpToday} onChange={(event) => setFollowUpToday(event.target.checked)} /> Follow-up due today</label>
            <div className="lead-date-range">
              <label><span>From</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
              <label><span>To</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
            </div>
            <div className="dashboard-view-toggle">
              <button className={view === 'table' ? 'is-active' : ''} type="button" onClick={() => setView('table')}>Table</button>
              <button className={view === 'pipeline' ? 'is-active' : ''} type="button" onClick={() => setView('pipeline')}>Pipeline</button>
            </div>
          </div>
        </div>

        {loading && <DashboardSkeleton cards={4} rows={7} label="Loading admissions pipeline" />}
        {!loading && filteredLeads.length === 0 && <EmptyState title="No leads found" description="New website form submissions and manually added leads will appear here." />}
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
                <strong>{sortedLeads.length} leads</strong>
                <span>Showing {tableStart}-{tableEnd}</span>
              </div>
              <label>
                Sort
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as LeadsSortKey)}>
                  <option value="created_desc">Newest first</option>
                  <option value="created_asc">Oldest first</option>
                  <option value="follow_up_asc">Follow-up due</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="status_asc">Status A-Z</option>
                </select>
              </label>
              <label>
                Rows
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                  {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <DataTable className="lead-crm-table-wrap" tableClassName="lead-crm-table" columns={tableColumns} rows={paginatedLeads} getRowKey={(row) => row.id} />
            <div className="lead-table-pagination">
              <ActionButton variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</ActionButton>
              <span>Page {currentPage} of {totalPages}</span>
              <ActionButton variant="secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Next</ActionButton>
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
          onAssignOwner={() => { setOwnerLead(selectedLead); setSelectedOwnerId(selectedLead.assigned_to || owners[0]?.id || ''); }}
          onAssignTeacher={() => { setTeacherLead(selectedLead); setSelectedTeacherId(selectedLead.assigned_teacher_id || teachers[0]?.id || ''); }}
          onScheduleTrial={() => setTrialLead(selectedLead)}
          onAddNote={handleAddNote}
          onMarkLost={() => setLostLead(selectedLead)}
          onConvert={() => setConvertLead(selectedLead)}
        />
      )}

      {teacherLead && <AssignTeacherModal lead={teacherLead} teachers={teachers} selectedTeacherId={selectedTeacherId} onSelectTeacher={setSelectedTeacherId} onClose={() => setTeacherLead(null)} onSave={async () => { await assignLeadTeacher(teacherLead.id, selectedTeacherId); setTeacherLead(null); setToast({ type: 'success', message: 'Teacher assigned.' }); await loadLeads(); }} />}
      {followUpLead && <FollowUpModal lead={followUpLead} onClose={() => setFollowUpLead(null)} onSave={handleFollowUpSave} />}
      {trialLead && <ScheduleTrialModal lead={trialLead} teachers={teachers} onClose={() => setTrialLead(null)} onSave={async (payload) => { await scheduleFreeTrial({ leadId: trialLead.id, programId: trialLead.program_id, ...payload }); setTrialLead(null); setToast({ type: 'success', message: 'Free trial scheduled.' }); await loadLeads(); }} />}
      {convertLead && <ConvertLeadModal lead={convertLead} teachers={teachers} onClose={() => setConvertLead(null)} onSave={async (payload) => { await convertLeadToStudent(convertLead.id, payload); setConvertLead(null); setToast({ type: 'success', message: 'Lead converted to student.' }); await loadLeads(); }} />}

      {ownerLead && (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Assign owner to ${ownerLead.full_name}`}>
          <div className="dashboard-modal__panel dashboard-modal__panel--small">
            <div className="dashboard-card__header"><div><h2>Assign Owner</h2><p>{ownerLead.full_name}</p></div></div>
            <div className="dashboard-form">
              <label><span>Admissions owner</span><select value={selectedOwnerId} onChange={(event) => setSelectedOwnerId(event.target.value)}>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name} - {owner.role}</option>)}</select></label>
              <div className="dashboard-form-actions"><ActionButton variant="copper" onClick={async () => { await assignLeadOwner(ownerLead.id, selectedOwnerId); setOwnerLead(null); setToast({ type: 'success', message: 'Owner assigned.' }); await loadLeads(); }}>Save Owner</ActionButton><ActionButton variant="secondary" onClick={() => setOwnerLead(null)}>Cancel</ActionButton></div>
            </div>
          </div>
        </div>
      )}

      {lostLead && (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Mark ${lostLead.full_name} lost`}>
          <div className="dashboard-modal__panel dashboard-modal__panel--small">
            <div className="dashboard-card__header"><div><h2>Mark Lost</h2><p>This closes the lead without enrollment.</p></div></div>
            <div className="dashboard-form">
              <label>
                <span>Lost reason</span>
                <textarea
                  rows={3}
                  value={lostReason}
                  onChange={(event) => setLostReason(event.target.value)}
                  placeholder="Budget, timing, no response, chose another academy..."
                />
              </label>
              <div className="dashboard-form-actions">
                <ActionButton variant="danger" onClick={handleMarkLost}>Confirm Mark Lost</ActionButton>
                <ActionButton variant="secondary" onClick={() => { setLostLead(null); setLostReason(''); }}>Cancel</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {addLeadOpen && (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Add lead">
          <div className="dashboard-modal__panel">
            <div className="dashboard-card__header"><div><h2>Add Lead</h2><p>Create a manual admissions lead.</p></div><ActionButton variant="ghost" onClick={() => setAddLeadOpen(false)}>Close</ActionButton></div>
            <form className="dashboard-form" onSubmit={handleAddLead}>
              <label><span>Full name</span><input name="full_name" required /></label>
              <label><span>WhatsApp</span><input name="whatsapp" /></label>
              <label><span>Country</span><input name="country" /></label>
              <label><span>Lead type</span><select name="lead_type" defaultValue="student"><option value="student">Student free trial</option><option value="teacher_training">Teacher training</option></select></label>
              <label><span>Program</span><select name="program_id"><option value="">Select program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
              <label><span>Program name fallback</span><input name="program_name" placeholder="Used if no program is selected" /></label>
              <label><span>Preferred time</span><input name="preferred_time" /></label>
              <label><span>Message</span><textarea name="message" rows={3} /></label>
              <div className="dashboard-form-actions"><ActionButton variant="copper" type="submit">Create Lead</ActionButton><ActionButton variant="secondary" type="button" onClick={() => setAddLeadOpen(false)}>Cancel</ActionButton></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
