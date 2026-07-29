import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EvaluationCard from '../components/EvaluationCard';
import FilterBar from '../components/FilterBar';
import ProfilePanel from '../components/ProfilePanel';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import TeacherTrialCard from '../components/TeacherTrialCard';
import TrialFeedbackModal from '../components/TrialFeedbackModal';
import Toast, { type ToastMessage } from '../components/Toast';
import { updateTeacherSessionCheckin, type TeacherCheckinAction } from '../services/teacherCheckinService';
import {
  freeTrials,
  studentEvaluations,
  teacherPerformance,
  teacherSchedule,
  teacherStats,
  teacherStudents,
} from '../data/mockData';
import { submitTrialFeedback, updateTrialStatus, fetchTeacherTrials } from '../services/trialsService';

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

type StudentRow = {
  id: string;
  student: string;
  program: string;
  level: string;
  nextClass: string;
  attendance: string;
  progress: string;
  status: string;
};

type ClassRow = {
  id: string;
  student: string;
  program: string;
  dateTime: string;
  status: string;
  platform: string;
  meetingLink?: string;
  attendanceStatus: string;
  lessonCovered: string;
  homeworkAssigned: string;
  reportStatus: string;
  notes: string;
};

type EvaluationRow = {
  id: string;
  student: string;
  program: string;
  relatedClass: string;
  status: string;
};

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

const students: StudentRow[] = teacherStudents.map((student, index) => ({
  id: index === 0 ? 'mock-yusuf' : `teacher-student-${index}`,
  student: student.student,
  program: student.level.includes('Tajweed') ? 'Tajweed' : student.level === 'Beginner' ? 'Arabic Language' : 'Quran Reading',
  level: student.level,
  nextClass: student.nextClass,
  attendance: student.attendance,
  progress: student.attendance === '88%' ? 'Needs support' : 'On track',
  status: student.attendance === '88%' ? 'needs support' : 'active',
}));

const classRows: ClassRow[] = [
  ...teacherSchedule.map((item, index) => ({
    id: `class-${index}`,
    student: item.student,
    program: item.program,
    dateTime: `Today ${item.time}`,
    status: item.status,
    platform: index === 1 ? 'Zoom classroom' : 'Google Meet',
    meetingLink: index === 1 ? 'https://meet.google.com/' : undefined,
    attendanceStatus: item.status === 'Completed' ? 'Pending' : 'Not Started',
    lessonCovered: item.status === 'Completed' ? 'Madd letters revision' : 'Planned lesson',
    homeworkAssigned: item.status === 'Completed' ? 'Revision audio upload' : 'Set after class',
    reportStatus: item.status === 'Completed' ? 'Needs Report' : 'Not Due',
    notes: item.status === 'Completed' ? 'Class completed; report pending.' : 'Prepare class materials.',
  })),
  {
    id: 'class-history-1',
    student: 'Yusuf Ahmed',
    program: 'Quran Reading',
    dateTime: 'Jul 27, 2026 05:00 PM',
    status: 'Completed',
    platform: 'Zoom classroom',
    attendanceStatus: 'Submitted',
    lessonCovered: 'Surah Al-Mulk fluency',
    homeworkAssigned: 'Repeat ayat 1-5',
    reportStatus: 'Submitted',
    notes: 'Progressing steadily.',
  },
  {
    id: 'class-cancelled-1',
    student: 'Noor Hassan',
    program: 'Islamic Studies',
    dateTime: 'Jul 26, 2026 06:00 PM',
    status: 'Cancelled',
    platform: 'Google Meet',
    attendanceStatus: 'Not Required',
    lessonCovered: '-',
    homeworkAssigned: '-',
    reportStatus: 'Not Required',
    notes: 'Rescheduled by admin.',
  },
];

const evaluationRows: EvaluationRow[] = studentEvaluations.map((item, index) => ({
  id: `evaluation-${index}`,
  student: item.student,
  program: index === 1 ? 'Arabic Language' : 'Quran Reading',
  relatedClass: index === 0 ? 'Jul 28 class' : 'Today class',
  status: item.status,
}));

const trialRows: TrialRow[] = freeTrials.map((trial, index) => ({
  id: `trial-${index}`,
  lead: trial.student,
  program: trial.program,
  dateTime: trial.dateTime,
  status: index === 1 ? 'completed' : index === 2 ? 'no_show' : 'scheduled',
  adminOwner: index === 2 ? 'Admissions Team' : 'Omar Khaled',
}));

const messageThreads: MessageThread[] = [
  {
    id: 'msg-1',
    from: 'Academic Manager',
    subject: 'Revision support needed',
    student: 'Adam Khan',
    relatedClass: 'Tajweed - Today 01:30 PM',
    unread: true,
    preview: 'Please add a short support note after today class.',
  },
  {
    id: 'msg-2',
    from: 'Parent note via Academy',
    subject: 'Schedule confirmation',
    student: 'Lina Omar',
    relatedClass: 'Arabic Language - Today 10:00 AM',
    unread: false,
    preview: 'Family confirmed class time and requested homework reminder.',
  },
  {
    id: 'msg-3',
    from: 'Admissions',
    subject: 'Trial feedback request',
    student: 'Musa Patel',
    relatedClass: 'Trial class',
    unread: true,
    preview: 'Please submit trial feedback after the assigned session.',
  },
];

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

function CompactActions({ children }: { children: React.ReactNode }) {
  return <div className="dashboard-table-actions dashboard-table-actions--wrap">{children}</div>;
}

function TeacherEvaluationModal({ evaluation, onClose }: { evaluation: EvaluationRow; onClose: () => void }) {
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
        <form className="dashboard-form">
          <div className="teacher-form-grid">
            <label><span>Student</span><input value={evaluation.student} readOnly /></label>
            <label><span>Related class</span><input value={evaluation.relatedClass} readOnly /></label>
            <label><span>Program</span><input value={evaluation.program} readOnly /></label>
            <label><span>Evaluation date</span><input type="date" defaultValue="2026-07-29" /></label>
            {['Reading accuracy', 'Tajweed', 'Memorization', 'Understanding', 'Participation', 'Homework commitment', 'Behavior'].map((label) => (
              <label key={label}><span>{label}</span><input type="range" min="1" max="5" defaultValue="4" /></label>
            ))}
            <label className="teacher-form-grid__wide"><span>Strengths</span><textarea rows={3} /></label>
            <label className="teacher-form-grid__wide"><span>Needs improvement</span><textarea rows={3} /></label>
            <label className="teacher-form-grid__wide"><span>Teacher recommendation</span><textarea rows={3} /></label>
            <label className="teacher-form-grid__wide"><span>Next focus</span><textarea rows={2} /></label>
          </div>
          <div className="dashboard-form-actions">
            <ActionButton variant="secondary" onClick={onClose}>Save as Draft</ActionButton>
            <ActionButton variant="copper" onClick={onClose}>Submit Evaluation</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClassReportModal({ classItem, onClose }: { classItem: ClassRow; onClose: () => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Report for ${classItem.student}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div><h2>Add Class Report</h2><p>{classItem.student} - {classItem.dateTime}</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close report" onClick={onClose}><Icon name="x" /></button>
        </div>
        <form className="dashboard-form">
          <label><span>Lesson covered</span><input defaultValue={classItem.lessonCovered === 'Planned lesson' ? '' : classItem.lessonCovered} /></label>
          <label><span>Homework assigned</span><textarea rows={3} defaultValue={classItem.homeworkAssigned === 'Set after class' ? '' : classItem.homeworkAssigned} /></label>
          <label><span>Class notes</span><textarea rows={4} defaultValue={classItem.notes} /></label>
          <label><span>Next lesson plan</span><textarea rows={3} /></label>
          <div className="dashboard-form-actions"><ActionButton variant="copper" onClick={onClose}>Save Class Report</ActionButton><ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton></div>
        </form>
      </div>
    </div>
  );
}

function ComposeModal({ onClose }: { onClose: () => void }) {
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
  const [composeOpen, setComposeOpen] = useState(false);
  const [teacherTrials, setTeacherTrials] = useState<Array<Record<string, unknown>>>([]);
  const [trialFeedback, setTrialFeedback] = useState<Record<string, unknown> | null>(null);
  const [trialDetails, setTrialDetails] = useState<Record<string, unknown> | TrialRow | null>(null);
  const [selectedClassId, setSelectedClassId] = useState(classRows[0]?.id || '');

  useEffect(() => {
    if (section === 'free-trials') {
      fetchTeacherTrials()
        .then((trials) => setTeacherTrials(trials as Array<Record<string, unknown>>))
        .catch(() => setTeacherTrials([]));
    }
  }, [section]);

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
    { header: 'Attendance Rate', accessor: 'attendance' },
    { header: 'Progress', accessor: 'progress' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    {
      header: 'Action',
      accessor: (row) => (
        <CompactActions>
          <Link className="dashboard-action dashboard-action--ghost" to={`/dashboard/teacher/students/${row.id}`}>Open Record</Link>
          <ActionButton variant="ghost" onClick={() => navigate('/dashboard/teacher/attendance')}>View Attendance</ActionButton>
          <ActionButton variant="ghost" onClick={() => setEvaluationModal({ id: row.id, student: row.student, program: row.program, relatedClass: row.nextClass, status: 'ready' })}>Add Evaluation</ActionButton>
          <ActionButton variant="ghost" onClick={() => setReportModal(classRows.find((classItem) => classItem.student === row.student) || classRows[0])}>Add Class Note</ActionButton>
          <ActionButton variant="ghost" onClick={() => setComposeOpen(true)}>Message via Academy</ActionButton>
        </CompactActions>
      ),
    },
  ];

  if (section === 'students') {
    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        <FilterBar search={search} onSearchChange={setSearch}>
          <label><span>Status</span><select defaultValue="all"><option value="all">All assigned</option><option value="needs">Needs support</option><option value="active">Active</option></select></label>
        </FilterBar>
        <SectionCard title="Assigned Students" subtitle="Parent contact is handled through academy-approved messaging.">
          <DataTable columns={studentColumns} rows={filteredStudents} getRowKey={(row) => row.id} />
        </SectionCard>
        {evaluationModal && <TeacherEvaluationModal evaluation={evaluationModal} onClose={() => { setEvaluationModal(null); setToast({ type: 'success', message: 'Evaluation saved.' }); }} />}
        {reportModal && <ClassReportModal classItem={reportModal} onClose={() => { setReportModal(null); setToast({ type: 'success', message: 'Class note saved.' }); }} />}
        {composeOpen && <ComposeModal onClose={() => { setComposeOpen(false); setToast({ type: 'success', message: 'Message sent to academy workflow.' }); }} />}
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
              )) : trialRows.map((trial) => (
                <article className="teacher-trial-card" key={trial.id}>
                  <div><h3>{trial.lead}</h3><p>{trial.program}</p></div>
                  <div className="teacher-trial-card__meta"><span><Icon name="calendar" size={15} /> {trial.dateTime}</span><span><Icon name="shieldCheck" size={15} /> Parent contact via academy</span></div>
                  <StatusBadge label={trial.status} />
                  <div className="teacher-trial-card__actions">
                    <ActionButton variant="ghost" onClick={() => setTrialDetails(trial)}>View Trial</ActionButton>
                    {trial.status === 'scheduled' && <ActionButton variant="secondary" onClick={() => notifyMissingMeeting(setToast)}>Join Trial</ActionButton>}
                    {trial.status === 'completed' ? <ActionButton variant="secondary" onClick={() => setTrialFeedback(trial)}>View Feedback</ActionButton> : <ActionButton variant="copper" onClick={() => setTrialFeedback(trial)}>{trial.status === 'no_show' ? 'Add Note' : 'Add Trial Feedback'}</ActionButton>}
                    {trial.status === 'no_show' && <ActionButton variant="ghost" onClick={() => setToast({ type: 'success', message: 'Admin notified about trial note.' })}>Notify Admin</ActionButton>}
                  </div>
                </article>
              ))}
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
              if (String(trialFeedback.id).startsWith('trial-')) {
                setTrialFeedback(null);
                setToast({ type: 'success', message: 'Trial feedback saved for academy review.' });
                return;
              }

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
          <CompactActions>
            <ActionButton variant="ghost" onClick={() => updateClassCheckin(row, 'ready', setToast)}>I am Ready</ActionButton>
            <ActionButton variant="ghost" onClick={() => joinClass(row, setToast)}>Join Class</ActionButton>
            {row.status === 'Live' && <ActionButton variant="ghost" onClick={() => updateClassCheckin(row, 'live', setToast)}>Start Class</ActionButton>}
            <ActionButton variant="ghost" onClick={() => setToast({ type: 'info', message: `${row.student}: ${row.notes}` })}>View Details</ActionButton>
            <ActionButton variant="ghost" onClick={() => navigate('/dashboard/teacher/attendance')}>Mark Attendance</ActionButton>
            <ActionButton variant="ghost" onClick={() => setReportModal(row)}>Add Class Report</ActionButton>
          </CompactActions>
        ),
      },
    ];

    return (
      <div className="dashboard-page dashboard-page--management">
        <Toast toast={toast} onClose={() => setToast(null)} />
        {commonHeader}
        <SectionCard title="Today's Classes" subtitle="Timezone: Africa/Cairo">
          <DataTable columns={scheduleColumns} rows={classRows.filter((row) => row.dateTime.startsWith('Today'))} getRowKey={(row) => row.id} />
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
                  <ActionButton variant="ghost" onClick={() => updateClassCheckin(row, 'ready', setToast)}>I am Ready</ActionButton>
                  <ActionButton variant="ghost" onClick={() => joinClass(row, setToast)}>Join Class</ActionButton>
                  <ActionButton variant="ghost" onClick={() => setToast({ type: 'info', message: `${row.student}: ${row.notes}` })}>View Details</ActionButton>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
        {reportModal && <ClassReportModal classItem={reportModal} onClose={() => { setReportModal(null); setToast({ type: 'success', message: 'Class report saved.' }); }} />}
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
      { header: 'Lesson Covered', accessor: 'lessonCovered' },
      { header: 'Homework', accessor: 'homeworkAssigned' },
      { header: 'Report', accessor: 'reportStatus' },
      {
        header: 'Action',
        accessor: (row) => (
          <CompactActions>
            {['Live', 'Upcoming', 'Scheduled'].includes(row.status) && <ActionButton variant="ghost" onClick={() => updateClassCheckin(row, 'ready', setToast)}>I am Ready</ActionButton>}
            {['Live', 'Upcoming'].includes(row.status) && <ActionButton variant="ghost" onClick={() => joinClass(row, setToast)}>Join Class</ActionButton>}
            {row.status === 'Live' && <ActionButton variant="ghost" onClick={() => updateClassCheckin(row, 'live', setToast)}>Start Class</ActionButton>}
            {row.status === 'Live' && <ActionButton variant="ghost" onClick={() => updateClassCheckin(row, 'completed', setToast)}>End Class</ActionButton>}
            {row.reportStatus === 'Submitted' ? <ActionButton variant="ghost" onClick={() => setToast({ type: 'info', message: row.notes })}>View Report</ActionButton> : <ActionButton variant="ghost" onClick={() => setReportModal(row)}>Add Report</ActionButton>}
            <ActionButton variant="ghost" onClick={() => setReportModal(row)}>Set Homework</ActionButton>
            <ActionButton variant="ghost" onClick={() => navigate('/dashboard/teacher/attendance')}>Mark Attendance</ActionButton>
            <ActionButton variant="ghost" onClick={() => setToast({ type: 'info', message: `${row.student}: ${row.notes}` })}>View Class Details</ActionButton>
          </CompactActions>
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
          <DataTable columns={columns} rows={rowsByTab} getRowKey={(row) => row.id} />
        </SectionCard>
        {reportModal && <ClassReportModal classItem={reportModal} onClose={() => { setReportModal(null); setToast({ type: 'success', message: 'Class record saved.' }); }} />}
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
          <form className="dashboard-form">
            <div className="teacher-form-grid">
              <label><span>Class</span><select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>{classRows.map((classItem) => <option key={classItem.id} value={classItem.id}>{classItem.student} - {classItem.dateTime}</option>)}</select></label>
              <label><span>Date</span><input type="date" defaultValue="2026-07-29" /></label>
            </div>
            <div className="dashboard-attendance-list">
              {[selectedClass.student].map((student) => (
                <div className="dashboard-attendance-row dashboard-attendance-row--expanded" key={student}>
                  <span>{student}</span>
                  {['Present', 'Absent', 'Late', 'Excused'].map((status) => <label key={status}><input type="radio" name={`attendance-${student}`} defaultChecked={status === 'Present'} /> {status}</label>)}
                  <input placeholder="Attendance note" />
                  <StatusBadge label={selectedClass.attendanceStatus === 'Submitted' ? 'submitted' : 'pending'} />
                </div>
              ))}
            </div>
            <div className="dashboard-form-actions"><ActionButton variant="copper" onClick={() => setToast({ type: 'success', message: 'Attendance saved.' })}>Save Attendance</ActionButton></div>
          </form>
        </SectionCard>
        <SectionCard title="Completion Health">
          <div className="dashboard-insight-list">
            {teacherPerformance.map((item) => <EvaluationCard key={item.label} title={item.label} score={item.value} note="Based on submitted attendance records." />)}
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
        {evaluationModal && <TeacherEvaluationModal evaluation={evaluationModal} onClose={() => { setEvaluationModal(null); setToast({ type: 'success', message: 'Evaluation saved.' }); }} />}
      </div>
    );
  }

  if (section === 'reports') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {commonHeader}
        <div className="dashboard-stats-grid dashboard-stats-grid--teacher">
          {[
            { label: 'Classes This Week', value: 18, trend: '42 this month', icon: 'calendar' },
            { label: 'Attendance Completion', value: '92%', trend: '3 pending', icon: 'clipboard' },
            { label: 'Evaluation Completion', value: '84%', trend: '11 pending', icon: 'chart' },
            { label: 'Trial Feedback', value: '80%', trend: '1 due today', icon: 'gift' },
          ].map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>
        <div className="dashboard-grid dashboard-grid--two">
          <SectionCard title="Teacher Performance">
            <div className="dashboard-insight-list">
              <EvaluationCard title="Students needing support" score={25} note="One assigned student is below attendance or progress target." />
              <EvaluationCard title="Homework reviewed" score={88} note="Most assigned homework has teacher review recorded." />
              <EvaluationCard title="Average student progress" score={78} note="Calculated from submitted evaluations and class notes." />
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
              {messageThreads.map((thread) => <button className={`student-message-card ${thread.id === selectedThread.id ? 'is-selected' : ''}`} type="button" key={thread.id}><div><strong>{thread.from}</strong>{thread.unread && <StatusBadge label="new" />}</div><h3>{thread.subject}</h3><p>{thread.preview}</p><footer><span>{thread.student}</span><small>{thread.relatedClass}</small></footer></button>)}
            </div>
          </SectionCard>
          <SectionCard title="Message Thread">
            <div className="student-message-detail">
              <div className="student-message-detail__header"><div><span>{selectedThread.from}</span><h2>{selectedThread.subject}</h2><p>{selectedThread.student} - {selectedThread.relatedClass}</p></div><ActionButton variant="ghost" onClick={() => setComposeOpen(true)}>Reply</ActionButton></div>
              <p>{selectedThread.preview}</p>
              <div className="teacher-action-row"><ActionButton variant="secondary" onClick={() => setComposeOpen(true)}>Message Admin</ActionButton><ActionButton variant="secondary" onClick={() => setComposeOpen(true)}>Send Parent Note for Admin Review</ActionButton></div>
            </div>
          </SectionCard>
        </div>
        {composeOpen && <ComposeModal onClose={() => { setComposeOpen(false); setToast({ type: 'success', message: 'Message sent.' }); }} />}
      </div>
    );
  }

  if (section === 'profile') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {commonHeader}
        <div className="dashboard-grid dashboard-grid--two student-profile-layout">
          <ProfilePanel name="Ust. Maryam Ali" subtitle="Quran Reading, Tajweed, Arabic foundations" role="teacher" status="active" items={[{ label: 'Languages', value: 'Arabic, English' }, { label: 'Availability', value: 'Weekday evenings' }, { label: 'Assigned students', value: '38' }, { label: 'Current load', value: '82%' }, { label: 'Completed classes', value: '214' }, { label: 'Average rating', value: '4.8/5' }]} />
          <SectionCard title="Academic Profile">
            <form className="dashboard-form">
              <label><span>Bio</span><textarea rows={4} defaultValue="Quran and Tajweed teacher focused on careful recitation, revision discipline, and age-appropriate lesson structure." /></label>
              <label><span>Language preferences</span><input defaultValue="Arabic, English" /></label>
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
