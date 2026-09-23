import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import TeacherLinkingDebugPanel from '../components/TeacherLinkingDebugPanel';
import TeacherTrialCard from '../components/TeacherTrialCard';
import TrialFeedbackModal from '../components/TrialFeedbackModal';
import Toast, { type ToastMessage } from '../components/Toast';
import { updateTeacherSessionCheckin, type TeacherCheckinAction } from '../services/teacherCheckinService';
import { submitTrialFeedback, updateTrialStatus, fetchTeacherTrials } from '../services/trialsService';
import { saveTeacherClassReport, saveTeacherEvaluation } from '../services/teacherOperationsService';
import { getAcademyTodayDate } from '../services/dateUtils';
import {
  fetchTeacherDashboardData,
  type TeacherDashboardClass as TeacherClass,
  type TeacherDashboardData,
  type TeacherDashboardEvaluation as EvaluationRow,
} from '../services/teacherDashboardService';
import { DashboardText, useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

function getScheduledStartAt(time: string) {
  const normalized = time.replace(/^Today\s+/i, '').trim();
  const today = new Date();
  const parsed = new Date(`${today.toDateString()} ${normalized}`);
  return Number.isNaN(parsed.getTime()) ? today.toISOString() : parsed.toISOString();
}

function EvaluationModal({ evaluation, onClose, onSubmit }: { evaluation: EvaluationRow; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  const { t } = useDashboardLanguage();

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
        <form className="dashboard-form" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>
          <div className="teacher-form-grid">
            <label><span><DashboardText>Reading accuracy</DashboardText></span><input name="recitationRating" type="range" min="1" max="5" defaultValue="4" /></label>
            <label><span><DashboardText>Tajweed</DashboardText></span><input name="tajweedRating" type="range" min="1" max="5" defaultValue="4" /></label>
            <label><span><DashboardText>Understanding</DashboardText></span><input name="understandingRating" type="range" min="1" max="5" defaultValue="4" /></label>
            <label><span><DashboardText>Behavior</DashboardText></span><input name="behaviorRating" type="range" min="1" max="5" defaultValue="4" /></label>
            <label>
              <span><DashboardText>Evaluation date</DashboardText></span>
              <input type="date" defaultValue={getAcademyTodayDate()} readOnly />
            </label>
            <label className="teacher-form-grid__wide">
              <span><DashboardText>Strengths / progress notes</DashboardText></span>
              <textarea name="progressNotes" rows={3} placeholder={t('Record strengths from recent classes.')} />
            </label>
            <label className="teacher-form-grid__wide">
              <span><DashboardText>Teacher recommendation</DashboardText></span>
              <textarea name="recommendation" rows={3} placeholder={t('Recommend next focus, level change, or admin review.')} />
            </label>
          </div>
          <div className="dashboard-form-actions">
            <ActionButton variant="secondary" disabled><DashboardText>Draft saving unavailable</DashboardText></ActionButton>
            <ActionButton type="submit" variant="copper"><DashboardText>Submit Evaluation</DashboardText></ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClassReportModal({ classItem, onClose, onSubmit }: { classItem: TeacherClass; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  const { t } = useDashboardLanguage();

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Class report for ${classItem.student}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div>
            <h2><DashboardText>Add Class Report</DashboardText></h2>
            <p>{classItem.student} - {classItem.program}</p>
          </div>
          <button type="button" className="dashboard-icon-button" aria-label="Close report" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <form className="dashboard-form" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }}>
          <label><span><DashboardText>Lesson covered</DashboardText></span><input name="lessonCovered" placeholder={t('Example: Madd letters review')} required /></label>
          <label><span><DashboardText>Homework assigned</DashboardText></span><textarea name="homework" rows={3} placeholder={t('Describe homework for the next session.')} /></label>
          <label><span><DashboardText>Class notes</DashboardText></span><textarea name="notes" rows={4} placeholder={t('Summarize class outcome and support needs.')} /></label>
          <label><span><DashboardText>Next lesson plan</DashboardText></span><textarea name="nextLessonPlan" rows={3} placeholder={t('Define the next teaching plan.')} /></label>
          <div className="dashboard-form-actions">
            <ActionButton type="submit" variant="copper"><DashboardText>Save Class Report</DashboardText></ActionButton>
            <ActionButton variant="secondary" onClick={onClose}><DashboardText>Cancel</DashboardText></ActionButton>
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
          <div><h2><DashboardText>Class Details</DashboardText></h2><p>{classItem.student} - {classItem.program}</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close class details" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="student-info-grid">
          <span><DashboardText>Time</DashboardText> <strong>{classItem.time}</strong></span>
          <span><DashboardText>Status</DashboardText> <strong><StatusBadge label={classItem.status} /></strong></span>
          <span><DashboardText>Platform</DashboardText> <strong>{classItem.platform}</strong></span>
          <span><DashboardText>Attendance</DashboardText> <strong>{classItem.attendanceStatus}</strong></span>
          <span><DashboardText>Report</DashboardText> <strong>{classItem.reportStatus}</strong></span>
          <span><DashboardText>Meeting link</DashboardText> <strong>{classItem.meetingLink || 'No meeting link recorded'}</strong></span>
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
          <div><h2><DashboardText>Evaluation Details</DashboardText></h2><p>{evaluation.student} - {evaluation.program}</p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close evaluation details" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="student-info-grid">
          <span><DashboardText>Related class</DashboardText> <strong>{evaluation.relatedClass}</strong></span>
          <span><DashboardText>Recitation</DashboardText> <strong>{evaluation.recitation || 0}/5</strong></span>
          <span><DashboardText>Tajweed</DashboardText> <strong>{evaluation.tajweed || 0}/5</strong></span>
          <span><DashboardText>Understanding</DashboardText> <strong>{evaluation.understanding || 0}/5</strong></span>
          <span><DashboardText>Status</DashboardText> <strong><StatusBadge label={evaluation.status} /></strong></span>
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
          <div><h2>{lead?.full_name || String(trial.student || 'Trial student')}</h2><p><DashboardText>Assigned free trial details.</DashboardText></p></div>
          <button type="button" className="dashboard-icon-button" aria-label="Close trial details" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="student-info-grid">
          <span><DashboardText>Program</DashboardText> <strong>{lead?.programName || String(trial.program || 'Program not assigned')}</strong></span>
          <span><DashboardText>WhatsApp</DashboardText> <strong>{lead?.whatsapp || '-'}</strong></span>
          <span><DashboardText>Date</DashboardText> <strong>{String(trial.trial_date || 'Date pending')}</strong></span>
          <span><DashboardText>Time</DashboardText> <strong>{String(trial.trial_time || '')}</strong></span>
          <span><DashboardText>Status</DashboardText> <strong><StatusBadge label={String(trial.status || 'scheduled')} /></strong></span>
          <span><DashboardText>Meeting link</DashboardText> <strong>{String(trial.meeting_link || 'No meeting link recorded')}</strong></span>
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
        contextError: null,
        todaysClasses: [],
        assignedStudents: [],
        evaluationQueue: [],
      }));
    fetchTeacherTrials()
      .then((trials) => setTeacherTrials(trials as Array<Record<string, unknown>>))
      .catch(() => setTeacherTrials([]));
  }, []);

  const teacherStats = dashboardData?.stats || [];
  const contextError = dashboardData?.contextError || null;
  const todaysClasses = dashboardData?.todaysClasses || [];
  const assignedStudents = dashboardData?.assignedStudents || [];
  const evaluationQueue = dashboardData?.evaluationQueue || [];
  const nextClass = useMemo(
    () => todaysClasses.find((classItem) => ['live', 'scheduled', 'upcoming'].includes(classItem.status.toLowerCase())) || todaysClasses[0] || null,
    [todaysClasses],
  );

  async function handleCheckinAction(classItem: TeacherClass, action: TeacherCheckinAction) {
    if (classItem.id.startsWith('schedule:')) {
      setToast({ type: 'info', message: 'This is a weekly schedule row. Attendance opens after a class record is created.' });
      return;
    }

    try {
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
      await refreshTeacherDashboard();
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : `Unable to update class ${action} state.` });
    }
  }

  async function handleJoinClass(classItem: TeacherClass) {
    if (!classItem.id.startsWith('schedule:')) {
      await handleCheckinAction(classItem, 'joined');
    }

    if (classItem.meetingLink) {
      window.open(classItem.meetingLink, '_blank', 'noopener,noreferrer');
      return;
    }

    setToast({ type: 'info', message: 'Meeting link is not available. Please contact the academy team.' });
  }

  async function refreshTeacherDashboard() {
    const data = await fetchTeacherDashboardData();
    setDashboardData(data);
  }

  async function handleClassReportSubmit(classItem: TeacherClass, formData: FormData) {
    if (classItem.id.startsWith('schedule:')) {
      setToast({ type: 'info', message: 'Create or complete a class record before submitting a class report.' });
      return;
    }

    try {
      await saveTeacherClassReport({
        classId: classItem.id,
        lessonCovered: String(formData.get('lessonCovered') || ''),
        homework: String(formData.get('homework') || ''),
        nextLessonPlan: String(formData.get('nextLessonPlan') || ''),
        notes: String(formData.get('notes') || ''),
      });
      setReportClass(null);
      setToast({ type: 'success', message: 'Class report saved.' });
      await refreshTeacherDashboard();
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Unable to save class report.' });
    }
  }

  async function handleEvaluationSubmit(evaluation: EvaluationRow, formData: FormData) {
    if (!evaluation.studentId) {
      setToast({ type: 'error', message: 'This evaluation is missing a student record.' });
      return;
    }
    if (!evaluation.classId) {
      setToast({ type: 'error', message: 'This evaluation is missing a class record.' });
      return;
    }

    try {
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
      setEvaluationStudent(null);
      setToast({ type: 'success', message: 'Evaluation submitted.' });
      await refreshTeacherDashboard();
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Unable to submit evaluation.' });
    }
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
            { label: 'Start Class', onClick: () => handleCheckinAction(row, 'live'), hidden: !['scheduled', 'rescheduled'].includes(row.status.toLowerCase()) },
            { label: 'End Class', onClick: () => handleCheckinAction(row, 'completed'), hidden: row.status.toLowerCase() !== 'live' },
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
          <span className="dashboard-eyebrow"><DashboardText>Teacher Workspace</DashboardText></span>
          <h1><DashboardText>Teacher Dashboard</DashboardText></h1>
          <p><DashboardText>Daily view for classes, assigned students, attendance, evaluations, trials, and academy messages.</DashboardText></p>
        </div>
        <ActionButton onClick={() => navigate('/dashboard/teacher/schedule')}>
          <Icon name="calendar" size={18} />
          <DashboardText>Open Schedule</DashboardText>
        </ActionButton>
      </div>

      <TeacherLinkingDebugPanel route="/dashboard/teacher" />

      <SectionCard className="teacher-next-class-card">
        {contextError ? (
          <div className="teacher-empty-card">
            <span className="dashboard-eyebrow"><DashboardText>Teacher Account</DashboardText></span>
            <h2><DashboardText>Teacher profile is not connected</DashboardText></h2>
            <p><DashboardText>Please contact admin so this login can be linked to an operational teacher record.</DashboardText></p>
          </div>
        ) : nextClass ? (
          <div className="teacher-next-class">
            <div>
              <span className="dashboard-eyebrow"><DashboardText>Next Class</DashboardText></span>
              <h2>{nextClass.student}</h2>
              <p>{nextClass.program} - {nextClass.time}</p>
            </div>
            <div className="teacher-next-class__details">
              <span><strong><DashboardText>Status</DashboardText></strong><StatusBadge label={nextClass.status} /></span>
              <span><strong><DashboardText>Meeting platform</DashboardText></strong>{nextClass.platform}</span>
              <span><strong><DashboardText>Attendance</DashboardText></strong>{nextClass.attendanceStatus}</span>
            </div>
            <div className="teacher-action-row">
              <DashboardActionMenu
                primaryAction={{ label: 'Join Class', icon: <Icon name="video" size={16} />, onClick: () => handleJoinClass(nextClass) }}
                actions={[
                  { label: 'I am Ready', onClick: () => handleCheckinAction(nextClass, 'ready') },
                  { label: 'Start Class', onClick: () => handleCheckinAction(nextClass, 'live'), hidden: !['scheduled', 'rescheduled'].includes(nextClass.status.toLowerCase()) },
                  { label: 'End Class', onClick: () => handleCheckinAction(nextClass, 'completed'), hidden: nextClass.status.toLowerCase() !== 'live' },
                  { label: 'Mark Attendance', onClick: () => navigate('/dashboard/teacher/attendance') },
                  { label: 'Add Class Report', onClick: () => setReportClass(nextClass) },
                  { label: 'View Details', onClick: () => setDetailClass(nextClass) },
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="teacher-empty-card">
            <span className="dashboard-eyebrow"><DashboardText>Next Class</DashboardText></span>
            <h2><DashboardText>No classes assigned for today</DashboardText></h2>
            <p><DashboardText>Assigned classes from Supabase will appear here when scheduled.</DashboardText></p>
            <ActionButton variant="secondary" onClick={() => navigate('/dashboard/teacher/schedule')}><DashboardText>Open Schedule</DashboardText></ActionButton>
          </div>
        )}
      </SectionCard>

      <div className="dashboard-stats-grid dashboard-stats-grid--teacher">
        {teacherStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <SectionCard title="Today's Schedule" subtitle="Classes assigned to you today." action={<ActionButton variant="ghost" onClick={() => navigate('/dashboard/teacher/schedule')}><DashboardText>View Full Timetable</DashboardText></ActionButton>}>
        <DataTable columns={scheduleColumns} rows={todaysClasses} getRowKey={(row) => row.id} />
      </SectionCard>

      <div className="dashboard-grid dashboard-grid--teacher teacher-dashboard-middle-grid">
        <SectionCard title="My Students Needing Attention" subtitle="Assigned students with support signals.">
          <div className="teacher-compact-list">
            {assignedStudents.length === 0 && <p className="dashboard-empty-copy"><DashboardText>No assigned students yet.</DashboardText></p>}
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
                      onClick: () => {
                        const eligibleEvaluation = evaluationQueue.find((evaluation) => evaluation.studentId === student.id);
                        if (!eligibleEvaluation) {
                          setToast({ type: 'info', message: 'No completed unevaluated class is available for this student.' });
                          return;
                        }
                        setEvaluationStudent(eligibleEvaluation);
                      },
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
            {todaysClasses.filter((classItem) => classItem.attendanceStatus === 'Pending').length === 0 && <p className="dashboard-empty-copy"><DashboardText>No attendance records are pending.</DashboardText></p>}
            {todaysClasses.filter((classItem) => classItem.attendanceStatus === 'Pending').map((classItem) => (
              <article key={classItem.id}>
                <div>
                  <strong>{classItem.student}</strong>
                  <span>{classItem.program} - {classItem.time}</span>
                </div>
                <ActionButton variant="ghost" onClick={() => navigate('/dashboard/teacher/attendance')}><DashboardText>Mark Attendance</DashboardText></ActionButton>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Pending Evaluations" subtitle="Academic evaluations ready for teacher input.">
          <div className="teacher-compact-list">
            {evaluationQueue.length === 0 && <p className="dashboard-empty-copy"><DashboardText>No pending evaluations.</DashboardText></p>}
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
            <p className="dashboard-empty-copy"><DashboardText>No free trials assigned.</DashboardText></p>
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

      {evaluationStudent && <EvaluationModal evaluation={evaluationStudent} onClose={() => setEvaluationStudent(null)} onSubmit={(formData) => handleEvaluationSubmit(evaluationStudent, formData)} />}
      {reportClass && <ClassReportModal classItem={reportClass} onClose={() => setReportClass(null)} onSubmit={(formData) => handleClassReportSubmit(reportClass, formData)} />}
      {detailClass && <TeacherClassDetailsModal classItem={detailClass} onClose={() => setDetailClass(null)} />}
      {detailEvaluation && <TeacherEvaluationDetailsModal evaluation={detailEvaluation} onClose={() => setDetailEvaluation(null)} />}
      {detailTrial && <TeacherTrialDetailsModal trial={detailTrial} onClose={() => setDetailTrial(null)} />}
    </div>
  );
}
