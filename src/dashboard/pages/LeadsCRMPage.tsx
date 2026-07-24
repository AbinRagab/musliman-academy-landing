import { FormEvent, useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
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
import ScheduleTrialModal from '../components/ScheduleTrialModal';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import Toast, { type ToastMessage } from '../components/Toast';
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
  updateLeadStatus,
  type LeadActivity,
  type LeadRecord,
  type LeadStatus,
  type TeacherOption,
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

function mockLeads(): LeadRecord[] {
  return adminLeads.map((lead, index) => ({
    id: `mock-${index}`,
    full_name: lead.name,
    whatsapp: lead.contact,
    country: index === 0 ? 'United Kingdom' : index === 1 ? 'United States' : 'Australia',
    student_age: index === 2 ? 'Adult' : 'Child',
    program_id: null,
    preferred_time: 'Evening',
    message: 'Interested in a structured online learning path.',
    source: lead.source,
    form_type: 'free_trial',
    status: lead.status as LeadStatus,
    assigned_to: null,
    assigned_teacher_id: null,
    last_contact_at: null,
    next_follow_up_at: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
    notes: 'Mock CRM note for dashboard preview.',
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

function LeadActions({
  lead,
  onDetails,
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
  onStatus: (status: LeadStatus) => void;
  onOwner: () => void;
  onTeacher: () => void;
  onTrial: () => void;
  onFollowUp: () => void;
  onLost: () => void;
  onConvert: () => void;
}) {
  return (
    <details className="dashboard-actions-menu">
      <summary aria-label={`Actions for ${lead.full_name}`}><Icon name="moreVertical" size={18} /></summary>
      <div className="dashboard-actions-menu__content dashboard-actions-menu__content--wide">
        <button type="button" onClick={onDetails}>View Details</button>
        <button type="button" onClick={() => onStatus('contacted')}>Mark Contacted</button>
        <button type="button" onClick={onOwner}>Assign Owner</button>
        <button type="button" onClick={onTeacher}>Assign Teacher</button>
        <button type="button" onClick={onTrial}>Schedule Trial</button>
        <button type="button" onClick={onFollowUp}>Add Follow-up</button>
        <button type="button" onClick={onLost}>Mark Lost</button>
        <button type="button" onClick={onConvert}>Convert to Student</button>
      </div>
    </details>
  );
}

export default function LeadsCRMPage() {
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
  const [programFilter, setProgramFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [followUpToday, setFollowUpToday] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [teacherLead, setTeacherLead] = useState<LeadRecord | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [ownerLead, setOwnerLead] = useState<LeadRecord | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [trialLead, setTrialLead] = useState<LeadRecord | null>(null);
  const [followUpLead, setFollowUpLead] = useState<LeadRecord | null>(null);
  const [convertLead, setConvertLead] = useState<LeadRecord | null>(null);
  const [lostLead, setLostLead] = useState<LeadRecord | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [view, setView] = useState<'pipeline' | 'table'>('pipeline');

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
      setToast({ type: 'error', message: 'Live leads could not be loaded. Showing mock CRM data for layout review.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function openLead(lead: LeadRecord) {
    setSelectedLead(lead);

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

  const sources = useMemo(() => Array.from(new Set(leads.map((lead) => lead.source || 'website'))), [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch = !query || lead.full_name.toLowerCase().includes(query) || (lead.whatsapp || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesProgram = programFilter === 'all' || lead.program_id === programFilter || lead.programName === programFilter;
      const matchesSource = sourceFilter === 'all' || (lead.source || 'website') === sourceFilter;
      const matchesOwner = ownerFilter === 'all' || lead.assigned_to === ownerFilter;
      const matchesTeacher = teacherFilter === 'all' || lead.assigned_teacher_id === teacherFilter;
      const matchesFollowUp = !followUpToday || isDueToday(lead.next_follow_up_at);
      const createdTime = new Date(lead.created_at).getTime();
      const matchesDateFrom = !dateFrom || createdTime >= new Date(`${dateFrom}T00:00:00`).getTime();
      const matchesDateTo = !dateTo || createdTime <= new Date(`${dateTo}T23:59:59`).getTime();
      return matchesSearch && matchesStatus && matchesProgram && matchesSource && matchesOwner && matchesTeacher && matchesFollowUp && matchesDateFrom && matchesDateTo;
    });
  }, [dateFrom, dateTo, followUpToday, leads, ownerFilter, programFilter, search, sourceFilter, statusFilter, teacherFilter]);

  const stats = useMemo(() => {
    const newCount = leads.filter((lead) => lead.status === 'new').length;
    const contacted = leads.filter((lead) => lead.status === 'contacted').length;
    const trials = leads.filter((lead) => lead.status === 'trial_scheduled').length;
    const completed = leads.filter((lead) => lead.status === 'trial_completed').length;
    const enrolled = leads.filter((lead) => lead.status === 'enrolled').length;
    const conversionRate = leads.length ? Math.round((enrolled / leads.length) * 100) : 0;
    const dueToday = leads.filter((lead) => isDueToday(lead.next_follow_up_at)).length;

    return [
      { label: 'New Leads', value: newCount, trend: 'Awaiting first contact', icon: 'gift' },
      { label: 'Contacted', value: contacted, trend: 'Parent reached', icon: 'phone' },
      { label: 'Trials Scheduled', value: trials, trend: 'Assigned to teachers', icon: 'calendar' },
      { label: 'Trial Completed', value: completed, trend: 'Needs decision', icon: 'checkCircle' },
      { label: 'Enrolled', value: enrolled, trend: 'Converted students', icon: 'student' },
      { label: 'Conversion Rate', value: `${conversionRate}%`, trend: 'Lead to enrollment', icon: 'chart' },
      { label: 'Follow-ups Due Today', value: dueToday, trend: 'Admissions action', icon: 'clock' },
    ];
  }, [leads]);

  async function handleStatusChange(lead: LeadRecord, status: LeadStatus) {
    if (usingMockFallback) {
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status } : item));
      setToast({ type: 'success', message: 'Mock lead status updated.' });
      return;
    }

    await updateLeadStatus(lead.id, status, lead.status);
    setToast({ type: 'success', message: 'Lead status updated.' });
    await loadLeads();
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

  const tableColumns: Array<DataTableColumn<LeadRecord>> = [
    { header: 'Lead Name', accessor: 'full_name' },
    { header: 'WhatsApp', accessor: (row) => row.whatsapp || '-' },
    { header: 'Country', accessor: (row) => row.country || '-' },
    { header: 'Program', accessor: (row) => row.programName || '-' },
    { header: 'Source', accessor: (row) => row.source || 'website' },
    { header: 'Status', accessor: (row) => <LeadStatusBadge status={row.status} /> },
    { header: 'Assigned Owner', accessor: (row) => row.assignedOwnerName || 'Unassigned' },
    { header: 'Assigned Teacher', accessor: (row) => row.assignedTeacherName || 'Unassigned' },
    { header: 'Next Follow-up', accessor: (row) => formatDate(row.next_follow_up_at) },
    { header: 'Created At', accessor: (row) => formatDate(row.created_at) },
    {
      header: 'Actions',
      accessor: (row) => (
        <LeadActions
          lead={row}
          onDetails={() => openLead(row)}
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
      source: 'dashboard',
      form_type: 'manual',
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
            <ActionButton variant="secondary"><Icon name="download" size={18} /> Export</ActionButton>
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
              <button className={view === 'pipeline' ? 'is-active' : ''} type="button" onClick={() => setView('pipeline')}>Pipeline</button>
              <button className={view === 'table' ? 'is-active' : ''} type="button" onClick={() => setView('table')}>Table</button>
            </div>
          </div>
        </div>

        {loading && <div className="dashboard-loading-state">Loading admissions pipeline...</div>}
        {!loading && filteredLeads.length === 0 && <EmptyState title="No leads found" description="New website form submissions and manually added leads will appear here." />}
        {!loading && filteredLeads.length > 0 && view === 'pipeline' && (
          <LeadKanbanBoard leads={filteredLeads} onOpenLead={openLead} onQuickStatus={(lead) => handleStatusChange(lead, lead.status === 'new' ? 'contacted' : 'follow_up_later')} />
        )}
        {!loading && filteredLeads.length > 0 && view === 'table' && (
          <DataTable columns={tableColumns} rows={filteredLeads} getRowKey={(row) => row.id} />
        )}
      </SectionCard>

      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          activities={activities}
          onClose={() => setSelectedLead(null)}
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
            <div className="dashboard-form-actions"><ActionButton variant="danger" onClick={async () => { await handleStatusChange(lostLead, 'lost'); setLostLead(null); }}>Confirm Mark Lost</ActionButton><ActionButton variant="secondary" onClick={() => setLostLead(null)}>Cancel</ActionButton></div>
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
              <label><span>Program</span><select name="program_id"><option value="">Select program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
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
