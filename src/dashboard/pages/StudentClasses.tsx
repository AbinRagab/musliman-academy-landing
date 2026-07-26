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
  StudentModal,
  StudentPageHeader,
  StudentTabs,
} from '../components/student/StudentPortalComponents';
import { fetchStudentClassesData, reportClassIssue } from '../services/studentClassesService';
import { sendStudentMessage } from '../services/studentMessagesService';
import { getHomeworkForClass, type StudentClassSession } from '../services/studentService';

const classTabs = ['Upcoming', 'Completed', 'Missed', 'Cancelled / Rescheduled'] as const;
type ClassTab = (typeof classTabs)[number];

export default function StudentClasses() {
  const [classes, setClasses] = useState<StudentClassSession[]>([]);
  const [activeTab, setActiveTab] = useState<ClassTab>('Upcoming');
  const [selectedClassForDetails, setSelectedClassForDetails] = useState<StudentClassSession | null>(null);
  const [selectedClassForHomework, setSelectedClassForHomework] = useState<StudentClassSession | null>(null);
  const [selectedClassWithoutMeetingLink, setSelectedClassWithoutMeetingLink] = useState<StudentClassSession | null>(null);
  const [isClassDetailsOpen, setIsClassDetailsOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [issueClass, setIssueClass] = useState<StudentClassSession | null>(null);
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);

  useEffect(() => {
    fetchStudentClassesData().then((data) => setClasses(data.classes));
  }, []);

  const filteredClasses = useMemo(() => {
    if (activeTab === 'Upcoming') {
      return classes.filter((session) => session.status === 'scheduled' || session.status === 'live');
    }

    if (activeTab === 'Completed') {
      return classes.filter((session) => session.status === 'completed');
    }

    if (activeTab === 'Missed') {
      return classes.filter((session) => session.status === 'student_absent' || session.status === 'teacher_absent' || session.attendanceStatus === 'absent');
    }

    return classes.filter((session) => session.status === 'cancelled' || session.status === 'rescheduled');
  }, [activeTab, classes]);

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
      {issueClass && (
        <StudentModal
          title="Report Class Issue"
          description="Use this if attendance, status, or class details look incorrect."
          onClose={() => setIssueClass(null)}
          footer={<ActionButton type="submit" form="student-class-issue-form">Submit Issue</ActionButton>}
        >
          <form
            id="student-class-issue-form"
            className="dashboard-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              reportClassIssue({
                classId: issueClass.id,
                reason: String(formData.get('reason') || ''),
                message: String(formData.get('message') || ''),
              }).then(() => setIssueClass(null));
            }}
          >
            <label>
              <span>Selected class</span>
              <input readOnly value={`${issueClass.title} - ${issueClass.date}`} />
            </label>
            <label>
              <span>Reason</span>
              <select name="reason">
                <option>Attendance looks wrong</option>
                <option>Class status looks wrong</option>
                <option>Meeting link did not work</option>
                <option>Other class issue</option>
              </select>
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" rows={4} required />
            </label>
          </form>
        </StudentModal>
      )}

      <StudentPageHeader
        title="My Classes"
        subtitle="Class records, session history, lesson summaries, attendance status, homework, and teacher notes."
        action={(
          <ActionButton variant="secondary" onClick={() => setCompose({ to: 'Academy Team', subject: 'Class records question' })}>
            <Icon name="message" size={17} />
            Contact Academy
          </ActionButton>
        )}
      />

      <StudentTabs tabs={classTabs} activeTab={activeTab} onChange={setActiveTab} />

      <SectionCard title={`${activeTab} Classes`} subtitle="Session records are view-only for students and parents.">
        <div className="student-card-list">
          {filteredClasses.length ? filteredClasses.map((session) => (
            <ClassListCard
              key={session.id}
              session={session}
              variant="history"
              onViewDetails={(selectedSession) => {
                setSelectedClassForDetails(selectedSession);
                setIsClassDetailsOpen(true);
              }}
              onReportIssue={setIssueClass}
              onMeetingLinkUnavailable={setSelectedClassWithoutMeetingLink}
              onViewHomework={(selectedSession) => {
                setSelectedClassForHomework(selectedSession);
                setIsHomeworkModalOpen(true);
              }}
            />
          )) : <EmptyState title="No class records in this tab" description="Records will appear here after classes are scheduled or completed." />}
        </div>
      </SectionCard>
    </div>
  );
}
