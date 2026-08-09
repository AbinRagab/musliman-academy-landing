import { useMemo, useState, type ReactNode } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardModal from '../components/DashboardModal';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EvaluationCard from '../components/EvaluationCard';
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
type StudentMessage = {
  id: string;
  sender: string;
  role: string;
  category: 'Teacher' | 'Admin' | 'Payments' | 'Class Updates' | 'Homework';
  subject: string;
  preview: string;
  body: string;
  dateTime: string;
  unread: boolean;
  relatedClass?: string;
  program?: string;
};

const scheduleItems = studentTimetable.map((item) => ({
  time: item.time,
  title: item.className,
  meta: `Teacher: ${item.teacher}`,
  status: item.status,
  platform: 'Zoom classroom',
}));

const studentDetails = {
  id: '',
  name: studentProfile.name,
  initials: 'ST',
  age: '',
  country: '',
  status: 'No student record',
  parentName: '',
  parentWhatsapp: '',
  parentEmail: '',
  preferredContact: 'Academy messages',
  currentProgram: studentProfile.course,
  currentLevel: 'Level not set',
  learningGoal: '',
  startDate: '',
  assignedTeacher: studentProfile.teacher,
  scheduleNotes: '',
  classDays: 'Schedule pending',
  classTime: 'Time pending',
  timezone: 'Timezone not set',
  nextClassDate: 'Schedule pending',
  meetingPlatform: 'Meeting link pending',
  trialDate: 'Not scheduled',
  trialTeacher: studentProfile.teacher,
  trialResult: 'No trial record',
  enrollmentDate: '',
  preferredClassTime: '',
  whatsappReminders: 'Not set',
  languagePreference: 'Not set',
};

const studentMessages: StudentMessage[] = [];

const messageTabs = ['All', 'Teacher', 'Admin', 'Payments', 'Class Updates', 'Homework'] as const;
type MessageTab = (typeof messageTabs)[number];

const notificationSettings = [
  { label: 'Class reminders', description: 'Send a reminder before each scheduled class.', enabled: true },
  { label: 'Homework reminders', description: 'Notify when homework is due or reviewed.', enabled: true },
  { label: 'Payment reminders', description: 'Notify before package renewal or due dates.', enabled: true },
  { label: 'Progress report notifications', description: 'Send updates when teacher feedback is available.', enabled: true },
  { label: 'WhatsApp notifications', description: 'Use WhatsApp as the primary reminder channel.', enabled: true },
  { label: 'Email notifications', description: 'Send copies of important portal messages by email.', enabled: false },
];

const parentCommunicationSettings = [
  { label: 'Send class reminders to parent', enabled: true },
  { label: 'Send absence alerts to parent', enabled: true },
  { label: 'Send progress reports to parent', enabled: true },
];

function InfoGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="student-info-grid">
      {items.map((item) => (
        <span key={item.label}>
          {item.label}
          <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}

function SettingToggle({ label, description, enabled }: { label: string; description?: string; enabled: boolean }) {
  return (
    <label className="student-setting-toggle">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" defaultChecked={enabled} />
    </label>
  );
}

export default function StudentSectionPage({ section }: { section: StudentSection }) {
  const [messageTab, setMessageTab] = useState<MessageTab>('All');
  const [selectedMessageId, setSelectedMessageId] = useState(studentMessages[0]?.id || '');
  const [scheduleDetails, setScheduleDetails] = useState<{ title: string; meta: string; time: string } | null>(null);
  const filteredMessages = useMemo(() => (
    messageTab === 'All' ? studentMessages : studentMessages.filter((message) => message.category === messageTab)
  ), [messageTab]);
  const selectedMessage = (studentMessages.find((message) => message.id === selectedMessageId) || filteredMessages[0] || studentMessages[0]) as StudentMessage;

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

  const headerActionBySection: Partial<Record<StudentSection, ReactNode>> = {
    messages: (
      <ActionButton variant="secondary">
        <Icon name="send" size={18} />
        Message Teacher
      </ActionButton>
    ),
    settings: (
      <ActionButton variant="secondary">
        <Icon name="shieldCheck" size={18} />
        Security
      </ActionButton>
    ),
    profile: (
      <ActionButton variant="secondary">
        <Icon name="user" size={18} />
        Student Record
      </ActionButton>
    ),
  };

  const header = (
    <DashboardPageHeader
      eyebrow="STUDENT PORTAL"
      title={titleBySection[section]}
      subtitle={subtitleBySection[section]}
      action={headerActionBySection[section] || (
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
        {scheduleDetails && (
          <DashboardModal
            title="Class Details"
            onClose={() => setScheduleDetails(null)}
            footer={<ActionButton onClick={() => setScheduleDetails(null)}>Close</ActionButton>}
          >
            <div className="student-info-grid">
              <span>Class <strong>{scheduleDetails.title}</strong></span>
              <span>Time <strong>{scheduleDetails.time}</strong></span>
              <span>Details <strong>{scheduleDetails.meta}</strong></span>
            </div>
          </DashboardModal>
        )}
        {header}
        <div className="dashboard-stats-grid">
          <StatCard label="Upcoming Classes" value={scheduleItems.length} trend="This week" icon="calendar" />
          <StatCard label="Teacher" value="Unassigned" trend={studentProfile.teacher} icon="teacher" />
          <StatCard label="Attendance Rate" value={studentProfile.attendanceRate} trend="Excellent consistency" icon="clipboard" />
          <StatCard label="Current Level" value={studentDetails.currentLevel} trend={studentProfile.currentCourse} icon="quran" />
        </div>
        <SectionCard title="Upcoming Sessions">
          <ScheduleCard items={scheduleItems} onViewDetails={(item) => setScheduleDetails(item)} />
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

  if (section === 'profile') {
    return (
      <div className="dashboard-page dashboard-page--management dashboard-page--student-profile">
        {header}
        <div className="dashboard-grid dashboard-grid--two student-profile-layout">
          <SectionCard className="student-identity-card" title="Student Identity">
            <div className="student-identity-card__top">
              <div className="student-avatar-large">{studentDetails.initials}</div>
              <div>
                <h2>{studentDetails.name}</h2>
                <p>{studentDetails.id}</p>
                <StatusBadge label={studentDetails.status} />
              </div>
            </div>
            <InfoGrid
              items={[
                { label: 'Age', value: studentDetails.age },
                { label: 'Country', value: studentDetails.country },
                { label: 'Current program', value: studentDetails.currentProgram },
                { label: 'Current level', value: studentDetails.currentLevel },
                { label: 'Assigned teacher', value: studentDetails.assignedTeacher },
              ]}
            />
          </SectionCard>

          <SectionCard title="Parent / Guardian Information">
            <InfoGrid
              items={[
                { label: 'Parent name', value: studentDetails.parentName },
                { label: 'Parent WhatsApp', value: studentDetails.parentWhatsapp },
                { label: 'Parent email', value: studentDetails.parentEmail },
                { label: 'Preferred contact', value: studentDetails.preferredContact },
                { label: 'Country', value: studentDetails.country },
              ]}
            />
          </SectionCard>

          <SectionCard title="Academic Information">
            <InfoGrid
              items={[
                { label: 'Current course', value: studentDetails.currentProgram },
                { label: 'Current level', value: studentDetails.currentLevel },
                { label: 'Learning goal', value: studentDetails.learningGoal },
                { label: 'Start date', value: studentDetails.startDate },
                { label: 'Assigned teacher', value: studentDetails.assignedTeacher },
                { label: 'Schedule notes', value: studentDetails.scheduleNotes },
              ]}
            />
          </SectionCard>

          <SectionCard title="Class Schedule Summary">
            <InfoGrid
              items={[
                { label: 'Class days', value: studentDetails.classDays },
                { label: 'Class time', value: studentDetails.classTime },
                { label: 'Timezone', value: studentDetails.timezone },
                { label: 'Next class date', value: studentDetails.nextClassDate },
                { label: 'Meeting platform', value: studentDetails.meetingPlatform },
              ]}
            />
          </SectionCard>

          <SectionCard title="Trial / Enrollment Info">
            <InfoGrid
              items={[
                { label: 'Trial date', value: studentDetails.trialDate },
                { label: 'Trial teacher', value: studentDetails.trialTeacher },
                { label: 'Trial result', value: studentDetails.trialResult },
                { label: 'Enrollment date', value: studentDetails.enrollmentDate },
              ]}
            />
          </SectionCard>

          <SectionCard title="Preferences">
            <InfoGrid
              items={[
                { label: 'Preferred class time', value: studentDetails.preferredClassTime },
                { label: 'WhatsApp reminders', value: studentDetails.whatsappReminders },
                { label: 'Language preference', value: studentDetails.languagePreference },
                { label: 'Timezone', value: studentDetails.timezone },
              ]}
            />
          </SectionCard>
        </div>
      </div>
    );
  }

  if (section === 'messages') {
    return (
      <div className="dashboard-page dashboard-page--management dashboard-page--student-messages">
        {header}
        <div className="dashboard-stats-grid">
          <StatCard label="Unread Messages" value={studentMessages.filter((message) => message.unread).length} trend="Need review" icon="message" />
          <StatCard label="Teacher Feedback" value="2" trend="This week" icon="teacher" />
          <StatCard label="Class Updates" value="1" trend="Latest schedule note" icon="calendar" />
          <StatCard label="Payment Reminders" value="1" trend="Package update" icon="bell" />
        </div>

        <div className="student-message-tabs">
          {messageTabs.map((tab) => (
            <button
              key={tab}
              className={messageTab === tab ? 'is-active' : ''}
              type="button"
              onClick={() => {
                setMessageTab(tab);
                const nextMessage = tab === 'All' ? studentMessages[0] : studentMessages.find((message) => message.category === tab);
                setSelectedMessageId(nextMessage?.id || studentMessages[0]?.id || '');
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="dashboard-grid dashboard-grid--two student-messages-layout">
          <SectionCard title="Messages List" subtitle="Teacher, academy, class, homework, and payment messages">
            <div className="student-messages-list">
              {filteredMessages.map((message) => (
                <button
                  key={message.id}
                  className={`student-message-card ${selectedMessage?.id === message.id ? 'is-selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedMessageId(message.id)}
                >
                  <div>
                    <strong>{message.sender}</strong>
                    <span>{message.role}</span>
                  </div>
                  <h3>{message.subject}</h3>
                  <p>{message.preview}</p>
                  <footer>
                    <span>{message.dateTime}</span>
                    <StatusBadge label={message.unread ? 'Unread' : 'Read'} tone={message.unread ? 'warning' : 'neutral'} />
                  </footer>
                  {message.relatedClass && <small>Related class: {message.relatedClass}</small>}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Message Detail" subtitle="Full communication record">
            <div className="student-message-detail">
              <div className="student-message-detail__header">
                <div>
                  <span>{selectedMessage.role}</span>
                  <h2>{selectedMessage.subject}</h2>
                  <p>{selectedMessage.sender} - {selectedMessage.dateTime}</p>
                </div>
                <StatusBadge label={selectedMessage.unread ? 'Unread' : 'Read'} tone={selectedMessage.unread ? 'warning' : 'neutral'} />
              </div>
              <p>{selectedMessage.body}</p>
              <InfoGrid
                items={[
                  { label: 'Related class', value: selectedMessage.relatedClass || '-' },
                  { label: 'Program', value: selectedMessage.program || studentProfile.currentCourse },
                  { label: 'Sender role', value: selectedMessage.role },
                ]}
              />
              <ActionButton variant="secondary">
                <Icon name="send" size={16} />
                Reply
              </ActionButton>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Quick Actions">
          <div className="student-quick-actions">
            {['Message Teacher', 'Contact Academy Team', 'Ask about Schedule', 'Ask about Payment'].map((action) => (
              <ActionButton key={action} variant="secondary">
                <Icon name={action.includes('Payment') ? 'bell' : action.includes('Schedule') ? 'calendar' : 'message'} size={16} />
                {action}
              </ActionButton>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  if (section === 'settings') {
    return (
      <div className="dashboard-page dashboard-page--management dashboard-page--student-settings">
        {header}
        <div className="dashboard-grid dashboard-grid--two student-settings-layout">
          <SectionCard title="Account Settings" subtitle="Basic portal identity">
            <div className="student-settings-fields">
              <label>
                <span>Display name</span>
                <input defaultValue={studentDetails.name} />
              </label>
              <label>
                <span>Email</span>
                <input defaultValue={studentDetails.parentEmail} />
              </label>
              <label>
                <span>WhatsApp number</span>
                <input defaultValue={studentDetails.parentWhatsapp} />
              </label>
              <ActionButton variant="secondary">
                <Icon name="lock" size={16} />
                Change password
              </ActionButton>
            </div>
          </SectionCard>

          <SectionCard title="Notification Preferences">
            <div className="student-settings-list">
              {notificationSettings.map((setting) => (
                <SettingToggle key={setting.label} {...setting} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Learning Preferences">
            <div className="student-settings-fields">
              <label>
                <span>Preferred class time</span>
                <select defaultValue={studentDetails.preferredClassTime}>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                </select>
              </label>
              <label>
                <span>Preferred teacher gender</span>
                <select defaultValue="No preference">
                  <option>No preference</option>
                  <option>Female teacher</option>
                  <option>Male teacher</option>
                </select>
              </label>
              <label>
                <span>Preferred language</span>
                <select defaultValue={studentDetails.languagePreference}>
                  <option>English with Arabic terms</option>
                  <option>Arabic</option>
                  <option>English</option>
                  <option>Urdu</option>
                </select>
              </label>
              <label>
                <span>Timezone</span>
                <select defaultValue={studentDetails.timezone}>
                  <option>Africa/Cairo</option>
                  <option>Europe/London</option>
                  <option>America/New_York</option>
                  <option>Asia/Dubai</option>
                </select>
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Parent Communication Settings">
            <div className="student-settings-list">
              {parentCommunicationSettings.map((setting) => (
                <SettingToggle key={setting.label} {...setting} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Privacy & Security">
            <div className="student-security-list">
              {[
                { label: 'Change password', disabled: false },
                { label: 'Two-factor authentication requires account setup', disabled: true },
                { label: 'Active sessions require account setup', disabled: true },
                { label: 'Sign out from all devices requires account setup', disabled: true },
              ].map((item) => (
                <button key={item.label} type="button" disabled={item.disabled}>
                  <Icon name={item.label.includes('password') ? 'lock' : item.label.includes('sessions') ? 'laptop' : 'shieldCheck'} size={17} />
                  <span>{item.label}</span>
                  <Icon name="chevronRight" size={16} />
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Portal Preferences">
            <div className="student-settings-fields">
              <label>
                <span>Language</span>
                <select defaultValue="English">
                  <option>English</option>
                  <option>Arabic</option>
                  <option>Urdu</option>
                </select>
              </label>
              <label>
                <span>Theme</span>
                <select defaultValue="Light">
                  <option>Light</option>
                  <option>System</option>
                </select>
              </label>
              <label>
                <span>Calendar format</span>
                <select defaultValue="Weekly">
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </label>
              <label>
                <span>Timezone</span>
                <select defaultValue={studentDetails.timezone}>
                  <option>Africa/Cairo</option>
                  <option>Europe/London</option>
                  <option>America/New_York</option>
                  <option>Asia/Dubai</option>
                </select>
              </label>
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
            <StatCard label="Trial Status" value={studentDetails.trialResult} trend="Enrollment flow" icon="gift" />
            <StatCard label="Assigned Teacher" value="Unassigned" trend={studentProfile.teacher} icon="teacher" />
            <StatCard label="Program" value={studentProfile.course} trend={studentProfile.currentCourse} icon="quran" />
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
