import { useState } from 'react';
import Icon from '../../../components/Icon';
import ActionButton from '../ActionButton';
import StatusBadge from '../StatusBadge';
import {
  openExternalLink,
  type StudentClassSession,
  type StudentHomeworkItem,
} from '../../services/studentService';
import { EmptyState, StudentModal } from './StudentPortalComponents';

export default function HomeworkDetailsModal({
  classSession,
  homework,
  onClose,
}: {
  classSession: StudentClassSession;
  homework: StudentHomeworkItem | null;
  onClose: () => void;
}) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <>
      <StudentModal title="Homework Details" onClose={onClose} footer={<ActionButton onClick={onClose}>Close</ActionButton>}>
        {homework ? (
          <>
            <div className="student-info-grid">
              <span>Homework title <strong>{homework.title}</strong></span>
              <span>Class name <strong>{homework.relatedClass}</strong></span>
              <span>Teacher <strong>{homework.teacher}</strong></span>
              <span>Due date <strong>{homework.dueDate}</strong></span>
              <span>Attachment / material <strong>{homework.attachmentUrl || 'No attachment published'}</strong></span>
              <span>Submission status <strong><StatusBadge label={homework.status} /></strong></span>
              <span>Teacher feedback <strong>{homework.teacherFeedback || 'No feedback published yet'}</strong></span>
            </div>
            <p className="student-modal-copy">{homework.instructions}</p>
            <div className="student-card-actions">
              {homework.attachmentUrl && (
                <ActionButton variant="secondary" onClick={() => openExternalLink(homework.attachmentUrl)}>
                  <Icon name="download" size={16} />
                  Download Attachment
                </ActionButton>
              )}
              {(homework.status === 'pending' || homework.status === 'overdue') && (
                <ActionButton onClick={() => setIsUploadOpen(true)}>
                  <Icon name="document" size={16} />
                  Upload Homework
                </ActionButton>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            title="No homework assigned"
            description="No homework assigned for this class yet."
          />
        )}
      </StudentModal>

      {isUploadOpen && homework && (
        <StudentModal
          title="Upload Homework"
          description="Homework upload is prepared. Storage submission will be connected when the backend workflow is enabled."
          onClose={() => setIsUploadOpen(false)}
          footer={<ActionButton onClick={() => setIsUploadOpen(false)}>Close</ActionButton>}
        >
          <div className="student-info-grid">
            <span>Homework <strong>{homework.title}</strong></span>
            <span>Related class <strong>{classSession.title}</strong></span>
          </div>
          <p className="student-modal-copy">Use the Homework Center upload flow for now, or contact the academy team if you need help submitting this assignment.</p>
        </StudentModal>
      )}
    </>
  );
}
