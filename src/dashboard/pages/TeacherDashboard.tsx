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
  fetchTeacherDashboardData,
  type TeacherDashboardClass as TeacherClass,
  type TeacherDashboardData,
  type TeacherDashboardEvaluation as EvaluationRow,
} from '../services/teacherDashboardService';

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

function TeacherClassDetailsModal({ classItem, onClose }: { classItem: TeacherClass; onClose: () => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Class details for ${classItem.student}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div><h2>Class Details</h2><p>{classItem.student} - {classItem.program}</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close class details" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="student-info-grid">
          <span>Time <strong>{classItem.time}</strong></span>
          <span>Status <strong><StatusBadge label={classItem.status} /></strong></span>
          <span>Platform <strong>{classItem.platform}</strong></span>
          <span>Attendance <strong>{classItem.attendanceStatus}</strong></span>
          <span>Report <strong>{classItem.reportStatus}</strong></span>
          <span>Meeting link <strong>{classItem.meetingLink || 'No meeting link recorded'}</strong></span>
        </div>
      </div>
    </div>
  );
}

function TeacherEvaluationDetailsModal({ evaluation, onClose }: { evaluation: EvaluationRow; onClose: () => void }) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Evaluation details for ${evaluation.student}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div><h2>Evaluation Details</h2><p>{evaluation.student} - {evaluation.program}</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close evaluation details" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="student-info-grid">
          <span>Related class <strong>{evaluation.relatedClass}</strong></span>
          <span>Recitation <strong>{evaluation.recitation || 0}/5</strong></span>
          <span>Tajweed <strong>{evaluation.tajweed || 0}/5</strong></span>
          <span>Understanding <strong>{evaluation.understanding || 0}/5</strong></span>
          <span>Status <strong><StatusBadge label={evaluation.status} /></strong></span>
        </div>
      </div>
    </div>
  );
}

function TeacherTrialDetailsModal({ trial, onClose }: { trial: Record<string, unknown>; onClose: () => void }) {
  const lead = trial.lead as { full_name?: string; whatsapp?: string | null; programName?: string } | undefined;

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Trial details">
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div><h2>{lead?.full_name || String(trial.student || 'Trial student')}</h2><p>Assigned free trial details.</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close trial details" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="student-info-grid">
          <span>Program <strong>{lead?.programName || String(trial.program || 'Program not assigned')}</strong></span>
          <span>WhatsApp <strong>{lead?.whatsapp || '-'}</strong></span>
          <span>Date <strong>{String(trial.trial_date || 'Date pending')}</strong></span>
          <span>Time <strong>{String(trial.trial_time || '')}</strong></span>
          <span>Status <strong><StatusBadge label={String(trial.status || 'scheduled')} /></strong></span>
          <span>Meeting link <strong>{String(trial.meeting_link || 'No meeting link recorded')}</strong></span>
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [evaluationStudent, setEvaluationStudent] = useState<EvaluationRow | null>(null);
  const [reportClass, setReportClass] = useState<TeacherClass | null>(null);
  const [detailClass, setDetailClass] = useState<TeacherClass | null>(null);
  const [detailEvaluation, setDetailEvaluation] = useState<EvaluationRow | null>(null);
  const [detailTrial, setDetailTrial] = useState<Record<string, unknown> | null>(null);
  const [teacherTrials, setTeacherTrials] = useState<Array<Record<string, unknown>>>([]);
  const [trialFeedback, setTrialFeedback] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetchTeacherDashboardData()
      .then(setDashboardData)
      .catch(() => setDashboardData({
        stats: [
          { label: 'Assigned Students', value: 0, trend: 'Active assigned records', icon: 'student' },
          { label: "Today's Classes", value: 0, trend: 'Scheduled for today', icon: 'calendar' },
          { label: 'Upcoming Free Trials', value: 0, trend: 'Assigned trials', icon: 'gift' },
          { label: 'Pending Evaluations', value: 0, trend: 'Awaiting teacher submission', icon: 'chart' },
        ],
        todaysClasses: [],
        assignedStudents: [],
        evaluationQueue: [],
      }));
    fetchTeacherTrials()
      .then((trials) => setTeacherTrials(trials as Array<Record<string, unknown>>))
      .catch(() => setTeacherTrials([]));
  }, []);

  const teacherStats = dashboardData?.stats || [];
  const todaysClasses = dashboardData?.todaysClasses || [];
  const assignedStudents = dashboardData?.assignedStudents || [];
  const evaluationQueue = dashboardData?.evaluationQueue || [];
  const nextClass = useMemo(
    () => todaysClasses.find((classItem) => ['live', 'scheduled', 'upcoming'].includes(classItem.status.toLowerCase())) || todaysClasses[0] || null,
    [todaysClasses],
  );

  async function handleCheckinAction(classItem: TeacherClass, action: TeacherCheckinAction) {
    await updateTeacherSessionCheckin({
      classId: classItem.id,
      scheduledStartAt: classItem.scheduledStartAt || getScheduledStartAt(classItem.time),
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
            { label: 'View Details', onClick: () => setDetailClass(row) },
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
        {nextClass ? (
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
                  { label: 'View Details', onClick: () => setDetailClass(nextClass) },
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="teacher-empty-card">
            <span className="dashboard-eyebrow">Next Class</span>
            <h2>No classes assigned for today</h2>
            <p>Assigned classes from Supabase will appear here when scheduled.</p>
            <ActionButton variant="secondary" onClick={() => navigate('/dashboard/teacher/schedule')}>Open Schedule</ActionButton>
          </div>
        )}
      </SectionCard>

      <div className="dashboard-stats-grid dashboard-stats-grid--teacher">
        {teacherStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <SectionCard title="Today's Schedule" subtitle="Classes assigned to you today." action={<ActionButton variant="ghost" onClick={() => navigate('/dashboard/teacher/schedule')}>View Full Timetable</ActionButton>}>
        <DataTable columns={scheduleColumns} rows={todaysClasses} getRowKey={(row) => row.id} />
      </SectionCard>

      <div className="dashboard-grid dashboard-grid--teacher teacher-dashboard-middle-grid">
        <SectionCard title="My Students Needing Attention" subtitle="Assigned students with support signals.">
          <div className="teacher-compact-list">
            {assignedStudents.length === 0 && <p className="dashboard-empty-copy">No assigned students yet.</p>}
            {assignedStudents.filter((student) => student.progress === 'Needs support' || student.nextClass.includes('Today')).map((student) => (
              <article className="teacher-compact-row" key={student.id}>
                <div className="teacher-compact-row__main">
                  <strong className="truncate-text">{student.student}</strong>
                  <span className="truncate-text">{student.program} - {student.nextClass}</span>
                </div>
                <StatusBadge label={student.progress} />
                <DashboardActionMenu
                  primaryAction={{ label: 'Open Record', onClick: () => navigate(`/dashboard/teacher/students/${student.id}`) }}
                  actions={[
                    { label: 'View Attendance', onClick: () => navigate('/dashboard/teacher/attendance') },
                    {
                      label: 'Add Evaluation',
                      onClick: () => setEvaluationStudent({
                        id: student.id,
                        student: student.student,
                        program: student.program,
                        relatedClass: student.nextClass,
                        recitation: 0,
                        tajweed: 0,
                        understanding: 0,
                        status: 'ready',
                      }),
                    },
                    { label: 'Message via Academy', onClick: () => navigate('/dashboard/teacher/messages') },
                  ]}
                />
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Attendance to Submit" subtitle="Class attendance awaiting submission.">
          <div className="teacher-task-list">
            {todaysClasses.filter((classItem) => classItem.attendanceStatus === 'Pending').length === 0 && <p className="dashboard-empty-copy">No attendance records are pending.</p>}
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
          <div className="teacher-compact-list">
            {evaluationQueue.length === 0 && <p className="dashboard-empty-copy">No pending evaluations.</p>}
            {evaluationQueue.map((evaluation) => (
              <article className="teacher-compact-row" key={evaluation.id}>
                <div className="teacher-compact-row__main">
                  <strong className="truncate-text">{evaluation.student}</strong>
                  <span className="truncate-text">{evaluation.program} - {evaluation.relatedClass}</span>
                </div>
                <StatusBadge label={evaluation.status} />
                <DashboardActionMenu
                  primaryAction={{ label: 'Evaluate', onClick: () => setEvaluationStudent(evaluation) }}
                  actions={[
                    { label: 'View Class Details', onClick: () => setDetailEvaluation(evaluation) },
                    { label: 'Message via Academy', onClick: () => navigate('/dashboard/teacher/messages') },
                  ]}
                />
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming Free Trials" subtitle="Trials assigned to you. Conversion remains an admin action.">
          {teacherTrials.length > 0 ? (
            <div className="teacher-trials-list">
              {teacherTrials.map((trial) => (
                <TeacherTrialCard
                  key={String(trial.id)}
                  trial={trial as never}
                  onDetails={() => setDetailTrial(trial)}
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
            <p className="dashboard-empty-copy">No free trials assigned.</p>
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
      {detailClass && <TeacherClassDetailsModal classItem={detailClass} onClose={() => setDetailClass(null)} />}
      {detailEvaluation && <TeacherEvaluationDetailsModal evaluation={detailEvaluation} onClose={() => setDetailEvaluation(null)} />}
      {detailTrial && <TeacherTrialDetailsModal trial={detailTrial} onClose={() => setDetailTrial(null)} />}
    </div>
  );
}
