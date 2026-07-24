import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import EvaluationCard from '../components/EvaluationCard';
import FilterBar from '../components/FilterBar';
import ProfilePanel from '../components/ProfilePanel';
import ScheduleCard from '../components/ScheduleCard';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  attendanceStudents,
  freeTrials,
  studentEvaluations,
  teacherPerformance,
  teacherSchedule,
  teacherStats,
  teacherStudents,
} from '../data/mockData';

type TeacherSection =
  | 'students'
  | 'free-trials'
  | 'classes'
  | 'attendance'
  | 'evaluations'
  | 'reports'
  | 'messages'
  | 'profile'
  | 'settings';

type GenericRow = Record<string, string | number>;

function filterRows(rows: GenericRow[], search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return rows;
  }

  return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query)));
}

function TeacherTable({ rows, columns }: { rows: GenericRow[]; columns: Array<DataTableColumn<GenericRow>> }) {
  const [search, setSearch] = useState('');
  const filteredRows = useMemo(() => filterRows(rows, search), [rows, search]);

  return (
    <>
      <FilterBar search={search} onSearchChange={setSearch}>
        <label>
          <span>View</span>
          <select defaultValue="all">
            <option value="all">All records</option>
            <option value="today">Today</option>
            <option value="pending">Pending</option>
          </select>
        </label>
      </FilterBar>
      {filteredRows.length > 0 ? (
        <DataTable columns={columns} rows={filteredRows} getRowKey={(row, index) => `${Object.values(row)[0]}-${index}`} />
      ) : (
        <EmptyState title="No teacher records found" description="Adjust your filters or check back after assignments are updated." />
      )}
    </>
  );
}

const studentRows = teacherStudents.map((student) => ({
  id: `mock-${student.student.toLowerCase().replace(/\s+/g, '-')}`,
  student: student.student,
  program: student.level.includes('Tajweed') ? 'Tajweed' : 'Quran Reading',
  level: student.level,
  parentContact: '+20 100 000 0000',
  nextClass: student.nextClass,
  attendance: student.attendance,
  progress: student.attendance === '88%' ? 'Needs support' : 'On track',
}));

const trialRows = freeTrials.map((trial) => ({
  lead: trial.student,
  program: trial.program,
  dateTime: trial.dateTime,
  status: 'scheduled',
  whatsapp: '+20 100 000 0000',
}));

const scheduleItems = teacherSchedule.map((item) => ({
  time: item.time,
  title: item.student,
  meta: `${item.program} - ${item.status}`,
  status: item.status,
  platform: 'Zoom classroom',
}));

export default function TeacherSectionPage({ section }: { section: TeacherSection }) {
  const titleBySection: Record<TeacherSection, string> = {
    students: 'My Students',
    'free-trials': 'Assigned Free Trials',
    classes: 'My Classes',
    attendance: 'Attendance',
    evaluations: 'Student Evaluations',
    reports: 'Performance Summary',
    messages: 'Messages',
    profile: 'Teacher Profile',
    settings: 'Teacher Settings',
  };

  const subtitleBySection: Record<TeacherSection, string> = {
    students: 'View assigned learners, parent contacts, attendance rate, and progress.',
    'free-trials': 'Prepare for assigned trial classes and follow up with families.',
    classes: 'Review today and upcoming sessions with platform details.',
    attendance: 'Mark present, absent, late, and add class notes.',
    evaluations: 'Submit Tajweed, participation, homework, behavior, and recommendation feedback.',
    reports: 'Review completion, attendance, and student progress trends.',
    messages: 'Manage parent and academy communication threads.',
    profile: 'Review teaching profile, specialization, availability, and current load.',
    settings: 'Manage teacher-facing preferences and notification settings.',
  };

  const commonHeader = (
    <DashboardPageHeader
      eyebrow="TEACHER PORTAL"
      title={titleBySection[section]}
      subtitle={subtitleBySection[section]}
      action={(
        <ActionButton variant="secondary">
          <Icon name="calendar" size={18} />
          Open Schedule
        </ActionButton>
      )}
    />
  );

  if (section === 'classes') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {commonHeader}
        <div className="dashboard-stats-grid">
          {teacherStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>
        <SectionCard title="Today and Upcoming Schedule">
          <ScheduleCard items={scheduleItems} />
        </SectionCard>
      </div>
    );
  }

  if (section === 'attendance') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {commonHeader}
        <div className="dashboard-grid dashboard-grid--two">
          <SectionCard title="Mark Attendance">
            <div className="dashboard-attendance-list">
              {attendanceStudents.map((student) => (
                <div className="dashboard-attendance-row dashboard-attendance-row--expanded" key={student}>
                  <span>{student}</span>
                  <label><input type="radio" name={`teacher-attendance-${student}`} defaultChecked /> Present</label>
                  <label><input type="radio" name={`teacher-attendance-${student}`} /> Absent</label>
                  <label><input type="radio" name={`teacher-attendance-${student}`} /> Late</label>
                  <input placeholder="Attendance note" />
                </div>
              ))}
            </div>
            <ActionButton variant="copper">Save Attendance</ActionButton>
          </SectionCard>
          <SectionCard title="Completion Health">
            <div className="dashboard-insight-list">
              {teacherPerformance.map((item) => <EvaluationCard key={item.label} title={item.label} score={item.value} note="Updated from current mock schedule." />)}
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (section === 'evaluations') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {commonHeader}
        <SectionCard title="Evaluation Queue" subtitle="Mock data ready for teacher evaluation submission wiring">
          <TeacherTable
            rows={studentEvaluations.map((item) => ({
              student: item.student,
              tajweed: `${item.tajweed}/5`,
              reading: `${item.recitation}/5`,
              participation: `${item.understanding}/5`,
              homework: 'Good',
              behavior: 'Excellent',
              status: item.status,
            }))}
            columns={[
              { header: 'Student', accessor: 'student' },
              { header: 'Tajweed', accessor: 'tajweed' },
              { header: 'Reading', accessor: 'reading' },
              { header: 'Participation', accessor: 'participation' },
              { header: 'Homework', accessor: 'homework' },
              { header: 'Behavior', accessor: 'behavior' },
              { header: 'Status', accessor: (row) => <StatusBadge label={String(row.status)} /> },
              { header: 'Action', accessor: () => <ActionButton variant="ghost">Evaluate</ActionButton> },
            ]}
          />
        </SectionCard>
      </div>
    );
  }

  if (section === 'profile' || section === 'settings' || section === 'reports' || section === 'messages') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {commonHeader}
        <div className="dashboard-grid dashboard-grid--two">
          <ProfilePanel
            name="Ust. Maryam Ali"
            subtitle="Quran Reading and Tajweed"
            role="teacher"
            status="active"
            items={[
              { label: 'Assigned students', value: '38' },
              { label: 'Today classes', value: '7' },
              { label: 'Availability', value: 'Weekday evenings' },
              { label: 'Average progress', value: '78%' },
            ]}
          />
          <SectionCard title={section === 'messages' ? 'Recent Messages' : 'Teacher Workspace'}>
            <div className="dashboard-insight-list">
              <EvaluationCard title="Attendance completion" score={92} note="Most classes are marked before end of day." />
              <EvaluationCard title="Student progress" score={78} note="Three students need additional revision support." />
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  const rows = section === 'free-trials' ? trialRows : studentRows;
  const columns: Array<DataTableColumn<GenericRow>> = section === 'free-trials'
    ? [
      { header: 'Lead / Student', accessor: 'lead' },
      { header: 'Program Interest', accessor: 'program' },
      { header: 'Trial Date/time', accessor: 'dateTime' },
      { header: 'Status', accessor: (row) => <StatusBadge label={String(row.status)} /> },
      { header: 'Parent WhatsApp', accessor: 'whatsapp' },
      { header: 'Action', accessor: () => <ActionButton variant="ghost">Contact</ActionButton> },
    ]
    : [
      { header: 'Student', accessor: 'student' },
      { header: 'Program', accessor: 'program' },
      { header: 'Level', accessor: 'level' },
      { header: 'Parent Contact', accessor: 'parentContact' },
      { header: 'Next Class', accessor: 'nextClass' },
      { header: 'Attendance Rate', accessor: 'attendance' },
      { header: 'Progress', accessor: 'progress' },
      {
        header: 'Action',
        accessor: (row) => (
          <Link className="dashboard-action dashboard-action--ghost" to={`/dashboard/teacher/students/${row.id || 'mock-yusuf'}`}>
            Open Record
          </Link>
        ),
      },
    ];

  return (
    <div className="dashboard-page dashboard-page--management">
      {commonHeader}
      <div className="dashboard-stats-grid">
        {teacherStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>
      <SectionCard title={titleBySection[section]} subtitle="Mock data aligned with teacher portal workflows">
        <TeacherTable rows={rows} columns={columns} />
      </SectionCard>
    </div>
  );
}
