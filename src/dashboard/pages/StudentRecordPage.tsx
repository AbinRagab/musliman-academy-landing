import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { useAuth } from '../auth/AuthProvider';
import ActionButton from '../components/ActionButton';
import DashboardPageHeader from '../components/DashboardPageHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { type ToastMessage } from '../components/Toast';
import {
  canEditStudentField,
  fetchStudentRecord,
  studentRecordTabs,
  updateStudentAcademicSetup,
  updateStudentPersonalInfo,
  updateStudentPreferences,
  type StudentRecord,
  type StudentRecordField,
  type StudentRecordOwner,
  type StudentRecordSection,
  type StudentRecordTab,
} from '../services/studentsService';
import { addClassReport, addEvaluation, markAttendance, submitTrialFeedback } from '../services/teacherStudentService';
import { updateStudentPayment } from '../services/paymentsService';

const ownershipLabel: Record<StudentRecordOwner, string> = {
  Admin: 'Managed by Admin',
  Teacher: 'Added by Teacher',
  Finance: 'Finance Only',
  Student: 'Editable by Student',
  System: 'Calculated by System',
};

function ownerClass(owner: StudentRecordOwner) {
  return owner.toLowerCase();
}

function FieldControl({
  field,
  editable,
  value,
  onChange,
}: {
  field: StudentRecordField;
  editable: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  if (!editable) {
    return <strong>{value}</strong>;
  }

  if (field.input === 'textarea') {
    return <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} />;
  }

  return <input type={field.input || 'text'} value={value} onChange={(event) => onChange(event.target.value)} />;
}

function FieldGrid({
  fields,
  values,
  onChange,
  role,
}: {
  fields: StudentRecordField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  role: ReturnType<typeof useAuth>['role'];
}) {
  return (
    <div className="student-record-fields">
      {fields.map((field) => {
        const editable = canEditStudentField(role, field);

        return (
          <label className={editable ? 'is-editable' : 'is-readonly'} key={field.key}>
            <span>
              {field.label}
              <em>{editable ? 'Editable' : 'View only'}</em>
            </span>
            <FieldControl field={field} editable={editable} value={values[field.key] ?? field.value} onChange={(value) => onChange(field.key, value)} />
          </label>
        );
      })}
    </div>
  );
}

export default function StudentRecordPage({
  portalRole,
  initialTab = 'overview',
}: {
  portalRole: 'admin' | 'teacher' | 'student';
  initialTab?: StudentRecordTab;
}) {
  const { studentId } = useParams();
  const { role } = useAuth();
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<StudentRecordTab>(initialTab);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetchStudentRecord(studentId || 'mock-yusuf').then((studentRecord) => {
      setRecord(studentRecord);
      const nextDrafts: Record<string, Record<string, string>> = {};
      Object.entries(studentRecord.sections).forEach(([tab, sections]) => {
        sections.forEach((section) => {
          nextDrafts[`${tab}:${section.id}`] = Object.fromEntries(section.fields.map((field) => [field.key, field.value]));
        });
      });
      setDrafts(nextDrafts);
    });
  }, [studentId]);

  const visibleTabs = useMemo(() => {
    if (portalRole === 'student') {
      return studentRecordTabs.filter((tab) => !['payments'].includes(tab.id));
    }

    if (portalRole === 'teacher') {
      return studentRecordTabs.filter((tab) => ['overview', 'classes', 'attendance', 'homework', 'evaluations', 'teacher-notes', 'progress'].includes(tab.id));
    }

    return studentRecordTabs;
  }, [portalRole]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'overview');
    }
  }, [activeTab, visibleTabs]);

  if (!record) {
    return (
      <div className="dashboard-page dashboard-page--management dashboard-page--student-record">
        <DashboardPageHeader
          eyebrow={portalRole === 'teacher' ? 'TEACHER STUDENT RECORD' : portalRole === 'student' ? 'STUDENT PORTAL' : 'STUDENT MANAGEMENT'}
          title="Student Record"
          subtitle="Loading role-based student record sections."
        />
        <DashboardSkeleton cards={4} rows={6} label="Loading student record data" />
      </div>
    );
  }

  const currentRecord = record;
  const sections = currentRecord.sections[activeTab] || [];

  function updateDraft(section: StudentRecordSection, key: string, value: string) {
    setDrafts((current) => ({
      ...current,
      [`${activeTab}:${section.id}`]: {
        ...(current[`${activeTab}:${section.id}`] || {}),
        [key]: value,
      },
    }));
  }

  async function handleSectionSave(event: FormEvent<HTMLFormElement>, section: StudentRecordSection) {
    event.preventDefault();
    const payload = drafts[`${activeTab}:${section.id}`] || {};

    if (section.owner === 'Admin' && section.id.includes('personal')) {
      await updateStudentPersonalInfo(currentRecord.id, payload);
    } else if (section.owner === 'Admin') {
      await updateStudentAcademicSetup(currentRecord.id, payload);
    } else if (section.owner === 'Teacher' && activeTab === 'trial') {
      await submitTrialFeedback({
        trialId: 'mock-trial',
        readingLevel: payload.reading_level || '',
        tajweedLevel: payload.tajweed_level || '',
        arabicLevel: payload.arabic_level,
        engagement: payload.student_engagement || '',
        recommendedLevel: payload.recommended_level || '',
        teacherFeedback: payload.teacher_feedback || '',
        recommendation: payload.recommendation || '',
        result: payload.trial_result || '',
      });
    } else if (section.owner === 'Teacher' && activeTab === 'attendance') {
      await markAttendance({ studentId: currentRecord.id, status: 'present', notes: payload.class_notes });
    } else if (section.owner === 'Teacher' && ['classes', 'homework', 'teacher-notes'].includes(activeTab)) {
      await addClassReport({
        studentId: currentRecord.id,
        lessonCovered: payload.lesson_covered || '',
        homework: payload.homework,
        classNotes: payload.class_notes || payload.teacher_note || payload.homework_feedback,
        participation: payload.participation,
        nextLessonPlan: payload.next_lesson_plan,
      });
    } else if (section.owner === 'Teacher') {
      await addEvaluation({
        studentId: currentRecord.id,
        recitationRating: Number.parseInt(payload.recitation_rating || '0', 10) || 0,
        tajweedRating: Number.parseInt(payload.tajweed_rating || '0', 10) || 0,
        understandingRating: Number.parseInt(payload.understanding_rating || '0', 10) || 0,
        behaviorRating: Number.parseInt(payload.behavior_rating || '0', 10) || 0,
        progressNotes: payload.progress_notes,
        recommendation: payload.teacher_recommendation,
      });
    } else if (section.owner === 'Finance') {
      await updateStudentPayment({ studentId: currentRecord.id, ...payload });
    } else if (section.owner === 'Student') {
      await updateStudentPreferences(currentRecord.id, payload);
    }

    setToast({ type: 'success', message: `${section.title} saved.` });
  }

  return (
    <div className="dashboard-page dashboard-page--management dashboard-page--student-record">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardPageHeader
        eyebrow={portalRole === 'teacher' ? 'TEACHER STUDENT RECORD' : portalRole === 'student' ? 'STUDENT PORTAL' : 'STUDENT MANAGEMENT'}
        title="Student Record"
        subtitle="Central role-based record for personal data, academic setup, teacher input, payments, messages, and preferences."
        action={(
          <ActionButton
            variant="secondary"
            onClick={() => setToast({
              type: 'info',
              message: portalRole === 'student'
                ? 'Contact update requests are sent to the academy team. Academic, attendance, evaluation, and payment fields remain view-only.'
                : 'Role-based access is active for this student record.',
            })}
          >
            <Icon name={portalRole === 'student' ? 'send' : 'shieldCheck'} size={17} />
            {portalRole === 'student' ? 'Request Update' : 'Role-based access'}
          </ActionButton>
        )}
      />

      <SectionCard className="student-record-summary">
        <div className="student-record-summary__identity">
          <div className="student-avatar-large">{currentRecord.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
          <div>
            <h2>{currentRecord.name}</h2>
            <p>{currentRecord.program} - {currentRecord.level}</p>
            <StatusBadge label={currentRecord.status} />
          </div>
        </div>
        <div className="dashboard-stats-grid dashboard-stats-grid--record">
          <StatCard label="Assigned Teacher" value={currentRecord.teacher.replace('Ust. ', '')} trend={currentRecord.teacher} icon="teacher" />
          <StatCard label="Next Class" value={currentRecord.nextClass} trend="Calculated by schedule" icon="calendar" />
          <StatCard label="Attendance" value={currentRecord.attendanceRate} trend="Calculated by system" icon="clipboard" />
          <StatCard label="Progress" value={currentRecord.progressPercentage} trend="From evaluations" icon="chart" />
        </div>
      </SectionCard>

      <div className="student-record-tabs" role="tablist" aria-label="Student record sections">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="student-record-sections">
        {sections.map((section) => {
          const sectionKey = `${activeTab}:${section.id}`;
          const canSave = section.fields.some((field) => canEditStudentField(role, field));

          return (
            <SectionCard
              key={section.id}
              className="student-record-section"
              title={section.title}
              subtitle={section.description}
              action={<span className={`student-owner-badge student-owner-badge--${ownerClass(section.owner)}`}>{ownershipLabel[section.owner]}</span>}
            >
              <form onSubmit={(event) => handleSectionSave(event, section)}>
                <FieldGrid fields={section.fields} values={drafts[sectionKey] || {}} onChange={(key, value) => updateDraft(section, key, value)} role={role} />
                {canSave ? (
                  <div className="dashboard-form-actions">
                    <ActionButton type="submit" variant="copper">Save {section.title}</ActionButton>
                  </div>
                ) : (
                  <p className="student-record-readonly">View only for your role.</p>
                )}
              </form>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
