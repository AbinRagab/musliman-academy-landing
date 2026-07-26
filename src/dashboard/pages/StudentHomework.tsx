import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import SectionCard from '../components/SectionCard';
import {
  EmptyState,
  HomeworkCard,
  StudentModal,
  StudentPageHeader,
  StudentStatCard,
  StudentTabs,
} from '../components/student/StudentPortalComponents';
import { fetchStudentHomeworkData, uploadHomeworkSubmission } from '../services/studentHomeworkService';
import { type StudentHomeworkItem } from '../services/studentService';

const homeworkTabs = ['Pending', 'Submitted', 'Reviewed', 'Overdue'] as const;
type HomeworkTab = (typeof homeworkTabs)[number];

export default function StudentHomework() {
  const [homework, setHomework] = useState<StudentHomeworkItem[]>([]);
  const [activeTab, setActiveTab] = useState<HomeworkTab>('Pending');
  const [selectedHomework, setSelectedHomework] = useState<StudentHomeworkItem | null>(null);
  const [modalMode, setModalMode] = useState<'upload' | 'instructions' | 'feedback' | null>(null);

  useEffect(() => {
    fetchStudentHomeworkData().then((data) => setHomework(data.homework));
  }, []);

  const summary = useMemo(() => ({
    pending: homework.filter((item) => item.status === 'pending').length,
    submitted: homework.filter((item) => item.status === 'submitted').length,
    reviewed: homework.filter((item) => item.status === 'reviewed').length,
    latestFeedback: homework.find((item) => item.teacherFeedback)?.teacherFeedback || 'No reviewed homework yet',
  }), [homework]);

  const visibleHomework = homework.filter((item) => item.status === activeTab.toLowerCase());

  return (
    <div className="dashboard-page dashboard-page--management">
      {selectedHomework && modalMode === 'upload' && (
        <StudentModal
          title="Upload Homework"
          description="File upload UI is prepared. When storage is enabled, this will submit the selected file to the teacher."
          onClose={() => setModalMode(null)}
          footer={<ActionButton type="submit" form="student-homework-upload-form">Submit Homework</ActionButton>}
        >
          <form
            id="student-homework-upload-form"
            className="dashboard-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const file = formData.get('file');
              uploadHomeworkSubmission({
                homeworkId: selectedHomework.id,
                fileName: file instanceof File ? file.name : undefined,
                note: String(formData.get('note') || ''),
              }).then(() => setModalMode(null));
            }}
          >
            <label>
              <span>Homework</span>
              <input readOnly value={selectedHomework.title} />
            </label>
            <label>
              <span>Upload file</span>
              <input name="file" type="file" />
            </label>
            <label>
              <span>Note to teacher</span>
              <textarea name="note" rows={4} placeholder="Add a short note..." />
            </label>
          </form>
        </StudentModal>
      )}
      {selectedHomework && modalMode === 'instructions' && (
        <StudentModal title="Homework Instructions" onClose={() => setModalMode(null)} footer={<ActionButton onClick={() => setModalMode(null)}>Close</ActionButton>}>
          <div className="student-info-grid">
            <span>Homework <strong>{selectedHomework.title}</strong></span>
            <span>Due date <strong>{selectedHomework.dueDate}</strong></span>
            <span>Related class <strong>{selectedHomework.relatedClass}</strong></span>
            <span>Teacher <strong>{selectedHomework.teacher}</strong></span>
          </div>
          <p className="student-modal-copy">{selectedHomework.instructions}</p>
        </StudentModal>
      )}
      {selectedHomework && modalMode === 'feedback' && (
        <StudentModal title="Teacher Feedback" onClose={() => setModalMode(null)} footer={<ActionButton onClick={() => setModalMode(null)}>Close</ActionButton>}>
          <p className="student-modal-copy">{selectedHomework.teacherFeedback || 'Teacher feedback has not been published yet.'}</p>
        </StudentModal>
      )}

      <StudentPageHeader title="Homework Center" subtitle="Pending homework, uploads, submissions, and teacher feedback." />

      <div className="dashboard-stats-grid">
        <StudentStatCard label="Pending Homework" value={summary.pending} trend="Needs upload or completion" icon="document" />
        <StudentStatCard label="Submitted" value={summary.submitted} trend="Waiting for review" icon="checkCircle" />
        <StudentStatCard label="Reviewed" value={summary.reviewed} trend="Teacher feedback available" icon="star" />
        <StudentStatCard label="Latest Feedback" value={summary.latestFeedback === 'No reviewed homework yet' ? 'None' : 'Ready'} trend={summary.latestFeedback} icon="message" />
      </div>

      <StudentTabs tabs={homeworkTabs} activeTab={activeTab} onChange={setActiveTab} />

      <SectionCard title={`${activeTab} Homework`} subtitle="Homework is connected to class records and teacher feedback.">
        <div className="student-card-list">
          {visibleHomework.length ? visibleHomework.map((item) => (
            <HomeworkCard
              key={item.id}
              homework={item}
              onUpload={(nextItem) => {
                setSelectedHomework(nextItem);
                setModalMode('upload');
              }}
              onViewInstructions={(nextItem) => {
                setSelectedHomework(nextItem);
                setModalMode('instructions');
              }}
              onViewFeedback={(nextItem) => {
                setSelectedHomework(nextItem);
                setModalMode('feedback');
              }}
            />
          )) : <EmptyState title={`No ${activeTab.toLowerCase()} homework`} description="Homework will appear here when your teacher assigns or reviews it." />}
        </div>
      </SectionCard>
    </div>
  );
}
