import Icon from '../../../components/Icon';
import ActionButton from '../ActionButton';
import StatusBadge from '../StatusBadge';
import { openExternalLink, type StudentClassSession } from '../../services/studentService';
import { StudentModal } from './StudentPortalComponents';

export default function ClassDetailsModal({
  classSession,
  onClose,
}: {
  classSession: StudentClassSession;
  onClose: () => void;
}) {
  return (
    <StudentModal title="Class Details" onClose={onClose} footer={<ActionButton onClick={onClose}>Close</ActionButton>}>
      <div className="student-info-grid">
        <span>Class <strong>{classSession.title}</strong></span>
        <span>Teacher <strong>{classSession.teacher}</strong></span>
        <span>Date/time <strong>{classSession.date} {classSession.time}</strong></span>
        <span>Platform <strong>{classSession.platform}</strong></span>
        <span>Status <strong><StatusBadge label={classSession.status} /></strong></span>
        <span>Timezone <strong>{classSession.timezone}</strong></span>
        <span>Meeting link <strong>{classSession.meetingLink || 'Not available'}</strong></span>
        <span>Notes <strong>{classSession.teacherNotes || classSession.lessonCovered || 'No notes published yet'}</strong></span>
      </div>
      {classSession.meetingLink && (
        <ActionButton onClick={() => openExternalLink(classSession.meetingLink)}>
          <Icon name="video" size={16} />
          Join Class
        </ActionButton>
      )}
    </StudentModal>
  );
}
