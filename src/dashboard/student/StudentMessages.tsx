import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DashboardActionMenu from '../components/DashboardActionMenu';
import SectionCard from '../components/SectionCard';
import {
  ComposeMessageModal,
  MessageDetailPanel,
  MessageList,
  StudentPageHeader,
  StudentStatCard,
  StudentTabs,
} from '../components/student/StudentPortalComponents';
import { fetchStudentMessagesData, markMessageRead, sendStudentMessage, type StudentMessageCategory } from '../services/studentMessagesService';
import { type StudentMessage } from '../services/studentService';

const messageTabs = ['All', 'Teacher', 'Admin', 'Payments', 'Class Updates', 'Homework'] as const;

export default function StudentMessages() {
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<StudentMessageCategory>('All');
  const [selectedId, setSelectedId] = useState('');
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);

  useEffect(() => {
    fetchStudentMessagesData()
      .then((data) => {
        setMessages(data.messages);
        setSelectedId(data.messages[0]?.id || '');
        setError('');
      })
      .catch((messageError) => {
        if (import.meta.env.DEV) {
          console.error('Student messages fetch failed:', messageError);
        }
        setError('Unable to load messages.');
      })
      .finally(() => setLoading(false));
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
          onSend={(payload) => sendStudentMessage(payload)
            .then(async () => {
              setCompose(null);
              const data = await fetchStudentMessagesData();
              setMessages(data.messages);
            })
            .catch((sendError) => {
              setError(sendError instanceof Error ? sendError.message : 'Unable to send message.');
              if (import.meta.env.DEV) {
                console.error('Student message send failed:', sendError);
              }
            })}
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
          {loading && <p className="dashboard-empty-copy">Loading messages...</p>}
          {!loading && error && <p className="dashboard-empty-copy">{error}</p>}
          {!loading && !error && filteredMessages.length === 0 && <p className="dashboard-empty-copy">No messages yet.</p>}
          {!loading && !error && filteredMessages.length > 0 && <MessageList messages={filteredMessages} selectedId={selectedMessage?.id || ''} onSelect={(message) => {
            setSelectedId(message.id);
            if (message.unread) {
              markMessageRead(message.id)
                .then(() => setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, unread: false } : item))))
                .catch((readError) => {
                  if (import.meta.env.DEV) {
                    console.error('Message read update failed:', readError);
                  }
                });
            }
          }} />}
        </SectionCard>

        <SectionCard title="Message Detail" subtitle="Full communication record">
          {selectedMessage ? <MessageDetailPanel message={selectedMessage} onReply={() => setCompose({ to: selectedMessage.senderRole, subject: `Re: ${selectedMessage.subject}` })} /> : <p className="dashboard-empty-copy">Select a message when one is available.</p>}
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions">
        <div className="student-quick-actions">
          <DashboardActionMenu
            primaryAction={{ label: 'Message Teacher', icon: <Icon name="teacher" size={15} />, onClick: () => setCompose({ to: 'Teacher', subject: 'Question for teacher' }) }}
            actions={[
              { label: 'Contact Academy Team', icon: <Icon name="support" size={15} />, onClick: () => setCompose({ to: 'Academy Team', subject: 'Academy support request' }) },
              { label: 'Ask about Schedule', icon: <Icon name="calendar" size={15} />, onClick: () => setCompose({ to: 'Scheduling Team', subject: 'Schedule question' }) },
              { label: 'Ask about Payment', icon: <Icon name="award" size={15} />, onClick: () => setCompose({ to: 'Finance Team', subject: 'Payment question' }) },
            ]}
          />
        </div>
      </SectionCard>
    </div>
  );
}
