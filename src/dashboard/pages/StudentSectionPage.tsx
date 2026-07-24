import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EvaluationCard from '../components/EvaluationCard';
import ProfilePanel from '../components/ProfilePanel';
import ScheduleCard from '../components/ScheduleCard';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  studentAttendanceHistory,
  studentPaymentSummary,
  studentProfile,
  studentProgressTopics,
  studentTimetable,
} from '../data/mockData';

type StudentSection =
  | 'classes'
  | 'free-trial'
  | 'attendance'
  | 'homework'
  | 'progress'
  | 'messages'
  | 'payments'
  | 'profile'
  | 'settings'
  | 'schedule';

type GenericRow = Record<string, string>;

const scheduleItems = studentTimetable.map((item) => ({
  time: item.time,
  title: item.className,
  meta: `Teacher: ${item.teacher}`,
  status: item.status,
  platform: 'Zoom classroom',
}));

export default function StudentSectionPage({ section }: { section: StudentSection }) {
  const titleBySection: Record<StudentSection, string> = {
    classes: 'My Classes',
    schedule: 'Schedule',
    'free-trial': 'Free Trial',
    attendance: 'Attendance History',
    homework: 'Homework',
    progress: 'Progress',
    messages: 'Messages',
    payments: 'Payments & Package',
    profile: 'Profile',
    settings: 'Settings',
  };

  const subtitleBySection: Record<StudentSection, string> = {
    classes: 'View upcoming and completed class sessions.',
    schedule: 'See upcoming sessions, teacher details, and join status.',
    'free-trial': 'Review trial status, teacher assignment, and enrollment recommendation.',
    attendance: 'Track present, absent, late, and excused records.',
    homework: 'Upload homework and review teacher feedback.',
    progress: 'Follow program level, lesson completion, topics, and teacher feedback.',
    messages: 'View parent, teacher, and academy communication.',
    payments: 'Review package status, next due date, and remaining sessions.',
    profile: 'Review student data, parent contact, country, and preferences.',
    settings: 'Manage student portal preferences.',
  };

  const header = (
    <DashboardPageHeader
      eyebrow="STUDENT PORTAL"
      title={titleBySection[section]}
      subtitle={subtitleBySection[section]}
      action={(
        <ActionButton variant="secondary">
          <Icon name="video" size={18} />
          Join Next Class
        </ActionButton>
      )}
    />
  );

  if (section === 'schedule' || section === 'classes') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {header}
        <div className="dashboard-stats-grid">
          <StatCard label="Upcoming Classes" value="3" trend="This week" icon="calendar" />
          <StatCard label="Teacher" value="Maryam" trend={studentProfile.teacher} icon="teacher" />
          <StatCard label="Attendance Rate" value={studentProfile.attendanceRate} trend="Excellent consistency" icon="clipboard" />
          <StatCard label="Current Level" value="Level 3" trend={studentProfile.currentCourse} icon="quran" />
        </div>
        <SectionCard title="Upcoming Sessions">
          <ScheduleCard items={scheduleItems} />
        </SectionCard>
      </div>
    );
  }

  if (section === 'attendance') {
    const columns: Array<DataTableColumn<GenericRow>> = [
      { header: 'Class Date', accessor: 'date' },
      { header: 'Class', accessor: 'className' },
      { header: 'Teacher', accessor: 'teacher' },
      { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
      { header: 'Notes', accessor: 'notes' },
    ];

    return (
      <div className="dashboard-page dashboard-page--management">
        {header}
        <SectionCard title="Attendance History">
          <DataTable columns={columns} rows={studentAttendanceHistory} getRowKey={(row) => row.date} />
        </SectionCard>
      </div>
    );
  }

  if (section === 'progress') {
    const columns: Array<DataTableColumn<GenericRow>> = [
      { header: 'Recent Topic', accessor: 'topic' },
      { header: 'Score', accessor: 'score' },
      { header: 'Teacher Feedback', accessor: 'feedback' },
    ];

    return (
      <div className="dashboard-page dashboard-page--management">
        {header}
        <div className="dashboard-grid dashboard-grid--two">
          <SectionCard title="Progress Summary">
            <div className="dashboard-insight-list">
              <EvaluationCard title="Current program progress" score={74} note="Quran Reading Level 3 is progressing steadily." />
              <EvaluationCard title="Lesson completion" score={82} note="31 lessons completed with consistent revision." />
            </div>
          </SectionCard>
          <SectionCard title="Recent Lesson Topics">
            <DataTable columns={columns} rows={studentProgressTopics} getRowKey={(row) => row.topic} />
          </SectionCard>
        </div>
      </div>
    );
  }

  if (section === 'payments') {
    const columns: Array<DataTableColumn<GenericRow>> = [
      { header: 'Package', accessor: 'packageName' },
      { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
      { header: 'Next Due Date', accessor: 'nextDue' },
      { header: 'Remaining Sessions', accessor: 'remaining' },
    ];

    return (
      <div className="dashboard-page dashboard-page--management">
        {header}
        <SectionCard title="Payment & Package Summary">
          <DataTable columns={columns} rows={studentPaymentSummary} getRowKey={(row) => row.packageName} />
        </SectionCard>
      </div>
    );
  }

  if (section === 'profile' || section === 'settings' || section === 'messages') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {header}
        <div className="dashboard-grid dashboard-grid--two">
          <ProfilePanel
            name={studentProfile.name}
            subtitle={studentProfile.currentCourse}
            role="student"
            status="active"
            items={[
              { label: 'Teacher', value: studentProfile.teacher },
              { label: 'Parent contact', value: '+20 100 000 0000' },
              { label: 'Country', value: 'Egypt' },
              { label: 'Preference', value: 'WhatsApp reminders' },
            ]}
          />
          <SectionCard title={section === 'messages' ? 'Recent Messages' : 'Portal Preferences'}>
            <div className="dashboard-insight-list">
              <EvaluationCard title="Class reminders" score={100} note="WhatsApp reminders enabled before each class." />
              <EvaluationCard title="Progress reports" score={80} note="Weekly parent summary prepared from mock progress data." />
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (section === 'free-trial') {
    return (
      <div className="dashboard-page dashboard-page--management">
        {header}
        <SectionCard title="Trial / Enrollment Status">
          <div className="dashboard-grid dashboard-grid--three">
            <StatCard label="Trial Status" value="Completed" trend="Recommended to enroll" icon="gift" />
            <StatCard label="Assigned Teacher" value="Maryam" trend={studentProfile.teacher} icon="teacher" />
            <StatCard label="Program" value="Quran" trend={studentProfile.currentCourse} icon="quran" />
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-page--management">
      {header}
      <SectionCard title="Homework Center">
        <div className="dashboard-grid dashboard-grid--three">
          <StatCard label="Pending Homework" value="1" trend="Due before next class" icon="document" />
          <StatCard label="Submitted" value="8" trend="This month" icon="checkCircle" />
          <StatCard label="Teacher Feedback" value="Good" trend="Latest review" icon="star" />
        </div>
      </SectionCard>
    </div>
  );
}
