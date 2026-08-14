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
import { getSignedFileUrl, HOMEWORK_BUCKET } from '../services/storageService';
import { resolveCurrentStudentProfile, type StudentHomeworkItem, type StudentPortalProfile } from '../services/studentService';

const homeworkTabs = ['Pending', 'Submitted', 'Reviewed', 'Overdue'] as const;
type HomeworkTab = (typeof homeworkTabs)[number];

export default function StudentHomework() {
  const [homework, setHomework] = useState<StudentHomeworkItem[]>([]);
  const [profile, setProfile] = useState<StudentPortalProfile | null>(null);
  const [activeTab, setActiveTab] = useState<HomeworkTab>('Pending');
  const [selectedHomework, setSelectedHomework] = useState<StudentHomeworkItem | null>(null);
  const [modalMode, setModalMode] = useState<'upload' | 'instructions' | 'feedback' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [fileViewError, setFileViewError] = useState('');

  useEffect(() => {
    Promise.all([resolveCurrentStudentProfile(), fetchStudentHomeworkData()]).then(([studentProfile, data]) => {
      setProfile(studentProfile);
      setHomework(data.homework);
    });
  }, []);

  async function refreshHomework() {
    const data = await fetchStudentHomeworkData();
    setHomework(data.homework);
  }

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
          description="Upload a homework file privately to your teacher."
          onClose={() => setModalMode(null)}
          footer={(
            <ActionButton type="submit" form="student-homework-upload-form" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Submit Homework'}
            </ActionButton>
          )}
        >
          <form
            id="student-homework-upload-form"
            className="dashboard-form"
            onSubmit={(event) => {
              event.preventDefault();
              setUploadError('');
              const formData = new FormData(event.currentTarget);
              const file = formData.get('file');
              const classId = String(formData.get('classId') || selectedHomework.classId || '');

              if (!profile || profile.id.startsWith('mock')) {
                setUploadError('A connected student record is required before homework files can be uploaded.');
                return;
              }

              if (!classId) {
                setUploadError('Select the homework or class for this upload.');
                return;
              }

              if (!(file instanceof File) || !file.name) {
                setUploadError('Choose a homework file before submitting.');
                return;
              }

              setIsUploading(true);
              uploadHomeworkSubmission({
                studentId: profile.id,
                classId,
                file,
                note: String(formData.get('note') || ''),
              })
                .then(() => refreshHomework())
                .then(() => setModalMode(null))
                .catch((error: unknown) => {
                  setUploadError(error instanceof Error ? error.message : 'Homework upload failed. Please try again.');
                })
                .finally(() => setIsUploading(false));
            }}
          >
            <label>
              <span>Homework / class</span>
              <select name="classId" defaultValue={selectedHomework.classId || ''} required>
                <option value="" disabled>Select homework or class</option>
                {homework.map((item) => (
                  <option key={item.id} value={item.classId || ''} disabled={!item.classId}>
                    {item.title} - {item.relatedClass}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Upload file</span>
              <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.mp3,.mp4,.doc,.docx,application/pdf,image/jpeg,image/png,audio/mpeg,video/mp4,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
            </label>
            <label>
              <span>Note to teacher</span>
              <textarea name="note" rows={4} placeholder="Add a short note..." />
            </label>
            {uploadError && <p className="student-form-error">{uploadError}</p>}
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
      {fileViewError && (
        <StudentModal title="File Unavailable" onClose={() => setFileViewError('')} footer={<ActionButton onClick={() => setFileViewError('')}>Close</ActionButton>}>
          <p className="student-modal-copy">{fileViewError}</p>
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
              onViewFile={(nextItem) => {
                if (nextItem.submissionUrl) {
                  window.open(nextItem.submissionUrl, '_blank', 'noopener,noreferrer');
                  return;
                }

                if (!nextItem.filePath) {
                  setFileViewError('No submitted file is attached to this homework yet.');
                  return;
                }

                getSignedFileUrl(HOMEWORK_BUCKET, nextItem.filePath)
                  .then((signedUrl) => window.open(signedUrl, '_blank', 'noopener,noreferrer'))
                  .catch((error: unknown) => {
                    setFileViewError(error instanceof Error ? error.message : 'Could not open this private homework file.');
                  });
              }}
            />
          )) : <EmptyState title={`No ${activeTab.toLowerCase()} homework`} description="Homework will appear here when your teacher assigns or reviews it." />}
        </div>
      </SectionCard>

      <SectionCard title="Submitted Homework Files" subtitle="Private files uploaded to Supabase Storage">
        <div className="student-card-list">
          {homework.filter((item) => item.filePath || item.submissionUrl).length ? homework.filter((item) => item.filePath || item.submissionUrl).map((item) => (
            <article className="student-homework-card" key={`submitted-file-${item.id}`}>
              <div className="student-homework-card__header">
                <div>
                  <h3>{item.fileName || item.title}</h3>
                  <p>{item.relatedClass} - {item.submittedAt || 'Upload date pending'}</p>
                </div>
                <span className="dashboard-status dashboard-status--success">{item.teacherFeedback ? 'reviewed' : item.status}</span>
              </div>
              <div className="student-info-grid student-info-grid--compact">
                <span>File type <strong>{item.fileType || '-'}</strong></span>
                <span>File size <strong>{item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB` : '-'}</strong></span>
                <span>Teacher feedback <strong>{item.teacherFeedback || 'No feedback yet'}</strong></span>
                <span>Notes <strong>{item.notes || 'No note added'}</strong></span>
              </div>
              <ActionButton
                variant="secondary"
                onClick={() => {
                  if (item.submissionUrl) {
                    window.open(item.submissionUrl, '_blank', 'noopener,noreferrer');
                    return;
                  }

                  if (!item.filePath) {
                    setFileViewError('No submitted file is attached to this homework yet.');
                    return;
                  }

                  getSignedFileUrl(HOMEWORK_BUCKET, item.filePath)
                    .then((signedUrl) => window.open(signedUrl, '_blank', 'noopener,noreferrer'))
                    .catch((error: unknown) => setFileViewError(error instanceof Error ? error.message : 'Could not open this private homework file.'));
                }}
              >
                <Icon name="eye" size={16} />
                View File
              </ActionButton>
            </article>
          )) : (
            <EmptyState title="No submitted files" description="Uploaded homework files will appear here after submission." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
