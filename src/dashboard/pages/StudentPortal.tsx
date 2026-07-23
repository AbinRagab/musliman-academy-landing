import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import CalendarMiniCard from '../components/CalendarMiniCard';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { studentProfile, studentTimetable } from '../data/mockData';

type TimetableRow = (typeof studentTimetable)[number];

const timetableColumns: Array<DataTableColumn<TimetableRow>> = [
  { header: 'Time', accessor: 'time' },
  { header: 'Class', accessor: 'className' },
  { header: 'Teacher', accessor: 'teacher' },
  { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
  { header: 'Join', accessor: () => <ActionButton variant="ghost">Join</ActionButton> },
];

const quickLinks = [
  { label: 'Upload Homework', icon: 'document' },
  { label: 'Download Materials', icon: 'book' },
  { label: 'Dua & Azkar', icon: 'sparkles' },
  { label: 'Quran Library', icon: 'quran' },
];

export default function StudentPortal() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">Student Learning Space</span>
          <h1>Student Portal</h1>
          <p>Follow classes, homework, attendance, progress, and learning resources.</p>
        </div>
      </div>

      <div className="dashboard-greeting-card">
        <div>
          <span>Assalamu Alaikum, {studentProfile.name}</span>
          <h2>Your next Quran class is ready</h2>
          <p>Keep your materials nearby and join a few minutes early for recitation review.</p>
        </div>
        <ActionButton>
          <Icon name="video" size={18} />
          Join Class
        </ActionButton>
      </div>

      <div className="dashboard-grid dashboard-grid--three">
        <SectionCard title="Upcoming Class">
          <div className="dashboard-class-card">
            <CalendarMiniCard month="Jul" day="24" label="05:00 PM" />
            <div>
              <h3>Quran Reading Level 3</h3>
              <p>Teacher: {studentProfile.teacher}</p>
              <ActionButton variant="secondary">Join Class</ActionButton>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Free Trial Status">
          <div className="dashboard-status-large">
            <StatusBadge label="Completed" />
            <p>Placement completed. Full course enrollment is active.</p>
          </div>
        </SectionCard>
        <SectionCard title="Teacher">
          <div className="dashboard-teacher-card">
            <div className="dashboard-avatar">MA</div>
            <div>
              <h3>{studentProfile.teacher}</h3>
              <p>Quran Reading and Tajweed</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-stats-grid">
        <StatCard label="Total Classes" value={studentProfile.totalClasses} trend="Since enrollment" icon="calendar" />
        <StatCard label="Attendance Rate" value={studentProfile.attendanceRate} trend="Excellent consistency" icon="clipboard" />
        <StatCard label="Completed Lessons" value={studentProfile.completedLessons} trend="11 lessons remaining" icon="book" />
        <StatCard label="Current Course" value="Level 3" trend={studentProfile.currentCourse} icon="quran" />
      </div>

      <div className="dashboard-grid dashboard-grid--student">
        <SectionCard title="Weekly Timetable" subtitle="Mock class schedule for this week">
          <DataTable columns={timetableColumns} rows={studentTimetable} getRowKey={(row) => `${row.time}-${row.className}`} />
        </SectionCard>

        <SectionCard title="Course Progress">
          <div className="dashboard-progress-summary">
            <div className="dashboard-progress-ring" style={{ '--progress': '74%' } as React.CSSProperties}>
              <span>74%</span>
            </div>
            <ProgressBar value={74} label="Quran Reading Level 3" />
            <div className="dashboard-progress-facts">
              <span>31 lessons completed</span>
              <span>2 Juz completed</span>
              <span>48 stars earned</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Quick Links">
        <div className="dashboard-quick-links">
          {quickLinks.map((link) => (
            <button type="button" key={link.label}>
              <Icon name={link.icon} />
              <span>{link.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
