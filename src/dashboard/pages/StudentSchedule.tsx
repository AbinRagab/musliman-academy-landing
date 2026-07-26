import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import SectionCard from '../components/SectionCard';
import ClassDetailsModal from '../components/student/ClassDetailsModal';
import HomeworkDetailsModal from '../components/student/HomeworkDetailsModal';
import {
  ClassListCard,
  ComposeMessageModal,
  EmptyState,
  NextClassCard,
  StudentModal,
  StudentPageHeader,
  StudentStatCard,
} from '../components/student/StudentPortalComponents';
import { fetchStudentClassesData, submitRescheduleRequest } from '../services/studentClassesService';
import { sendStudentMessage } from '../services/studentMessagesService';
import {
  getHomeworkForClass,
  getNextClass,
  type StudentClassSession,
  type StudentPortalProfile,
} from '../services/studentService';

type ScheduleData = {
  profile: StudentPortalProfile;
  classes: StudentClassSession[];
  upcomingClasses: StudentClassSession[];
};

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function weekdayFromDate(dateLabel: string) {
  const parsed = new Date(dateLabel);
  return Number.isNaN(parsed.getTime()) ? 'Scheduled' : parsed.toLocaleDateString('en-US', { weekday: 'long' });
}

export default function StudentSchedule() {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [rescheduleClass, setRescheduleClass] = useState<StudentClassSession | null>(null);
  const [selectedClassForDetails, setSelectedClassForDetails] = useState<StudentClassSession | null>(null);
  const [selectedClassForHomework, setSelectedClassForHomework] = useState<StudentClassSession | null>(null);
  const [selectedClassWithoutMeetingLink, setSelectedClassWithoutMeetingLink] = useState<StudentClassSession | null>(null);
  const [isClassDetailsOpen, setIsClassDetailsOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);

  useEffect(() => {
    fetchStudentClassesData().then(setData);
  }, []);

  const weekly = useMemo(() => {
    const upcoming = data?.upcomingClasses || [];
    return dayOrder.map((day) => ({
      day,
      sessions: upcoming.filter((session) => weekdayFromDate(session.date) === day),
    }));
  }, [data]);

  if (!data) {
    return <div className="dashboard-loading-state">Loading schedule...</div>;
  }

  const nextClass = getNextClass(data.upcomingClasses);

  return (
    <div className="dashboard-page dashboard-page--management">
      {compose && (
        <ComposeMessageModal
          to={compose.to}
          subject={compose.subject}
          onClose={() => setCompose(null)}
          onSend={(payload) => sendStudentMessage(payload).then(() => setCompose(null))}
        />
      )}
      {rescheduleClass && (
        <StudentModal
          title="Request Reschedule"
          description="Send your preferred time to the academy scheduling team."
          onClose={() => setRescheduleClass(null)}
          footer={(
            <ActionButton type="submit" form="student-reschedule-form">
              <Icon name="send" size={16} />
              Submit Request
            </ActionButton>
          )}
        >
          <form
            id="student-reschedule-form"
            className="dashboard-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              submitRescheduleRequest({
                classId: rescheduleClass.id,
                preferredDateTime: String(formData.get('preferredDateTime') || ''),
                reason: String(formData.get('reason') || ''),
              }).then(() => setRescheduleClass(null));
            }}
          >
            <label>
              <span>Selected class</span>
              <input readOnly value={`${rescheduleClass.title} - ${rescheduleClass.date} ${rescheduleClass.time}`} />
            </label>
            <label>
              <span>Preferred new date/time</span>
              <input name="preferredDateTime" type="datetime-local" required />
            </label>
            <label>
              <span>Reason</span>
              <textarea name="reason" rows={4} required />
            </label>
          </form>
        </StudentModal>
      )}
      {isClassDetailsOpen && selectedClassForDetails && (
        <ClassDetailsModal
          classSession={selectedClassForDetails}
          onClose={() => {
            setIsClassDetailsOpen(false);
            setSelectedClassForDetails(null);
          }}
        />
      )}
      {isHomeworkModalOpen && selectedClassForHomework && (
        <HomeworkDetailsModal
          classSession={selectedClassForHomework}
          homework={getHomeworkForClass(selectedClassForHomework)}
          onClose={() => {
            setIsHomeworkModalOpen(false);
            setSelectedClassForHomework(null);
          }}
        />
      )}
      {selectedClassWithoutMeetingLink && (
        <StudentModal
          title="Meeting Link Unavailable"
          onClose={() => setSelectedClassWithoutMeetingLink(null)}
          footer={(
            <div className="student-card-actions">
              <ActionButton variant="secondary" onClick={() => setSelectedClassWithoutMeetingLink(null)}>Close</ActionButton>
              <ActionButton
                onClick={() => {
                  setCompose({ to: 'Academy Team', subject: `Meeting link request: ${selectedClassWithoutMeetingLink.title}` });
                  setSelectedClassWithoutMeetingLink(null);
                }}
              >
                <Icon name="support" size={16} />
                Contact Academy Team
              </ActionButton>
            </div>
          )}
        >
          <p className="student-modal-copy">Meeting link is not available. Please contact the academy team.</p>
        </StudentModal>
      )}

      <StudentPageHeader
        title="Schedule"
        subtitle="Upcoming timetable and next sessions only."
        action={(
          <ActionButton variant="secondary" onClick={() => nextClass ? setRescheduleClass(nextClass) : setCompose({ to: 'Academy Team', subject: 'Schedule request' })}>
            <Icon name="calendar" size={17} />
            Request Reschedule
          </ActionButton>
        )}
      />

      <NextClassCard classSession={nextClass} onContact={() => setCompose({ to: 'Academy Team', subject: 'Class link request' })} />

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Upcoming Sessions" value={data.upcomingClasses.length} trend="Confirmed schedule" icon="calendar" />
        <StudentStatCard label="Teacher" value={data.profile.teacher.replace('Ust. ', '').replace('Sh. ', '')} trend={data.profile.program} icon="teacher" />
        <StudentStatCard label="Timezone" value={data.profile.timezone} trend="Student preference" icon="globe" />
        <StudentStatCard label="Program" value={data.profile.program} trend={data.profile.level} icon="quran" />
      </div>

      <SectionCard title="Weekly Timetable" subtitle="Confirmed upcoming classes by day">
        <div className="student-week-grid">
          {weekly.map((day) => (
            <article key={day.day}>
              <h3>{day.day}</h3>
              {day.sessions.length ? day.sessions.map((session) => (
                <div key={session.id}>
                  <strong>{session.time}</strong>
                  <span>{session.title}</span>
                  <small>{session.teacher}</small>
                </div>
              )) : <p>No class scheduled</p>}
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Upcoming Sessions" subtitle="Join links and session details">
        <div className="student-card-list">
          {data.upcomingClasses.length ? data.upcomingClasses.map((session) => (
            <ClassListCard
              key={session.id}
              session={session}
              variant="schedule"
              onViewDetails={(selectedSession) => {
                setSelectedClassForDetails(selectedSession);
                setIsClassDetailsOpen(true);
              }}
              onMeetingLinkUnavailable={setSelectedClassWithoutMeetingLink}
              onViewHomework={(selectedSession) => {
                setSelectedClassForHomework(selectedSession);
                setIsHomeworkModalOpen(true);
              }}
            />
          )) : <EmptyState title="No upcoming sessions" description="Your next class will appear here after scheduling confirmation." />}
        </div>
      </SectionCard>
    </div>
  );
}
