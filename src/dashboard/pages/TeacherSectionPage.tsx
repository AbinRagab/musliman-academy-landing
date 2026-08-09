import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EvaluationCard from '../components/EvaluationCard';
import FilterBar from '../components/FilterBar';
import ProfilePanel from '../components/ProfilePanel';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import TeacherLinkingDebugPanel from '../components/TeacherLinkingDebugPanel';
import TeacherTrialCard from '../components/TeacherTrialCard';
import TrialFeedbackModal from '../components/TrialFeedbackModal';
import Toast, { type ToastMessage } from '../components/Toast';
import { updateTeacherSessionCheckin, type TeacherCheckinAction } from '../services/teacherCheckinService';
import { submitTrialFeedback, updateTrialStatus, fetchTeacherTrials } from '../services/trialsService';
import {
  fetchTeacherOperationsData,
  markTeacherAttendance,
  saveTeacherClassReport,
  saveTeacherEvaluation,
  type TeacherClassRow as ClassRow,
  type TeacherEvaluationRow as EvaluationRow,
  type TeacherStudentRow as StudentRow,
} from '../services/teacherOperationsService';

type TeacherSection =
  | 'students'
  | 'free-trials'
  | 'schedule'
  | 'classes'
  | 'attendance'
  | 'evaluations'
  | 'reports'
  | 'messages'
  | 'profile'
  | 'settings';

type TrialRow = {
  id: string;
  lead: string;
  program: string;
  dateTime: string;
  status: string;
  adminOwner: string;
};

type MessageThread = {
  id: string;
  from: string;
  subject: string;
  student: string;
  relatedClass: string;
  unread: boolean;
  preview: string;
};

const messageThreads: MessageThread[] = [];

function notifyMissingMeeting(setToast: (toast: ToastMessage) => void) {
  setToast({ type: 'info', message: 'Meeting link is not available. Please contact the academy team.' });
}

function getScheduledStartAt(dateTime: string) {
  const normalized = dateTime.replace(/^Today\s+/i, new Date().toDateString() + ' ');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

async function updateClassCheckin(classItem: ClassRow, action: TeacherCheckinAction, setToast: (toast: ToastMessage) => void) {
  await updateTeacherSessionCheckin({
    classId: classItem.id,
    scheduledStartAt: getScheduledStartAt(classItem.dateTime),
    action,
    notes: `${action} from teacher ${classItem.status.toLowerCase()} workflow`,
  });

  const messageByAction: Record<TeacherCheckinAction, string> = {
    ready: 'Teacher readiness recorded for this class.',
    joined: 'Join time recorded for this class.',
    live: 'Class marked live.',
    completed: 'Class ended. Please submit attendance and class report.',
  };

  setToast({ type: action === 'completed' ? 'info' : 'success', message: messageByAction[action] });
}

async function joinClass(classItem: ClassRow, setToast: (toast: ToastMessage) => void) {
  await updateClassCheckin(classItem, 'joined', setToast);

  if (classItem.meetingLink) {
    window.open(classItem.meetingLink, '_blank', 'noopener,noreferrer');
    return;
  }

  notifyMissingMeeting(setToast);
}

function TeacherEvaluationModal({ evaluation, onClose, onSubmit }: { evaluation: EvaluationRow; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Evaluate ${evaluation.student}`}>
      <div className="dashboard-modal__panel dashboard-modal__panel--wide">
        <div className="dashboard-card__header">
          <div>
            <h2>Evaluate Student</h2>
            <p>{evaluation.student} - {evaluation.program}</p>
          </div>
          <button type="button" className="dashboard-icon-button" aria-label="Close evaluation" onClick={onClose}><Icon name="x" /></button>
        </div>
        <form className="dashboard-form" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>
          <div className="teacher-form-grid">
            <label><span>Student</span><input value={evaluation.student} readOnly /></label>
            <label><span>Related class</span><input value={evaluation.relatedClass} readOnly /></label>
            <label><span>Program</span><input value={evaluation.program} readOnly /></label>
            <label><span>Evaluation date</span><input type="date" defaultValue="2026-07-29" /></label>
            <label><span>Reading accuracy</span><input name="recitationRating" type="range" min="1" max="5" defaultValue="4" /></label>
            <label><span>Tajweed</span><input name="tajweedRating" type="range" min="1" max="5" defaultValue="4" /></label>
            <label><span>Understanding</span><input name="understandingRating" type="range" min="1" max="5" defaultValue="4" /></label>
            <label><span>Behavior</span><input name="behaviorRating" type="range" min="1" max="5" defaultValue="4" /></label>
            <label className="teacher-form-grid__wide"><span>Strengths / progress notes</span><textarea name="progressNotes" rows={3} /></label>
            <label className="teacher-form-grid__wide"><span>Teacher recommendation</span><textarea name="recommendation" rows={3} /></label>
            <label className="teacher-form-grid__wide"><span>Next focus</span><textarea rows={2} /></label>
          </div>
          <div className="dashboard-form-actions">
            <ActionButton variant="secondary" onClick={onClose}>Save as Draft</ActionButton>
            <ActionButton type="submit" variant="copper">Submit Evaluation</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClassReportModal({ classItem, onClose, onSubmit }: { classItem: ClassRow; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Report for ${classItem.student}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div><h2>Add Class Report</h2><p>{classItem.student} - {classItem.dateTime}</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close report" onClick={onClose}><Icon name="x" /></button>
        </div>
        <form className="dashboard-form" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>
          <label><span>Lesson covered</span><input name="lessonCovered" defaultValue={classItem.lessonCovered === 'Planned lesson' ? '' : classItem.lessonCovered} required /></label>
          <label><span>Homework assigned</span><textarea name="homework" rows={3} defaultValue={classItem.homeworkAssigned === 'Set after class' ? '' : classItem.homeworkAssigned} /></label>
          <label><span>Class notes</span><textarea name="notes" rows={4} defaultValue={classItem.notes} /></label>
          <label><span>Next lesson plan</span><textarea rows={3} /></label>
          <div className="dashboard-form-actions"><ActionButton type="submit" variant="copper">Save Class Report</ActionButton><ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton></div>
        </form>
      </div>
    </div>
  );
}

function ClassDetailsModal({ classItem, onClose }: { classItem: ClassRow; onClose: () => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Class details for ${classItem.student}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div><h2>Class Details</h2><p>{classItem.student} - {classItem.dateTime}</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close class details" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="student-info-grid">
          <span>Program<strong>{classItem.program}</strong></span>
          <span>Status<strong><StatusBadge label={classItem.status} /></strong></span>
          <span>Platform<strong>{classItem.platform}</strong></span>
          <span>Attendance<strong>{classItem.attendanceStatus}</strong></span>
          <span>Lesson covered<strong>{classItem.lessonCovered || 'Not recorded yet'}</strong></span>
          <span>Homework<strong>{classItem.homeworkAssigned || 'No homework assigned'}</strong></span>
          <span>Report status<strong>{classItem.reportStatus}</strong></span>
          <span>Notes<strong>{classItem.notes || 'No notes recorded'}</strong></span>
        </div>
      </div>
    </div>
  );
}

function ComposeModal({ students, classRows, onClose }: { students: StudentRow[]; classRows: ClassRow[]; onClose: () => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="New message">
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div><h2>New Message</h2><p>Messages to parents are routed through the academy when direct messaging is restricted.</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close message" onClick={onClose}><Icon name="x" /></button>
        </div>
        <form className="dashboard-form">
          <label><span>To</span><select><option>Academic Manager</option><option>Admissions Team</option><option>Send parent note for admin review</option></select></label>
          <label><span>Related student</span><select>{students.map((student) => <option key={student.id}>{student.student}</option>)}</select></label>
          <label><span>Related class</span><select>{classRows.slice(0, 4).map((classItem) => <option key={classItem.id}>{classItem.program} - {classItem.dateTime}</option>)}</select></label>
          <label><span>Subject</span><input /></label>
          <label><span>Message</span><textarea rows={5} /></label>
          <div className="dashboard-form-actions"><ActionButton variant="copper" onClick={onClose}>Send</ActionButton><ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton></div>
        </form>
      </div>
    </div>
  );
}

export default function TeacherSectionPage({ section }: { section: TeacherSection }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [search, setSearch] = useState('');
  const [activeClassTab, setActiveClassTab] = useState('Today');
  const [evaluationModal, setEvaluationModal] = useState<EvaluationRow | null>(null);
  const [reportModal, setReportModal] = useState<ClassRow | null>(null);
  const [classDetails, setClassDetails] = useState<ClassRow | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [teacherTrials, setTeacherTrials] = useState<Array<Record<string, unknown>>>([]);
  const [trialFeedback, setTrialFeedback] = useState<Record<string, unknown> | null>(null);
  const [trialDetails, setTrialDetails] = useState<Record<string, unknown> | TrialRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classRows, setClassRows] = useState<ClassRow[]>([]);
  const [evaluationRows, setEvaluationRows] = useState<EvaluationRow[]>([]);
  const [loadingOperations, setLoadingOperations] = useState(true);
  const [teacherContextError, setTeacherContextError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    loadTeacherOperations();

    if (section === 'free-trials' || section === 'reports') {
      loadTeacherTrials();
    }
  }, [section]);

  async function loadTeacherOperations() {
    setLoadingOperations(true);

    try {
      const data = await fetchTeacherOperationsData();
      setTeacherContextError(data.contextError || null);
      setStudents(data.students);
      setClassRows(data.classes);
      setEvaluationRows(data.evaluations);
      setSelectedClassId((current) => current || data.classes[0]?.id || '');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Teacher operations fetch failed:', error);
      }
      setStudents([]);
      setClassRows([]);
      setEvaluationRows([]);
      setTeacherContextError('Unable to load teacher records. Please try again.');
    } finally {
      setLoadingOperations(false);
    }
  }

  async function loadTeacherTrials() {
    try {
      const trials = await fetchTeacherTrials();
      setTeacherTrials(trials as Array<Record<string, unknown>>);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Teacher trials fetch failed:', error);
      }
      setTeacherTrials([]);
    }
  }

  async function handleClassReportSubmit(classItem: ClassRow, formData: FormData) {
    await saveTeacherClassReport({
      classId: classItem.id,
      lessonCovered: String(formData.get('lessonCovered') || ''),
      homework: String(formData.get('homework') || ''),
      notes: String(formData.get('notes') || ''),
    });
    setReportModal(null);
    setToast({ type: 'success', message: 'Class report saved.' });
    await loadTeacherOperations();
  }

  async function handleEvaluationSubmit(evaluation: EvaluationRow, formData: FormData) {
    if (!evaluation.studentId) {
      setToast({ type: 'error', message: 'This evaluation is missing a student record.' });
      return;
    }

    await saveTeacherEvaluation({
      studentId: evaluation.studentId,
      classId: evaluation.classId,
      recitationRating: Number(formData.get('recitationRating') || 4),
      tajweedRating: Number(formData.get('tajweedRating') || 4),
      understandingRating: Number(formData.get('understandingRating') || 4),
      behaviorRating: Number(formData.get('behaviorRating') || 4),
      progressNotes: String(formData.get('progressNotes') || ''),
      recommendation: String(formData.get('recommendation') || ''),
    });
    setEvaluationModal(null);
    setToast({ type: 'success', message: 'Evaluation submitted.' });
    await loadTeacherOperations();
  }

  const titleBySection: Record<TeacherSection, string> = {
    students: 'My Students',
    'free-trials': 'Assigned Free Trials',
    schedule: 'Schedule',
    classes: 'My Classes',
    attendance: 'Attendance',
    evaluations: 'Student Evaluations',
    reports: 'Teacher Reports',
    messages: 'Messages',
    profile: 'Teacher Profile',
    settings: 'Teacher Settings',
  };

  const subtitleBySection: Record<TeacherSection, string> = {
    students: 'Assigned learners only, with academic actions and academy-routed communication.',
    'free-trials': 'Assigned trial sessions and teacher feedback workflow.',
    schedule: 'Upcoming timetable, live class access, and timezone-aware class timing.',
    classes: 'Class records, attendance status, reports, homework, and teaching notes.',
    attendance: 'Submit attendance for a selected class and date.',
    evaluations: 'Submit academic evaluations for assigned students.',
    reports: 'Teacher workload, completion, and student support summary.',
    messages: 'Academy, parent, student, and class-related message threads.',
    profile: 'Academic profile, availability, workload, and teacher documents.',
    settings: 'Notification, reminder, language, timezone, and availability preferences.',
  };

  const commonHeader = (
    <DashboardPageHeader
      eyebrow="TEACHER PORTAL"
      title={titleBySection[section]}
      subtitle={subtitleBySection[section]}
      action={section === 'schedule' ? undefined : (
        <ActionButton variant="secondary" onClick={() => navigate('/dashboard/teacher/schedule')}>
          <Icon name="calendar" size={18} />
          Open Schedule
        </ActionButton>
      )}
    />
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? students.filter((student) => Object.values(student).some((value) => String(value).toLowerCase().includes(query))) : students;
  }, [search]);

  const studentColumns: Array<DataTableColumn<StudentRow>> = [
    { header: 'Student', accessor: 'student' },
    { header: 'Program', accessor: 'program' },
    { header: 'Level', accessor: 'level' },
    { header: 'Next Class', accessor: 'nextClass' },
    { header: 'Progress', accessor: 'progress' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    {
      header: 'Action',
      accessor: (row) => (
        <DashboardActionMenu
          primaryAction={{ label: 'Open Record', onClick: () => navigate(`/dashboard/teacher/students/${row.id}`) }}
          actions={[
            { label: 'View Attendance', onClick: () => navigate('/dashboard/teacher/attendance') },
            { label: 'Add Evaluation', onClick: () => setEvaluationModal({ id: row.id, student: row.student, program: row.program, relatedClass: row.nextClass, status: 'ready' }) },
            {
              label: 'Add Class Note',
              onClick: () => {
                const relatedClass = classRows.find((classItem) => classItem.student === row.student) || classRows[0];
                if (relatedClass) {
                  setReportModal(relatedClass);
                  return;
                }

                setToast({ type: 'info', message: 'No class record is available for this student yet.' });
              },
            },
            { label: 'Message via Academy', onClick: () => setComposeOpen(true) },
          ]}
        />
      ),
    },
  ];

  if (teacherContextError && !loadingOperations) {
    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        {['students', 'schedule'].includes(section) && <TeacherLinkingDebugPanel route={`/dashboard/teacher/${section}`} />}
        <SectionCard title="Teacher profile is not connected">
          <p className="dashboard-empty-copy">{teacherContextError}</p>
        </SectionCard>
      </div>
    );
  }

  if (section === 'students') {
    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        <TeacherLinkingDebugPanel route="/dashboard/teacher/students" />
        <FilterBar search={search} onSearchChange={setSearch}>
          <label><span>Status</span><select defaultValue="all"><option value="all">All assigned</option><option value="needs">Needs support</option><option value="active">Active</option></select></label>
        </FilterBar>
        <SectionCard title="Assigned Students" subtitle="Parent contact is handled through academy-approved messaging.">
          {filteredStudents.length > 0 ? (
            <DataTable columns={studentColumns} rows={filteredStudents} getRowKey={(row) => row.id} />
          ) : (
            <p className="dashboard-empty-copy">No assigned students yet. Students assigned by the academy team will appear here.</p>
          )}
        </SectionCard>
        {evaluationModal && <TeacherEvaluationModal evaluation={evaluationModal} onClose={() => setEvaluationModal(null)} onSubmit={(formData) => handleEvaluationSubmit(evaluationModal, formData)} />}
        {reportModal && <ClassReportModal classItem={reportModal} onClose={() => setReportModal(null)} onSubmit={(formData) => handleClassReportSubmit(reportModal, formData)} />}
        {classDetails && <ClassDetailsModal classItem={classDetails} onClose={() => setClassDetails(null)} />}
        {composeOpen && <ComposeModal students={students} classRows={classRows} onClose={() => { setComposeOpen(false); setToast({ type: 'success', message: 'Message sent to academy workflow.' }); }} />}
      </div>
    );
  }

  if (section === 'free-trials') {
    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        <div className="dashboard-grid dashboard-grid--two">
          <SectionCard title="Trial Queue" subtitle="Teachers submit feedback only. Lead conversion remains with admin.">
            <div className="teacher-trials-list">
              {teacherTrials.length > 0 ? teacherTrials.map((trial) => (
                <TeacherTrialCard
                  key={String(trial.id)}
                  trial={trial as never}
                  onDetails={() => setTrialDetails(trial)}
                  onFeedback={() => setTrialFeedback(trial)}
                  onNoShow={async () => {
                    await updateTrialStatus(String(trial.id), 'no_show', trial.lead_id ? String(trial.lead_id) : null);
                    setToast({ type: 'success', message: 'No-show note sent to admin.' });
                    setTeacherTrials(await fetchTeacherTrials() as Array<Record<string, unknown>>);
                  }}
                />
              )) : <p className="dashboard-empty-copy">No free trials assigned yet.</p>}
            </div>
          </SectionCard>
          <SectionCard title="Trial Feedback Checklist">
            <div className="teacher-checklist">
              {['Reading level', 'Tajweed level', 'Arabic level', 'Student engagement', 'Recommended level', 'Teacher feedback', 'Recommendation', 'Trial result'].map((item) => (
                <span key={item}><Icon name="check" size={16} />{item}</span>
              ))}
            </div>
          </SectionCard>
        </div>
        {trialDetails && (
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Trial details">
            <div className="dashboard-modal__panel">
              <div className="dashboard-card__header"><div><h2>{String(('lead' in trialDetails && typeof trialDetails.lead === 'object' ? (trialDetails.lead as { full_name?: string }).full_name : (trialDetails as TrialRow).lead) || 'Trial student')}</h2><p>Trial details and academy contact policy.</p></div><button type="button" className="dashboard-icon-button" aria-label="Close trial details" onClick={() => setTrialDetails(null)}><Icon name="x" /></button></div>
              <div className="student-info-grid">
                <span>Program interest<strong>{String((trialDetails as TrialRow).program || ((trialDetails.lead as { programName?: string } | undefined)?.programName) || 'Program not assigned')}</strong></span>
                <span>Trial time<strong>{String((trialDetails as TrialRow).dateTime || `${(trialDetails as Record<string, unknown>).trial_date || 'Date pending'} ${(trialDetails as Record<string, unknown>).trial_time || ''}`)}</strong></span>
                <span>Status<strong><StatusBadge label={String(trialDetails.status || 'scheduled')} /></strong></span>
                <span>Admin owner<strong>{String((trialDetails as TrialRow).adminOwner || 'Admissions Team')}</strong></span>
                <span>Meeting link<strong>{String((trialDetails as Record<string, unknown>).meeting_link || 'Available from schedule when assigned')}</strong></span>
                <span>Parent contact policy<strong>Message via Academy</strong></span>
              </div>
            </div>
          </div>
        )}
        {trialFeedback && (
          <TrialFeedbackModal
            title={String((trialFeedback.lead as { full_name?: string } | undefined)?.full_name || trialFeedback.lead || 'Trial student')}
            onClose={() => setTrialFeedback(null)}
            onSave={async (payload) => {
              await submitTrialFeedback(String(trialFeedback.id), { ...payload, leadId: trialFeedback.lead_id ? String(trialFeedback.lead_id) : null });
              setTrialFeedback(null);
              setToast({ type: 'success', message: 'Trial feedback submitted.' });
              setTeacherTrials(await fetchTeacherTrials() as Array<Record<string, unknown>>);
            }}
          />
        )}
      </div>
    );
  }

  if (section === 'schedule') {
    const scheduleColumns: Array<DataTableColumn<ClassRow>> = [
      { header: 'Time', accessor: 'dateTime' },
      { header: 'Student', accessor: 'student' },
      { header: 'Program', accessor: 'program' },
      { header: 'Platform', accessor: 'platform' },
      { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
      {
        header: 'Action',
        accessor: (row) => (
          <DashboardActionMenu
            primaryAction={{ label: 'Join Class', onClick: () => joinClass(row, setToast) }}
            actions={[
              { label: 'I am Ready', onClick: () => updateClassCheckin(row, 'ready', setToast) },
              { label: 'Start Class', onClick: () => updateClassCheckin(row, 'live', setToast), hidden: row.status !== 'Live' },
              { label: 'End Class', onClick: () => updateClassCheckin(row, 'completed', setToast), hidden: row.status !== 'Live' },
              { label: 'Mark Attendance', onClick: () => navigate('/dashboard/teacher/attendance') },
              { label: 'Add Class Report', onClick: () => setReportModal(row) },
              { label: 'View Details', onClick: () => setClassDetails(row) },
            ]}
          />
        ),
      },
    ];

    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        <TeacherLinkingDebugPanel route="/dashboard/teacher/schedule" />
        <SectionCard title="Today's Classes" subtitle="Timezone: Africa/Cairo">
          {classRows.filter((row) => row.dateTime.startsWith('Today')).length > 0 ? (
            <DataTable columns={scheduleColumns} rows={classRows.filter((row) => row.dateTime.startsWith('Today'))} getRowKey={(row) => row.id} />
          ) : (
            <p className="dashboard-empty-copy">No classes scheduled today.</p>
          )}
        </SectionCard>
        <SectionCard title="Upcoming Classes" subtitle="Timetable view for assigned live and upcoming classes.">
          <div className="teacher-week-grid">
            {classRows.filter((row) => ['Live', 'Upcoming', 'Scheduled'].includes(row.status)).map((row) => (
              <article key={row.id}>
                <span>{row.dateTime}</span>
                <strong>{row.student}</strong>
                <p>{row.program} - {row.platform}</p>
                <StatusBadge label={row.status} />
                <div className="teacher-action-row">
                  <DashboardActionMenu
                    primaryAction={{ label: 'Join Class', onClick: () => joinClass(row, setToast) }}
                    actions={[
                      { label: 'I am Ready', onClick: () => updateClassCheckin(row, 'ready', setToast) },
                      { label: 'View Details', onClick: () => setClassDetails(row) },
                      { label: 'Mark Attendance', onClick: () => navigate('/dashboard/teacher/attendance') },
                      { label: 'Add Class Report', onClick: () => setReportModal(row) },
                    ]}
                  />
                </div>
              </article>
            ))}
            {classRows.filter((row) => ['Live', 'Upcoming', 'Scheduled'].includes(row.status)).length === 0 && <p className="dashboard-empty-copy">No classes scheduled yet.</p>}
          </div>
        </SectionCard>
        {reportModal && <ClassReportModal classItem={reportModal} onClose={() => setReportModal(null)} onSubmit={(formData) => handleClassReportSubmit(reportModal, formData)} />}
        {classDetails && <ClassDetailsModal classItem={classDetails} onClose={() => setClassDetails(null)} />}
      </div>
    );
  }

  if (section === 'classes') {
    const rowsByTab = classRows.filter((row) => {
      if (activeClassTab === 'Today') return row.dateTime.startsWith('Today');
      if (activeClassTab === 'Upcoming') return ['Live', 'Upcoming', 'Scheduled'].includes(row.status);
      if (activeClassTab === 'Completed') return row.status === 'Completed';
      if (activeClassTab === 'Needs Report') return row.reportStatus === 'Needs Report';
      return ['Cancelled', 'Rescheduled'].includes(row.status);
    });
    const columns: Array<DataTableColumn<ClassRow>> = [
      { header: 'Student(s)', accessor: 'student' },
      { header: 'Program', accessor: 'program' },
      { header: 'Date/time', accessor: 'dateTime' },
      { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
      { header: 'Attendance', accessor: 'attendanceStatus' },
      { header: 'Report', accessor: 'reportStatus' },
      {
        header: 'Action',
        accessor: (row) => (
          <DashboardActionMenu
            primaryAction={{
              label: ['Live', 'Upcoming'].includes(row.status) ? 'Join Class' : row.reportStatus === 'Needs Report' ? 'Add Report' : 'View Details',
              onClick: ['Live', 'Upcoming'].includes(row.status) ? () => joinClass(row, setToast) : row.reportStatus === 'Needs Report' ? () => setReportModal(row) : () => setClassDetails(row),
            }}
            actions={[
              { label: 'I am Ready', onClick: () => updateClassCheckin(row, 'ready', setToast), hidden: !['Live', 'Upcoming', 'Scheduled'].includes(row.status) },
              { label: 'Start Class', onClick: () => updateClassCheckin(row, 'live', setToast), hidden: row.status !== 'Live' },
              { label: 'End Class', onClick: () => updateClassCheckin(row, 'completed', setToast), hidden: row.status !== 'Live' },
              { label: row.reportStatus === 'Submitted' ? 'View Report' : 'Add Report', onClick: row.reportStatus === 'Submitted' ? () => setClassDetails(row) : () => setReportModal(row), hidden: row.reportStatus === 'Needs Report' },
              { label: 'Set Homework', onClick: () => setReportModal(row) },
              { label: 'Mark Attendance', onClick: () => navigate('/dashboard/teacher/attendance') },
              { label: 'View Class Details', onClick: () => setClassDetails(row) },
            ]}
          />
        ),
      },
    ];

    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        <div className="student-message-tabs" role="tablist" aria-label="Class record filters">
          {['Today', 'Upcoming', 'Completed', 'Needs Report', 'Cancelled / Rescheduled'].map((tab) => <button key={tab} type="button" className={activeClassTab === tab ? 'is-active' : ''} onClick={() => setActiveClassTab(tab)}>{tab}</button>)}
        </div>
        <SectionCard title="Class Records" subtitle="Schedule shows when classes happen. My Classes records what happened in class.">
          {rowsByTab.length > 0 ? (
            <DataTable columns={columns} rows={rowsByTab} getRowKey={(row) => row.id} />
          ) : (
            <p className="dashboard-empty-copy">No class records found for this filter.</p>
          )}
        </SectionCard>
        {reportModal && <ClassReportModal classItem={reportModal} onClose={() => setReportModal(null)} onSubmit={(formData) => handleClassReportSubmit(reportModal, formData)} />}
        {classDetails && <ClassDetailsModal classItem={classDetails} onClose={() => setClassDetails(null)} />}
      </div>
    );
  }

  if (section === 'attendance') {
    const selectedClass = classRows.find((classItem) => classItem.id === selectedClassId) || classRows[0];
    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        <SectionCard title="Class Attendance" subtitle="Based on submitted attendance records.">
          {selectedClass ? (
            <form className="dashboard-form">
              <div className="teacher-form-grid">
                <label><span>Class</span><select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>{classRows.map((classItem) => <option key={classItem.id} value={classItem.id}>{classItem.student} - {classItem.dateTime}</option>)}</select></label>
                <label><span>Date</span><input type="date" /></label>
              </div>
              <div className="dashboard-attendance-list">
                {[selectedClass.student].map((student) => (
                  <div className="dashboard-attendance-row dashboard-attendance-row--expanded" key={student}>
                    <span>{student}</span>
                    {['present', 'absent', 'late', 'excused'].map((status) => <label key={status}><input type="radio" name={`attendance-${selectedClass.id}`} value={status} defaultChecked={status === 'present'} /> {status}</label>)}
                    <input name={`attendance-note-${selectedClass.id}`} placeholder="Attendance note" />
                    <StatusBadge label={selectedClass.attendanceStatus === 'Submitted' ? 'submitted' : 'pending'} />
                  </div>
                ))}
              </div>
              <div className="dashboard-form-actions">
                <ActionButton
                  variant="copper"
                  onClick={async () => {
                    if (!selectedClass.studentId) {
                      setToast({ type: 'error', message: 'This class is missing a student record.' });
                      return;
                    }

                    const selectedStatus = document.querySelector<HTMLInputElement>(`input[name="attendance-${selectedClass.id}"]:checked`)?.value || 'present';
                    const notes = document.querySelector<HTMLInputElement>(`input[name="attendance-note-${selectedClass.id}"]`)?.value || '';
                    await markTeacherAttendance({
                      classId: selectedClass.id,
                      studentId: selectedClass.studentId,
                      status: selectedStatus as 'present' | 'absent' | 'late' | 'excused',
                      notes,
                    });
                    setToast({ type: 'success', message: 'Attendance submitted.' });
                    await loadTeacherOperations();
                  }}
                >
                  Save Attendance
                </ActionButton>
              </div>
            </form>
          ) : (
            <p className="dashboard-empty-copy">No assigned classes need attendance.</p>
          )}
        </SectionCard>
        <SectionCard title="Completion Health">
          <div className="dashboard-insight-list">
            <EvaluationCard title="Submitted attendance" score={classRows.filter((classItem) => classItem.attendanceStatus === 'Submitted').length} note="Based on attendance records linked to assigned classes." />
            <EvaluationCard title="Pending attendance" score={classRows.filter((classItem) => classItem.attendanceStatus === 'Pending').length} note="Completed classes awaiting attendance submission." />
          </div>
        </SectionCard>
      </div>
    );
  }

  if (section === 'evaluations') {
    const columns: Array<DataTableColumn<EvaluationRow>> = [
      { header: 'Student', accessor: 'student' },
      { header: 'Program', accessor: 'program' },
      { header: 'Related Class', accessor: 'relatedClass' },
      { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
      { header: 'Action', accessor: (row) => <ActionButton variant="ghost" onClick={() => setEvaluationModal(row)}>Evaluate</ActionButton> },
    ];

    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        <FilterBar search={search} onSearchChange={setSearch}>
          <label><span>Status</span><select defaultValue="pending"><option>Pending evaluations</option><option>Drafts</option><option>Submitted</option><option>Needs review</option></select></label>
        </FilterBar>
        <SectionCard title="Evaluation Queue">
          <DataTable columns={columns} rows={evaluationRows} getRowKey={(row) => row.id} />
        </SectionCard>
        {evaluationModal && <TeacherEvaluationModal evaluation={evaluationModal} onClose={() => setEvaluationModal(null)} onSubmit={(formData) => handleEvaluationSubmit(evaluationModal, formData)} />}
      </div>
    );
  }

  if (section === 'reports') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {commonHeader}
        <div className="dashboard-stats-grid dashboard-stats-grid--teacher">
          {[
            { label: 'Classes This Week', value: classRows.length, trend: 'Assigned class records', icon: 'calendar' },
            { label: 'Attendance Submitted', value: classRows.filter((classItem) => classItem.attendanceStatus === 'Submitted').length, trend: 'Linked attendance records', icon: 'clipboard' },
            { label: 'Pending Evaluations', value: evaluationRows.length, trend: 'Completed classes awaiting evaluation', icon: 'chart' },
            { label: 'Trial Feedback', value: `${teacherTrials.length}`, trend: 'Assigned trial records', icon: 'gift' },
          ].map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>
        <div className="dashboard-grid dashboard-grid--two">
          <SectionCard title="Teacher Performance">
            <div className="dashboard-insight-list">
              <EvaluationCard title="Assigned students" score={students.length} note="Students where assigned_teacher_id matches this teacher." />
              <EvaluationCard title="Completed classes" score={classRows.filter((classItem) => classItem.status === 'Completed').length} note="Completed class records from Supabase." />
              <EvaluationCard title="Reports submitted" score={classRows.filter((classItem) => classItem.reportStatus === 'Submitted').length} note="Classes with lesson or homework notes saved." />
            </div>
          </SectionCard>
          <SectionCard title="Report Actions">
            <div className="teacher-checklist">
              <button type="button" onClick={() => window.print()}><Icon name="download" size={16} />Export My Report</button>
              <button type="button" onClick={() => navigate('/dashboard/teacher/evaluations')}><Icon name="clipboard" size={16} />View Pending Evaluations</button>
              <button type="button" onClick={() => navigate('/dashboard/teacher/students')}><Icon name="users" size={16} />View Students Needing Support</button>
              <button type="button" onClick={() => navigate('/dashboard/teacher/classes')}><Icon name="fileText" size={16} />View Pending Class Reports</button>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (section === 'messages') {
    const [selectedThread] = messageThreads;
    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        <DashboardPageHeader eyebrow="TEACHER PORTAL" title="Messages" subtitle={subtitleBySection.messages} action={<ActionButton variant="copper" onClick={() => setComposeOpen(true)}><Icon name="send" size={16} />New Message</ActionButton>} />
        <FilterBar search={search} onSearchChange={setSearch}>
          <label><span>Filter by student</span><select defaultValue="all"><option>All students</option>{students.map((student) => <option key={student.id}>{student.student}</option>)}</select></label>
        </FilterBar>
        <div className="dashboard-grid dashboard-grid--two student-messages-layout">
          <SectionCard title="Inbox">
            <div className="student-messages-list">
              {messageThreads.length === 0 && <p className="dashboard-empty-copy">No messages yet.</p>}
              {messageThreads.map((thread) => <button className={`student-message-card ${selectedThread && thread.id === selectedThread.id ? 'is-selected' : ''}`} type="button" key={thread.id}><div><strong>{thread.from}</strong>{thread.unread && <StatusBadge label="new" />}</div><h3>{thread.subject}</h3><p>{thread.preview}</p><footer><span>{thread.student}</span><small>{thread.relatedClass}</small></footer></button>)}
            </div>
          </SectionCard>
          <SectionCard title="Message Thread">
            {selectedThread ? (
              <div className="student-message-detail">
                <div className="student-message-detail__header">
                  <div><span>{selectedThread.from}</span><h2>{selectedThread.subject}</h2><p>{selectedThread.student} - {selectedThread.relatedClass}</p></div>
                  <DashboardActionMenu
                    primaryAction={{ label: 'Reply', onClick: () => setComposeOpen(true) }}
                    actions={[
                      { label: 'Message Admin', onClick: () => setComposeOpen(true) },
                      { label: 'Send Parent Note for Admin Review', onClick: () => setComposeOpen(true) },
                    ]}
                  />
                </div>
                <p>{selectedThread.preview}</p>
              </div>
            ) : (
              <p className="dashboard-empty-copy">Select a message when one is available.</p>
            )}
          </SectionCard>
        </div>
        {composeOpen && <ComposeModal students={students} classRows={classRows} onClose={() => { setComposeOpen(false); setToast({ type: 'success', message: 'Message sent.' }); }} />}
      </div>
    );
  }

  if (section === 'profile') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {commonHeader}
        <div className="dashboard-grid dashboard-grid--two student-profile-layout">
          <ProfilePanel name="Teacher Profile" subtitle="Academic profile will load from Supabase teacher records." role="teacher" status="No profile data" items={[{ label: 'Languages', value: 'Not set' }, { label: 'Availability', value: 'Not set' }, { label: 'Assigned students', value: String(students.length) }, { label: 'Current load', value: '0%' }, { label: 'Completed classes', value: String(classRows.filter((classItem) => classItem.status === 'Completed').length) }, { label: 'Average rating', value: 'No rating yet' }]} />
          <SectionCard title="Academic Profile">
            <form className="dashboard-form">
              <label><span>Bio</span><textarea rows={4} placeholder="Add or request a teacher bio update." /></label>
              <label><span>Language preferences</span><input placeholder="Not set" /></label>
              <label><span>Profile photo</span><input type="file" /></label>
              <div className="teacher-checklist">
                <span><Icon name="certificate" size={16} />Ijazah document on file</span>
                <span><Icon name="document" size={16} />Identity document verified</span>
                <span><Icon name="shieldCheck" size={16} />Hourly rate, role, status, assigned students, and permissions are admin-managed</span>
              </div>
              <div className="dashboard-form-actions"><ActionButton variant="copper">Save Profile Request</ActionButton><ActionButton variant="secondary" onClick={() => navigate('/dashboard/teacher/settings')}>Notification Preferences</ActionButton></div>
            </form>
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-page--management">
      {commonHeader}
      <div className="dashboard-grid dashboard-grid--two student-settings-layout">
        <SectionCard title="Notification Preferences">
          <form className="dashboard-form">
            {['Class reminders', 'Free trial reminders', 'Evaluation reminders', 'WhatsApp notifications', 'Email notifications'].map((item) => <label className="student-setting-toggle" key={item}><span><strong>{item}</strong><small>Receive operational reminders for assigned work.</small></span><input type="checkbox" defaultChecked /></label>)}
            <label><span>Language</span><select defaultValue="English"><option>English</option><option>Arabic</option><option>Urdu</option></select></label>
            <label><span>Timezone</span><select defaultValue="Africa/Cairo"><option>Africa/Cairo</option><option>Europe/London</option><option>America/New_York</option></select></label>
            <div className="dashboard-form-actions"><ActionButton variant="copper">Save Preferences</ActionButton></div>
          </form>
        </SectionCard>
        <SectionCard title="Security and Availability">
          <div className="student-security-list">
            <button type="button"><Icon name="lock" size={16} />Change Password<Icon name="chevronRight" size={16} /></button>
            <button type="button"><Icon name="calendar" size={16} />Request Availability Update<Icon name="chevronRight" size={16} /></button>
          </div>
          <form className="dashboard-form">
            <label><span>Availability preferences</span><textarea rows={4} defaultValue="Weekday evenings, limited weekend availability by admin approval." /></label>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
