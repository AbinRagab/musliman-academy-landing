import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import TeacherTrialCard from '../components/TeacherTrialCard';
import TrialFeedbackModal from '../components/TrialFeedbackModal';
import Toast, { type ToastMessage } from '../components/Toast';
import { updateTeacherSessionCheckin, type TeacherCheckinAction } from '../services/teacherCheckinService';
import { submitTrialFeedback, updateTrialStatus, fetchTeacherTrials } from '../services/trialsService';
import {
  freeTrials,
  studentEvaluations,
  teacherSchedule,
  teacherStats,
  teacherStudents,
} from '../data/mockData';

type TeacherClass = {
  id: string;
  time: string;
  student: string;
  program: string;
  status: string;
  platform: string;
  meetingLink?: string;
  reportStatus: string;
  attendanceStatus: string;
};

type TeacherStudent = {
  id: string;
  student: string;
  program: string;
  level: string;
  nextClass: string;
  attendance: string;
  progress: string;
  status: string;
};

type EvaluationRow = (typeof studentEvaluations)[number] & {
  id: string;
  program: string;
  relatedClass: string;
};

type FreeTrialFallback = {
  id: string;
  student: string;
  program: string;
  dateTime: string;
  status: string;
};

const todaysClasses: TeacherClass[] = teacherSchedule.map((item, index) => ({
  id: `class-${index}`,
  ...item,
  platform: index === 1 ? 'Zoom classroom' : 'Google Meet',
  meetingLink: index === 1 ? 'https://meet.google.com/' : undefined,
  reportStatus: item.status === 'Completed' ? 'Needs Report' : 'Not Due',
  attendanceStatus: item.status === 'Completed' ? 'Pending' : 'Not Started',
}));

const assignedStudents: TeacherStudent[] = teacherStudents.map((student, index) => ({
  id: index === 0 ? 'mock-yusuf' : `teacher-student-${index}`,
  student: student.student,
  program: student.level.includes('Tajweed') ? 'Tajweed' : student.level === 'Beginner' ? 'Arabic Language' : 'Quran Reading',
  level: student.level,
  nextClass: student.nextClass,
  attendance: student.attendance,
  progress: student.attendance === '88%' ? 'Needs support' : 'On track',
  status: student.attendance === '88%' ? 'needs support' : 'active',
}));

const evaluationQueue: EvaluationRow[] = studentEvaluations.map((evaluation, index) => ({
  ...evaluation,
  id: `evaluation-${index}`,
  program: index === 1 ? 'Arabic Language' : 'Quran Reading',
  relatedClass: index === 0 ? 'Quran Reading - Jul 28' : 'Today class',
}));

const fallbackTrials: FreeTrialFallback[] = freeTrials.map((trial, index) => ({
  id: `trial-${index}`,
  ...trial,
  status: index === 1 ? 'completed' : 'scheduled',
}));

function getScheduledStartAt(time: string) {
  const normalized = time.replace(/^Today\s+/i, '').trim();
  const today = new Date();
  const parsed = new Date(`${today.toDateString()} ${normalized}`);
  return Number.isNaN(parsed.getTime()) ? today.toISOString() : parsed.toISOString();
}

function EvaluationModal({ evaluation, onClose }: { evaluation: EvaluationRow; onClose: () => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Evaluate ${evaluation.student}`}>
      <div className="dashboard-modal__panel dashboard-modal__panel--wide">
        <div className="dashboard-card__header">
          <div>
            <h2>{evaluation.student}</h2>
            <p>{evaluation.program} - {evaluation.relatedClass}</p>
          </div>
          <button type="button" className="dashboard-icon-button" aria-label="Close evaluation" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <form className="dashboard-form">
          <div className="teacher-form-grid">
            {[
              'Reading accuracy',
              'Tajweed',
              'Memorization',
              'Understanding',
              'Participation',
              'Homework commitment',
              'Behavior',
            ].map((label) => (
              <label key={label}>
                <span>{label}</span>
                <input type="range" min="1" max="5" defaultValue="4" />
              </label>
            ))}
            <label>
              <span>Evaluation date</span>
              <input type="date" defaultValue="2026-07-29" />
            </label>
            <label className="teacher-form-grid__wide">
              <span>Strengths</span>
              <textarea rows={3} placeholder="Record strengths from recent classes." />
            </label>
            <label className="teacher-form-grid__wide">
              <span>Needs improvement</span>
              <textarea rows={3} placeholder="Record revision or support needs." />
            </label>
            <label className="teacher-form-grid__wide">
              <span>Teacher recommendation</span>
              <textarea rows={3} placeholder="Recommend next focus, level change, or admin review." />
            </label>
            <label className="teacher-form-grid__wide">
              <span>Next focus</span>
              <textarea rows={2} placeholder="Define the next lesson focus." />
            </label>
          </div>
          <div className="dashboard-form-actions">
            <ActionButton variant="secondary" onClick={onClose}>Save Draft</ActionButton>
            <ActionButton variant="copper" onClick={onClose}>Submit Evaluation</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClassReportModal({ classItem, onClose }: { classItem: TeacherClass; onClose: () => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Class report for ${classItem.student}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div>
            <h2>Add Class Report</h2>
            <p>{classItem.student} - {classItem.program}</p>
          </div>
          <button type="button" className="dashboard-icon-button" aria-label="Close report" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <form className="dashboard-form">
          <label><span>Lesson covered</span><input placeholder="Example: Madd letters review" /></label>
          <label><span>Homework assigned</span><textarea rows={3} placeholder="Describe homework for the next session." /></label>
          <label><span>Class notes</span><textarea rows={4} placeholder="Summarize class outcome and support needs." /></label>
          <label><span>Next lesson plan</span><textarea rows={3} placeholder="Define the next teaching plan." /></label>
          <div className="dashboard-form-actions">
            <ActionButton variant="copper" onClick={onClose}>Save Class Report</ActionButton>
            <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [evaluationStudent, setEvaluationStudent] = useState<EvaluationRow | null>(null);
  const [reportClass, setReportClass] = useState<TeacherClass | null>(null);
  const [teacherTrials, setTeacherTrials] = useState<Array<Record<string, unknown>>>([]);
  const [trialFeedback, setTrialFeedback] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetchTeacherTrials()
      .then((trials) => setTeacherTrials(trials as Array<Record<string, unknown>>))
      .catch(() => setTeacherTrials([]));
  }, []);

  const nextClass = useMemo(
    () => todaysClasses.find((classItem) => ['Live', 'Upcoming'].includes(classItem.status)) || todaysClasses[0],
    [],
  );

  async function handleCheckinAction(classItem: TeacherClass, action: TeacherCheckinAction) {
    await updateTeacherSessionCheckin({
      classId: classItem.id,
      scheduledStartAt: getScheduledStartAt(classItem.time),
      action,
      notes: `${action} from teacher dashboard`,
    });

    const messageByAction: Record<TeacherCheckinAction, string> = {
      ready: 'Teacher readiness recorded for this class.',
      joined: 'Join time recorded for this class.',
      live: 'Class marked live.',
      completed: 'Class ended. Please submit attendance and class report.',
    };

    setToast({ type: action === 'completed' ? 'info' : 'success', message: messageByAction[action] });
  }

  async function handleJoinClass(classItem: TeacherClass) {
    await handleCheckinAction(classItem, 'joined');

    if (classItem.meetingLink) {
      window.open(classItem.meetingLink, '_blank', 'noopener,noreferrer');
      return;
    }

    setToast({ type: 'info', message: 'Meeting link is not available. Please contact the academy team.' });
  }

  const scheduleColumns: Array<DataTableColumn<TeacherClass>> = [
    { header: 'Time', accessor: 'time' },
    { header: 'Student', accessor: 'student' },
    { header: 'Program', accessor: 'program' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    { header: 'Platform', accessor: 'platform' },
    {
      header: 'Action',
      accessor: (row) => (
        <DashboardActionMenu
          primaryAction={{ label: row.reportStatus === 'Needs Report' ? 'Add Report' : row.attendanceStatus === 'Pending' ? 'Mark Attendance' : 'Join Class', onClick: row.reportStatus === 'Needs Report' ? () => setReportClass(row) : row.attendanceStatus === 'Pending' ? () => navigate('/dashboard/teacher/attendance') : () => handleJoinClass(row) }}
          actions={[
            { label: 'I am Ready', onClick: () => handleCheckinAction(row, 'ready') },
            { label: 'Join Class', onClick: () => handleJoinClass(row), hidden: row.reportStatus !== 'Needs Report' && row.attendanceStatus !== 'Pending' },
            { label: 'Start Class', onClick: () => handleCheckinAction(row, 'live') },
            { label: 'End Class', onClick: () => handleCheckinAction(row, 'completed') },
            { label: 'Mark Attendance', onClick: () => navigate('/dashboard/teacher/attendance'), hidden: row.attendanceStatus === 'Pending' },
            { label: 'Add Class Report', onClick: () => setReportClass(row), hidden: row.reportStatus === 'Needs Report' },
            { label: 'View Details', onClick: () => setToast({ type: 'info', message: `${row.student}: ${row.program} at ${row.time}.` }) },
          ]}
        />
      ),
    },
  ];

  const studentColumns: Array<DataTableColumn<TeacherStudent>> = [
    { header: 'Student', accessor: 'student' },
    { header: 'Program', accessor: 'program' },
    { header: 'Next Class', accessor: 'nextClass' },
    { header: 'Attendance', accessor: 'attendance' },
    { header: 'Progress', accessor: 'progress' },
    {
      header: 'Action',
      accessor: (row) => (
        <DashboardActionMenu
          primaryAction={{ label: 'Open Record', onClick: () => navigate(`/dashboard/teacher/students/${row.id}`) }}
          actions={[
            { label: 'View Attendance', onClick: () => navigate('/dashboard/teacher/attendance') },
            {
              label: 'Add Evaluation',
              onClick: () => setEvaluationStudent({
                ...(studentEvaluations[0] || { recitation: 0, tajweed: 0, understanding: 0 }),
                id: row.id,
                student: row.student,
                program: row.program,
                relatedClass: row.nextClass,
                status: 'ready',
              }),
            },
            { label: 'Add Class Note', onClick: () => setReportClass(todaysClasses.find((classItem) => classItem.student === row.student) || todaysClasses[0]) },
            { label: 'Message via Academy', onClick: () => navigate('/dashboard/teacher/messages') },
          ]}
        />
      ),
    },
  ];

  const evaluationColumns: Array<DataTableColumn<EvaluationRow>> = [
    { header: 'Student', accessor: 'student' },
    { header: 'Program', accessor: 'program' },
    { header: 'Related Class', accessor: 'relatedClass' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    { header: 'Action', accessor: (row) => <ActionButton variant="ghost" onClick={() => setEvaluationStudent(row)}>Evaluate</ActionButton> },
  ];

  const trialColumns: Array<DataTableColumn<FreeTrialFallback>> = [
    { header: 'Student', accessor: 'student' },
    { header: 'Program Interest', accessor: 'program' },
    { header: 'Trial Time', accessor: 'dateTime' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    {
      header: 'Action',
      accessor: (row) => (
        <DashboardActionMenu
          primaryAction={{ label: row.status === 'completed' ? 'View Feedback' : 'View Trial', onClick: row.status === 'completed' ? () => setTrialFeedback(row) : () => setToast({ type: 'info', message: `Trial details opened for ${row.student}.` }) }}
          actions={[
            { label: 'Join Trial', onClick: () => setToast({ type: 'info', message: 'Meeting link is not available. Please contact the academy team.' }), hidden: row.status !== 'scheduled' },
            { label: 'Add Trial Feedback', onClick: () => setTrialFeedback(row), hidden: row.status === 'completed' },
            { label: 'Message Admin', onClick: () => navigate('/dashboard/teacher/messages') },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="dashboard-page dashboard-page--teacher-home">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">Teacher Workspace</span>
          <h1>Teacher Dashboard</h1>
          <p>Daily view for classes, assigned students, attendance, evaluations, trials, and academy messages.</p>
        </div>
        <ActionButton onClick={() => navigate('/dashboard/teacher/schedule')}>
          <Icon name="calendar" size={18} />
          Open Schedule
        </ActionButton>
      </div>

      <SectionCard className="teacher-next-class-card">
        <div className="teacher-next-class">
          <div>
            <span className="dashboard-eyebrow">Next Class</span>
            <h2>{nextClass.student}</h2>
            <p>{nextClass.program} - {nextClass.time}</p>
          </div>
          <div className="teacher-next-class__details">
            <span><strong>Status</strong><StatusBadge label={nextClass.status} /></span>
            <span><strong>Meeting platform</strong>{nextClass.platform}</span>
            <span><strong>Attendance</strong>{nextClass.attendanceStatus}</span>
          </div>
          <div className="teacher-action-row">
            <DashboardActionMenu
              primaryAction={{ label: 'Join Class', icon: <Icon name="video" size={16} />, onClick: () => handleJoinClass(nextClass) }}
              actions={[
                { label: 'I am Ready', onClick: () => handleCheckinAction(nextClass, 'ready') },
                { label: 'Start Class', onClick: () => handleCheckinAction(nextClass, 'live') },
                { label: 'End Class', onClick: () => handleCheckinAction(nextClass, 'completed') },
                { label: 'Mark Attendance', onClick: () => navigate('/dashboard/teacher/attendance') },
                { label: 'Add Class Report', onClick: () => setReportClass(nextClass) },
                { label: 'View Details', onClick: () => setToast({ type: 'info', message: `${nextClass.student}: ${nextClass.program} at ${nextClass.time}.` }) },
              ]}
            />
          </div>
        </div>
      </SectionCard>

      <div className="dashboard-stats-grid dashboard-stats-grid--teacher">
        {teacherStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <SectionCard title="Today's Schedule" subtitle="Classes assigned to you today." action={<ActionButton variant="ghost" onClick={() => navigate('/dashboard/teacher/schedule')}>View Full Timetable</ActionButton>}>
        <DataTable columns={scheduleColumns} rows={todaysClasses} getRowKey={(row) => row.id} />
      </SectionCard>

      <div className="dashboard-grid dashboard-grid--teacher">
        <SectionCard title="My Students Needing Attention" subtitle="Assigned students with support signals.">
          <DataTable columns={studentColumns} rows={assignedStudents.filter((student) => student.progress === 'Needs support' || student.nextClass.includes('Today'))} getRowKey={(row) => row.id} />
        </SectionCard>

        <SectionCard title="Attendance to Submit" subtitle="Class attendance awaiting submission.">
          <div className="teacher-task-list">
            {todaysClasses.filter((classItem) => classItem.attendanceStatus === 'Pending').map((classItem) => (
              <article key={classItem.id}>
                <div>
                  <strong>{classItem.student}</strong>
                  <span>{classItem.program} - {classItem.time}</span>
                </div>
                <ActionButton variant="ghost" onClick={() => navigate('/dashboard/teacher/attendance')}>Mark Attendance</ActionButton>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Pending Evaluations" subtitle="Academic evaluations ready for teacher input.">
          <DataTable columns={evaluationColumns} rows={evaluationQueue} getRowKey={(row) => row.id} />
        </SectionCard>

        <SectionCard title="Upcoming Free Trials" subtitle="Trials assigned to you. Conversion remains an admin action.">
          {teacherTrials.length > 0 ? (
            <div className="teacher-trials-list">
              {teacherTrials.map((trial) => (
                <TeacherTrialCard
                  key={String(trial.id)}
                  trial={trial as never}
                  onDetails={() => setToast({ type: 'info', message: 'Trial details show learner interest, meeting link, admin owner, and academy contact policy.' })}
                  onFeedback={() => setTrialFeedback(trial)}
                  onNoShow={async () => {
                    await updateTrialStatus(String(trial.id), 'no_show', trial.lead_id ? String(trial.lead_id) : null);
                    setToast({ type: 'success', message: 'No-show note sent to admin.' });
                    setTeacherTrials(await fetchTeacherTrials() as Array<Record<string, unknown>>);
                  }}
                />
              ))}
            </div>
          ) : (
            <DataTable columns={trialColumns} rows={fallbackTrials} getRowKey={(row) => row.id} />
          )}
        </SectionCard>
      </div>

      {trialFeedback && (
        <TrialFeedbackModal
          title={String((trialFeedback.lead as { full_name?: string } | undefined)?.full_name || trialFeedback.student || 'Trial student')}
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

      {evaluationStudent && <EvaluationModal evaluation={evaluationStudent} onClose={() => setEvaluationStudent(null)} />}
      {reportClass && <ClassReportModal classItem={reportClass} onClose={() => { setReportClass(null); setToast({ type: 'success', message: 'Class report saved.' }); }} />}
    </div>
  );
}
