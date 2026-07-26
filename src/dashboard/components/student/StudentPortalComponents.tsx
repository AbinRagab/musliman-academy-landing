import type { CSSProperties, ReactNode } from 'react';
import Icon from '../../../components/Icon';
import ActionButton from '../ActionButton';
import DashboardPageHeader from '../DashboardPageHeader';
import SectionCard from '../SectionCard';
import StatCard from '../StatCard';
import StatusBadge from '../StatusBadge';
import ProgressBar from '../ProgressBar';
import {
  openExternalLink,
  type StudentAttendanceStatus,
  type StudentClassSession,
  type StudentHomeworkItem,
  type StudentMessage,
  type StudentPayment,
  type StudentSkillRating,
} from '../../services/studentService';

type ModalProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
};

export function StudentPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return <DashboardPageHeader eyebrow="STUDENT PORTAL" title={title} subtitle={subtitle} action={action} />;
}

export function StudentStatCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string | number;
  trend: string;
  icon: string;
}) {
  return <StatCard label={label} value={value} trend={trend} icon={icon} />;
}

export function StudentModal({ title, description, children, footer, onClose, wide = false }: ModalProps) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button className="dashboard-modal__backdrop" type="button" aria-label="Close modal" onClick={onClose} />
      <section className={`dashboard-modal__panel ${wide ? 'dashboard-modal__panel--wide' : ''}`}>
        <div className="dashboard-modal__header">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="dashboard-icon-button" aria-label="Close modal" onClick={onClose}>
            <Icon name="x" size={17} />
          </button>
        </div>
        <div className="dashboard-modal__body">{children}</div>
        {footer && <div className="dashboard-modal__footer">{footer}</div>}
      </section>
    </div>
  );
}

export function AttendanceBadge({ status }: { status: StudentAttendanceStatus | string }) {
  return <StatusBadge label={status} />;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="student-empty-state">
      <Icon name="sparkles" size={24} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ComingSoonModal({ feature, onClose }: { feature: string; onClose: () => void }) {
  return (
    <StudentModal
      title={`${feature} Coming Soon`}
      description="This area is prepared in the portal, and the academy team will enable it when the content or backend workflow is ready."
      onClose={onClose}
      footer={<ActionButton onClick={onClose}>Close</ActionButton>}
    >
      <p className="student-modal-copy">For now, contact the academy team if you need this item before it becomes available in the portal.</p>
    </StudentModal>
  );
}

export function NextClassCard({
  classSession,
  onContact,
  compact = false,
}: {
  classSession: StudentClassSession | null;
  onContact: () => void;
  compact?: boolean;
}) {
  if (!classSession) {
    return (
      <SectionCard title="Next Class" subtitle="No upcoming class is scheduled yet.">
        <div className="student-next-class student-next-class--empty">
          <p>Your timetable will appear here when the academy team confirms your next session.</p>
          <ActionButton variant="secondary" onClick={onContact}>
            <Icon name="support" size={16} />
            Contact Academy Team
          </ActionButton>
        </div>
      </SectionCard>
    );
  }

  const canJoin = Boolean(classSession.meetingLink);

  return (
    <SectionCard
      className={compact ? 'student-next-class-card student-next-class-card--compact' : 'student-next-class-card'}
      title="Next Class"
      subtitle={`${classSession.date} at ${classSession.time} (${classSession.timezone})`}
      action={<StatusBadge label={classSession.status} />}
    >
      <div className="student-next-class">
        <div>
          <h3>{classSession.title}</h3>
          <p>{classSession.teacher} - {classSession.platform}</p>
          <span>{classSession.program} / {classSession.level}</span>
        </div>
        <ActionButton
          variant={canJoin ? 'primary' : 'secondary'}
          onClick={() => {
            if (!openExternalLink(classSession.meetingLink)) {
              onContact();
            }
          }}
        >
          <Icon name={canJoin ? 'video' : 'support'} size={16} />
          {canJoin ? 'Join Class' : 'Contact Academy Team'}
        </ActionButton>
      </div>
    </SectionCard>
  );
}

export function ClassListCard({
  session,
  variant,
  onViewDetails,
  onReportIssue,
  onViewHomework,
  onMeetingLinkUnavailable,
}: {
  session: StudentClassSession;
  variant: 'schedule' | 'history';
  onViewDetails: (session: StudentClassSession) => void;
  onReportIssue?: (session: StudentClassSession) => void;
  onViewHomework?: (session: StudentClassSession) => void;
  onMeetingLinkUnavailable?: (session: StudentClassSession) => void;
}) {
  const canJoin = (session.status === 'scheduled' || session.status === 'live') && Boolean(session.meetingLink);
  const isUpcoming = session.status === 'scheduled' || session.status === 'live';
  const completed = session.status === 'completed';

  return (
    <article className="student-class-list-card">
      <div className="student-class-list-card__main">
        <div className="student-class-date">
          <strong>{session.date.split(',')[0]}</strong>
          <span>{session.time}</span>
        </div>
        <div>
          <h3>{session.title}</h3>
          <p>{session.teacher} - {session.platform}</p>
          <div className="student-meta-row">
            <StatusBadge label={session.status} />
            {session.attendanceStatus && <AttendanceBadge status={session.attendanceStatus} />}
            <span>{session.timezone}</span>
          </div>
        </div>
      </div>
      {variant === 'history' && (
        <div className="student-class-summary-grid">
          <span>Lesson covered <strong>{session.lessonCovered || 'Not recorded yet'}</strong></span>
          <span>Homework <strong>{session.homeworkAssigned || 'No homework assigned'}</strong></span>
          <span>Teacher notes <strong>{session.teacherNotes || 'No notes published'}</strong></span>
        </div>
      )}
      <div className="student-card-actions">
        {isUpcoming && (
          <ActionButton
            variant={canJoin ? 'primary' : 'secondary'}
            onClick={() => {
              if (!openExternalLink(session.meetingLink)) {
                onMeetingLinkUnavailable?.(session);
              }
            }}
          >
            <Icon name="video" size={16} />
            Join Class
          </ActionButton>
        )}
        {completed && (
          <ActionButton variant="secondary" onClick={() => onViewDetails(session)}>
            <Icon name="book" size={16} />
            View Summary
          </ActionButton>
        )}
        {session.homeworkAssigned && onViewHomework && (
          <ActionButton variant="secondary" onClick={() => onViewHomework(session)}>
            <Icon name="document" size={16} />
            View Homework
          </ActionButton>
        )}
        <ActionButton variant="ghost" onClick={() => onViewDetails(session)}>
          <Icon name="eye" size={16} />
          View Details
        </ActionButton>
        {variant === 'history' && onReportIssue && (
          <ActionButton variant="ghost" onClick={() => onReportIssue(session)}>
            <Icon name="question" size={16} />
            Report Issue
          </ActionButton>
        )}
      </div>
    </article>
  );
}

export function HomeworkCard({
  homework,
  onUpload,
  onViewInstructions,
  onViewFeedback,
}: {
  homework: StudentHomeworkItem;
  onUpload: (homework: StudentHomeworkItem) => void;
  onViewInstructions: (homework: StudentHomeworkItem) => void;
  onViewFeedback: (homework: StudentHomeworkItem) => void;
}) {
  return (
    <article className="student-homework-card">
      <div className="student-homework-card__header">
        <div>
          <h3>{homework.title}</h3>
          <p>{homework.relatedClass} - {homework.teacher}</p>
        </div>
        <StatusBadge label={homework.status} />
      </div>
      <p>{homework.instructions}</p>
      <div className="student-info-grid student-info-grid--compact">
        <span>Due date <strong>{homework.dueDate}</strong></span>
        <span>Submission <strong>{homework.submittedAt || 'Not submitted'}</strong></span>
      </div>
      {homework.teacherFeedback && <div className="student-feedback-note">{homework.teacherFeedback}</div>}
      <div className="student-card-actions">
        {(homework.status === 'pending' || homework.status === 'overdue') && (
          <ActionButton onClick={() => onUpload(homework)}>
            <Icon name="document" size={16} />
            Upload Homework
          </ActionButton>
        )}
        <ActionButton variant="secondary" onClick={() => onViewInstructions(homework)}>
          <Icon name="eye" size={16} />
          View Instructions
        </ActionButton>
        {homework.teacherFeedback && (
          <ActionButton variant="secondary" onClick={() => onViewFeedback(homework)}>
            <Icon name="message" size={16} />
            View Feedback
          </ActionButton>
        )}
        {homework.attachmentUrl && (
          <ActionButton variant="ghost" onClick={() => openExternalLink(homework.attachmentUrl)}>
            <Icon name="download" size={16} />
            Download Attachment
          </ActionButton>
        )}
      </div>
    </article>
  );
}

export function ProgressSkillCard({ skill }: { skill: StudentSkillRating }) {
  return (
    <article className="student-skill-card">
      <div>
        <strong>{skill.label}</strong>
        <span>{skill.value}%</span>
      </div>
      <ProgressBar value={skill.value} label={skill.note} />
    </article>
  );
}

export function MessageList({
  messages,
  selectedId,
  onSelect,
}: {
  messages: StudentMessage[];
  selectedId: string;
  onSelect: (message: StudentMessage) => void;
}) {
  if (!messages.length) {
    return <EmptyState title="No messages in this tab" description="Messages from your teacher and academy team will appear here." />;
  }

  return (
    <div className="student-messages-list">
      {messages.map((message) => (
        <button
          key={message.id}
          className={`student-message-card ${selectedId === message.id ? 'is-selected' : ''}`}
          type="button"
          onClick={() => onSelect(message)}
        >
          <div>
            <strong>{message.sender}</strong>
            <span>{message.senderRole}</span>
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
  );
}

export function MessageDetailPanel({ message, onReply }: { message: StudentMessage; onReply: () => void }) {
  return (
    <div className="student-message-detail">
      <div className="student-message-detail__header">
        <div>
          <span>{message.senderRole}</span>
          <h2>{message.subject}</h2>
          <p>{message.sender} - {message.dateTime}</p>
        </div>
        <StatusBadge label={message.unread ? 'Unread' : 'Read'} tone={message.unread ? 'warning' : 'neutral'} />
      </div>
      <p>{message.body}</p>
      <div className="student-info-grid">
        <span>Related class <strong>{message.relatedClass || '-'}</strong></span>
        <span>Program <strong>{message.program || '-'}</strong></span>
        <span>Sender role <strong>{message.senderRole}</strong></span>
      </div>
      <ActionButton variant="secondary" onClick={onReply}>
        <Icon name="send" size={16} />
        Reply
      </ActionButton>
    </div>
  );
}

export function ComposeMessageModal({
  to,
  subject,
  onSend,
  onClose,
}: {
  to: string;
  subject: string;
  onSend: (payload: { to: string; subject: string; message: string }) => void;
  onClose: () => void;
}) {
  return (
    <StudentModal
      title="Compose Message"
      description="Send a note to your teacher or academy team."
      onClose={onClose}
      footer={(
        <ActionButton
          type="submit"
          form="student-compose-form"
        >
          <Icon name="send" size={16} />
          Send Message
        </ActionButton>
      )}
    >
      <form
        id="student-compose-form"
        className="dashboard-form"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSend({
            to: String(formData.get('to') || to),
            subject: String(formData.get('subject') || subject),
            message: String(formData.get('message') || ''),
          });
        }}
      >
        <label>
          <span>To</span>
          <select name="to" defaultValue={to}>
            <option>Teacher</option>
            <option>Academy Team</option>
            <option>Scheduling Team</option>
            <option>Finance Team</option>
          </select>
        </label>
        <label>
          <span>Subject</span>
          <input name="subject" defaultValue={subject} />
        </label>
        <label>
          <span>Message</span>
          <textarea name="message" rows={5} placeholder="Write your message..." required />
        </label>
      </form>
    </StudentModal>
  );
}

export function PaymentSummaryCard({ payment, onContact }: { payment: StudentPayment; onContact: () => void }) {
  return (
    <SectionCard title="Current Package" subtitle="View-only package and renewal summary" action={<StatusBadge label={payment.status} />}>
      <div className="student-payment-package">
        <div>
          <h3>{payment.packageName}</h3>
          <p>{payment.sessions} sessions - {payment.remainingSessions} remaining</p>
        </div>
        <div className="student-payment-meter" style={{ '--sessions-left': `${Math.max(0, Math.min(100, (payment.remainingSessions / payment.sessions) * 100))}%` } as CSSProperties}>
          <span>{payment.remainingSessions}</span>
          <small>left</small>
        </div>
      </div>
      <div className="student-info-grid">
        <span>Start date <strong>{payment.startDate}</strong></span>
        <span>Valid until <strong>{payment.validUntil}</strong></span>
        <span>Next due date <strong>{payment.nextDueDate}</strong></span>
        <span>Payment method <strong>{payment.method}</strong></span>
      </div>
      <div className="student-card-actions">
        <ActionButton variant="secondary" onClick={() => payment.invoiceUrl ? openExternalLink(payment.invoiceUrl) : onContact()}>
          <Icon name="eye" size={16} />
          View Invoice
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => payment.receiptUrl ? openExternalLink(payment.receiptUrl) : onContact()}>
          <Icon name="download" size={16} />
          Download Receipt
        </ActionButton>
        <ActionButton onClick={onContact}>
          <Icon name="support" size={16} />
          Contact Finance
        </ActionButton>
      </div>
    </SectionCard>
  );
}

export function StudentTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="student-message-tabs" role="tablist">
      {tabs.map((tab) => (
        <button key={tab} className={activeTab === tab ? 'is-active' : ''} type="button" onClick={() => onChange(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );
}
