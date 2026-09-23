import Icon from '../../../components/Icon';
import ActionButton from '../ActionButton';
import StatusBadge from '../StatusBadge';
import { openExternalLink, type StudentClassSession } from '../../services/studentService';
import { StudentModal } from './StudentPortalComponents';
import { DashboardText, useDashboardLanguage } from '../../i18n/DashboardLanguageProvider';

export default function ClassDetailsModal({
  classSession,
  onClose,
}: {
  classSession: StudentClassSession;
  onClose: () => void;
}) {
  const { t } = useDashboardLanguage();

  return (
    <StudentModal title="Class Details" onClose={onClose} footer={<ActionButton onClick={onClose}><DashboardText>Close</DashboardText></ActionButton>}>
      <div className="student-info-grid">
        <span><DashboardText>Class</DashboardText> <strong>{classSession.title}</strong></span>
        <span><DashboardText>Teacher</DashboardText> <strong>{classSession.teacher}</strong></span>
        <span><DashboardText>Date/time</DashboardText> <strong>{classSession.date} {classSession.time}</strong></span>
        <span><DashboardText>Platform</DashboardText> <strong>{classSession.platform}</strong></span>
        <span><DashboardText>Status</DashboardText> <strong><StatusBadge label={classSession.status} /></strong></span>
        <span><DashboardText>Timezone</DashboardText> <strong>{classSession.timezone}</strong></span>
        <span><DashboardText>Meeting link</DashboardText> <strong>{classSession.meetingLink || t('Not available')}</strong></span>
        <span><DashboardText>Notes</DashboardText> <strong>{classSession.teacherNotes || classSession.lessonCovered || t('No notes published yet')}</strong></span>
      </div>
      {classSession.meetingLink && (
        <ActionButton onClick={() => openExternalLink(classSession.meetingLink)}>
          <Icon name="video" size={16} />
          <DashboardText>Join Class</DashboardText>
        </ActionButton>
      )}
    </StudentModal>
  );
}
