import { useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  attendanceStudents,
  freeTrials,
  studentEvaluations,
  teacherSchedule,
  teacherStats,
  teacherStudents,
} from '../data/mockData';

type ScheduleRow = (typeof teacherSchedule)[number];
type StudentRow = (typeof teacherStudents)[number];
type EvaluationRow = (typeof studentEvaluations)[number];
type FreeTrialRow = (typeof freeTrials)[number];

function Stars({ count }: { count: number }) {
  return (
    <span className="dashboard-stars" aria-label={`${count} stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Icon key={index} name="star" size={15} className={index < count ? 'is-filled' : ''} />
      ))}
    </span>
  );
}

export default function TeacherDashboard() {
  const [evaluationStudent, setEvaluationStudent] = useState<EvaluationRow | null>(null);

  const scheduleColumns: Array<DataTableColumn<ScheduleRow>> = [
    { header: 'Time', accessor: 'time' },
    { header: 'Student', accessor: 'student' },
    { header: 'Program', accessor: 'program' },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    { header: 'Join', accessor: () => <ActionButton variant="ghost">Join</ActionButton> },
  ];

  const studentColumns: Array<DataTableColumn<StudentRow>> = [
    { header: 'Student', accessor: 'student' },
    { header: 'Level', accessor: 'level' },
    { header: 'Next Class', accessor: 'nextClass' },
    { header: 'Attendance', accessor: 'attendance' },
  ];

  const evaluationColumns: Array<DataTableColumn<EvaluationRow>> = [
    { header: 'Student', accessor: 'student' },
    { header: 'Recitation stars', accessor: (row) => <Stars count={row.recitation} /> },
    { header: 'Tajweed stars', accessor: (row) => <Stars count={row.tajweed} /> },
    { header: 'Understanding stars', accessor: (row) => <Stars count={row.understanding} /> },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
    { header: 'Action', accessor: (row) => <ActionButton variant="ghost" onClick={() => setEvaluationStudent(row)}>Evaluate</ActionButton> },
  ];

  const freeTrialColumns: Array<DataTableColumn<FreeTrialRow>> = [
    { header: 'Student', accessor: 'student' },
    { header: 'Program', accessor: 'program' },
    { header: 'Date/time', accessor: 'dateTime' },
    { header: 'Contact', accessor: () => <ActionButton variant="ghost">Contact</ActionButton> },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">Teacher Workspace</span>
          <h1>Teacher Dashboard</h1>
          <p>Welcome back. Review today&apos;s classes, attendance, evaluations, and free trials.</p>
        </div>
        <ActionButton>
          <Icon name="calendar" size={18} />
          Open Schedule
        </ActionButton>
      </div>

      <div className="dashboard-stats-grid">
        {teacherStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <SectionCard title="Today's Schedule" subtitle="Live mock teaching schedule">
        <DataTable columns={scheduleColumns} rows={teacherSchedule} getRowKey={(row) => `${row.time}-${row.student}`} />
      </SectionCard>

      <div className="dashboard-grid dashboard-grid--teacher">
        <SectionCard title="My Students">
          <DataTable columns={studentColumns} rows={teacherStudents} getRowKey={(row) => row.student} />
        </SectionCard>

        <SectionCard title="Mark Attendance">
          <div className="dashboard-attendance-list">
            {attendanceStudents.map((student) => (
              <div className="dashboard-attendance-row" key={student}>
                <span>{student}</span>
                <label>
                  <input type="radio" name={`attendance-${student}`} defaultChecked />
                  Present
                </label>
                <label>
                  <input type="radio" name={`attendance-${student}`} />
                  Absent
                </label>
              </div>
            ))}
          </div>
          <ActionButton>Save Attendance</ActionButton>
        </SectionCard>
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Student Evaluations" subtitle="Ratings are mock values for UI review">
          <DataTable columns={evaluationColumns} rows={studentEvaluations} getRowKey={(row) => row.student} />
        </SectionCard>

        <SectionCard title="Upcoming Free Trials">
          <DataTable columns={freeTrialColumns} rows={freeTrials} getRowKey={(row) => row.student} />
        </SectionCard>
      </div>

      {evaluationStudent && (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Evaluate ${evaluationStudent.student}`}>
          <div className="dashboard-modal__panel">
            <div className="dashboard-card__header">
              <div>
                <h2>{evaluationStudent.student}</h2>
                <p>Student evaluation</p>
              </div>
              <button type="button" className="dashboard-icon-button" aria-label="Close evaluation" onClick={() => setEvaluationStudent(null)}>
                <Icon name="x" />
              </button>
            </div>
            <form className="dashboard-form">
              <label>
                <span>Recitation rating</span>
                <input type="range" min="1" max="5" defaultValue={evaluationStudent.recitation} />
              </label>
              <label>
                <span>Tajweed rating</span>
                <input type="range" min="1" max="5" defaultValue={evaluationStudent.tajweed} />
              </label>
              <label>
                <span>Understanding rating</span>
                <input type="range" min="1" max="5" defaultValue={evaluationStudent.understanding} />
              </label>
              <label>
                <span>Progress feedback</span>
                <textarea rows={4} placeholder="Summarize recitation progress and next lesson focus." />
              </label>
              <label>
                <span>Teacher notes</span>
                <textarea rows={3} placeholder="Private teacher notes for follow-up." />
              </label>
              <div className="dashboard-form-actions">
                <ActionButton type="button" onClick={() => setEvaluationStudent(null)}>Save Evaluation</ActionButton>
                <ActionButton type="button" variant="secondary" onClick={() => setEvaluationStudent(null)}>Cancel</ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
