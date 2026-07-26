import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import SectionCard from '../components/SectionCard';
import {
  ComposeMessageModal,
  MessageDetailPanel,
  MessageList,
  StudentPageHeader,
  StudentStatCard,
  StudentTabs,
} from '../components/student/StudentPortalComponents';
import { fetchStudentMessagesData, sendStudentMessage, type StudentMessageCategory } from '../services/studentMessagesService';
import { type StudentMessage } from '../services/studentService';

const messageTabs = ['All', 'Teacher', 'Admin', 'Payments', 'Class Updates', 'Homework'] as const;

export default function StudentMessages() {
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [activeTab, setActiveTab] = useState<StudentMessageCategory>('All');
  const [selectedId, setSelectedId] = useState('');
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);

  useEffect(() => {
    fetchStudentMessagesData().then((data) => {
      setMessages(data.messages);
      setSelectedId(data.messages[0]?.id || '');
    });
  }, []);

  const filteredMessages = useMemo(() => (
    activeTab === 'All' ? messages : messages.filter((message) => message.senderRole === activeTab)
  ), [activeTab, messages]);
  const selectedMessage = messages.find((message) => message.id === selectedId) || filteredMessages[0] || messages[0];

  return (
    <div className="dashboard-page dashboard-page--management dashboard-page--student-messages">
      {compose && (
        <ComposeMessageModal
          to={compose.to}
          subject={compose.subject}
          onClose={() => setCompose(null)}
          onSend={(payload) => sendStudentMessage(payload).then(() => setCompose(null))}
        />
      )}

      <StudentPageHeader
        title="Messages"
        subtitle="Teacher, academy, payment, homework, and class update communication."
        action={(
          <ActionButton onClick={() => setCompose({ to: 'Teacher', subject: 'Message from student portal' })}>
            <Icon name="send" size={17} />
            Message Teacher
          </ActionButton>
        )}
      />

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Unread Messages" value={messages.filter((message) => message.unread).length} trend="Needs review" icon="message" />
        <StudentStatCard label="Teacher Feedback" value={messages.filter((message) => message.senderRole === 'Teacher').length} trend="Teacher messages" icon="teacher" />
        <StudentStatCard label="Class Updates" value={messages.filter((message) => message.senderRole === 'Class Updates').length} trend="Schedule notices" icon="calendar" />
        <StudentStatCard label="Payment Reminders" value={messages.filter((message) => message.senderRole === 'Payments').length} trend="Finance notices" icon="bell" />
      </div>

      <StudentTabs tabs={messageTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="dashboard-grid dashboard-grid--two student-messages-layout">
        <SectionCard title="Message List" subtitle="Select a message to read the full detail">
          <MessageList messages={filteredMessages} selectedId={selectedMessage?.id || ''} onSelect={(message) => setSelectedId(message.id)} />
        </SectionCard>

        <SectionCard title="Message Detail" subtitle="Full communication record">
          {selectedMessage && <MessageDetailPanel message={selectedMessage} onReply={() => setCompose({ to: selectedMessage.senderRole, subject: `Re: ${selectedMessage.subject}` })} />}
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions">
        <div className="student-quick-actions">
          <ActionButton variant="secondary" onClick={() => setCompose({ to: 'Teacher', subject: 'Question for teacher' })}><Icon name="teacher" size={16} />Message Teacher</ActionButton>
          <ActionButton variant="secondary" onClick={() => setCompose({ to: 'Academy Team', subject: 'Academy support request' })}><Icon name="support" size={16} />Contact Academy Team</ActionButton>
          <ActionButton variant="secondary" onClick={() => setCompose({ to: 'Scheduling Team', subject: 'Schedule question' })}><Icon name="calendar" size={16} />Ask about Schedule</ActionButton>
          <ActionButton variant="secondary" onClick={() => setCompose({ to: 'Finance Team', subject: 'Payment question' })}><Icon name="award" size={16} />Ask about Payment</ActionButton>
        </div>
      </SectionCard>
    </div>
  );
}
