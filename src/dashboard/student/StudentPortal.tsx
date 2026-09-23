import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import CalendarMiniCard from '../components/CalendarMiniCard';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { DashboardText } from '../i18n/DashboardLanguageProvider';

const studentProfile = {
  name: 'Student',
  teacher: 'No teacher assigned',
  totalClasses: 0,
  attendanceRate: '0%',
  completedLessons: 0,
  currentCourse: 'No course assigned',
};
const studentTimetable: Array<{ time: string; className: string; teacher: string; status: string }> = [];

type TimetableRow = (typeof studentTimetable)[number];

const timetableColumns: Array<DataTableColumn<TimetableRow>> = [
  { header: 'Time', accessor: 'time' },
  { header: 'Class', accessor: 'className' },
  { header: 'Teacher', accessor: 'teacher' },
  { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
  { header: 'Join', accessor: () => <ActionButton variant="ghost"><DashboardText>Join</DashboardText></ActionButton> },
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
          <span className="dashboard-eyebrow"><DashboardText>Student Learning Space</DashboardText></span>
          <h1><DashboardText>Student Portal</DashboardText></h1>
          <p><DashboardText>Follow classes, homework, attendance, progress, and learning resources.</DashboardText></p>
        </div>
      </div>

      <div className="dashboard-greeting-card">
        <div>
          <span><DashboardText>Assalamu Alaikum,</DashboardText> {studentProfile.name}</span>
          <h2><DashboardText>Your next Quran class is ready</DashboardText></h2>
          <p><DashboardText>Keep your materials nearby and join a few minutes early for recitation review.</DashboardText></p>
        </div>
        <ActionButton>
          <Icon name="video" size={18} />
          <DashboardText>Join Class</DashboardText>
        </ActionButton>
      </div>

      <div className="dashboard-grid dashboard-grid--three">
        <SectionCard title="Upcoming Class">
          <div className="dashboard-class-card">
            <CalendarMiniCard month="Jul" day="24" label="05:00 PM" />
            <div>
              <h3><DashboardText>Quran Reading Level 3</DashboardText></h3>
              <p><DashboardText>Teacher:</DashboardText> {studentProfile.teacher}</p>
              <ActionButton variant="secondary"><DashboardText>Join Class</DashboardText></ActionButton>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Free Trial Status">
          <div className="dashboard-status-large">
            <StatusBadge label="Completed" />
            <p><DashboardText>Placement completed. Full course enrollment is active.</DashboardText></p>
          </div>
        </SectionCard>
        <SectionCard title="Teacher">
          <div className="dashboard-teacher-card">
            <div className="dashboard-avatar"><DashboardText>MA</DashboardText></div>
            <div>
              <h3>{studentProfile.teacher}</h3>
              <p><DashboardText>Quran Reading and Tajweed</DashboardText></p>
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
        <SectionCard title="Weekly Timetable" subtitle="Class schedule for this week">
          <DataTable columns={timetableColumns} rows={studentTimetable} getRowKey={(row) => `${row.time}-${row.className}`} />
        </SectionCard>

        <SectionCard title="Course Progress">
          <div className="dashboard-progress-summary">
            <div className="dashboard-progress-ring" style={{ '--progress': '74%' } as React.CSSProperties}>
              <span>74%</span>
            </div>
            <ProgressBar value={74} label="Quran Reading Level 3" />
            <div className="dashboard-progress-facts">
              <span><DashboardText>31 lessons completed</DashboardText></span>
              <span><DashboardText>2 Juz completed</DashboardText></span>
              <span><DashboardText>48 stars earned</DashboardText></span>
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
