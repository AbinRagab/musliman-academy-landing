import { useState } from 'react';
import Icon from '../../../components/Icon';
import ActionButton from '../ActionButton';
import DashboardActionMenu from '../DashboardActionMenu';
import StatusBadge from '../StatusBadge';
import {
  openExternalLink,
  resolveCurrentStudentProfile,
  type StudentClassSession,
  type StudentHomeworkItem,
} from '../../services/studentService';
import { uploadHomeworkSubmission } from '../../services/studentHomeworkService';
import { EmptyState, StudentModal } from './StudentPortalComponents';
import { DashboardText, useDashboardLanguage } from '../../i18n/DashboardLanguageProvider';

export default function HomeworkDetailsModal({
  classSession,
  homework,
  onClose,
}: {
  classSession: StudentClassSession;
  homework: StudentHomeworkItem | null;
  onClose: () => void;
}) {
  const { t } = useDashboardLanguage();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  return (
    <>
      <StudentModal title="Homework Details" onClose={onClose} footer={<ActionButton onClick={onClose}><DashboardText>Close</DashboardText></ActionButton>}>
        {homework ? (
          <>
            <div className="student-info-grid">
              <span><DashboardText>Homework title</DashboardText> <strong>{homework.title}</strong></span>
              <span><DashboardText>Class name</DashboardText> <strong>{homework.relatedClass}</strong></span>
              <span><DashboardText>Teacher</DashboardText> <strong>{homework.teacher}</strong></span>
              <span><DashboardText>Due date</DashboardText> <strong>{homework.dueDate}</strong></span>
              <span><DashboardText>Attachment / material</DashboardText> <strong>{homework.attachmentUrl || t('No attachment published')}</strong></span>
              <span><DashboardText>Submission status</DashboardText> <strong><StatusBadge label={homework.status} /></strong></span>
              <span><DashboardText>Teacher feedback</DashboardText> <strong>{homework.teacherFeedback || t('No feedback published yet')}</strong></span>
            </div>
            <p className="student-modal-copy">{homework.instructions}</p>
            <div className="student-card-actions">
              <DashboardActionMenu
                primaryAction={{
                  label: homework.status === 'pending' || homework.status === 'overdue' ? 'Upload Homework' : 'Download Attachment',
                  icon: <Icon name={homework.status === 'pending' || homework.status === 'overdue' ? 'document' : 'download'} size={15} />,
                  onClick: homework.status === 'pending' || homework.status === 'overdue' ? () => setIsUploadOpen(true) : () => openExternalLink(homework.attachmentUrl),
                  disabled: !(homework.status === 'pending' || homework.status === 'overdue') && !homework.attachmentUrl,
                }}
                actions={[
                  { label: 'Download Attachment', icon: <Icon name="download" size={15} />, onClick: () => openExternalLink(homework.attachmentUrl), hidden: !homework.attachmentUrl || homework.status === 'pending' || homework.status === 'overdue' },
                  { label: 'Upload Homework', icon: <Icon name="document" size={15} />, onClick: () => setIsUploadOpen(true), hidden: !(homework.status === 'pending' || homework.status === 'overdue') },
                ]}
              />
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
          description="Upload a homework file privately to your teacher."
          onClose={() => setIsUploadOpen(false)}
          footer={(
            <>
              <ActionButton type="submit" form="homework-details-upload-form" disabled={uploading}>{uploading ? 'Uploading' : 'Submit Homework'}</ActionButton>
              <ActionButton variant="secondary" onClick={() => setIsUploadOpen(false)}><DashboardText>Close</DashboardText></ActionButton>
            </>
          )}
        >
          <form
            id="homework-details-upload-form"
            className="dashboard-form"
            onSubmit={(event) => {
              event.preventDefault();
              setUploadError('');
              setUploadSuccess('');
              const formData = new FormData(event.currentTarget);
              const file = formData.get('file');

              if (!(file instanceof File) || !file.name) {
                setUploadError('Choose a homework file before submitting.');
                return;
              }

              setUploading(true);
              resolveCurrentStudentProfile()
                .then((profile) => uploadHomeworkSubmission({
                  studentId: profile.id,
                  classId: homework.classId || classSession.id,
                  file,
                  note: String(formData.get('note') || ''),
                }))
                .then(() => {
                  setUploadSuccess('Homework submitted successfully.');
                })
                .catch((error: unknown) => {
                  setUploadError(error instanceof Error ? error.message : 'Homework upload failed. Please try again.');
                })
                .finally(() => setUploading(false));
            }}
          >
            <div className="student-info-grid">
              <span><DashboardText>Homework</DashboardText> <strong>{homework.title}</strong></span>
              <span><DashboardText>Related class</DashboardText> <strong>{classSession.title}</strong></span>
            </div>
            <label>
              <span><DashboardText>Upload file</DashboardText></span>
              <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.mp3,.mp4,.doc,.docx,application/pdf,image/jpeg,image/png,audio/mpeg,video/mp4,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
            </label>
            <label><span><DashboardText>Note to teacher</DashboardText></span><textarea name="note" rows={4} /></label>
            {uploadError && <p className="student-form-error">{t(uploadError)}</p>}
            {uploadSuccess && <p className="student-form-success">{t(uploadSuccess)}</p>}
          </form>
        </StudentModal>
      )}
    </>
  );
}
