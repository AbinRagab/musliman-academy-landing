import ActionButton from './ActionButton';
import type { LeadRecord, TeacherOption } from '../services/leadsService';

export default function AssignTeacherModal({
  lead,
  teachers,
  selectedTeacherId,
  onSelectTeacher,
  onClose,
  onSave,
}: {
  lead: LeadRecord;
  teachers: TeacherOption[];
  selectedTeacherId: string;
  onSelectTeacher: (teacherId: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Assign teacher to ${lead.full_name}`}>
      <div className="dashboard-modal__panel">
        <div className="dashboard-card__header">
          <div>
            <h2>Assign Teacher</h2>
            <p>{lead.full_name} - {lead.programName}</p>
          </div>
          <ActionButton variant="ghost" onClick={onClose}>Close</ActionButton>
        </div>
        <div className="teacher-picker-list">
          {teachers.map((teacher) => (
            <label className="teacher-picker-card" key={teacher.id}>
              <input type="radio" name="teacher" checked={selectedTeacherId === teacher.id} onChange={() => onSelectTeacher(teacher.id)} />
              <span>
                <strong>{teacher.full_name}</strong>
                <small>{teacher.specialization}</small>
                <small>{teacher.languages?.join(', ')} - {teacher.availability}</small>
              </span>
              <em>{teacher.assignedStudents} students</em>
              <em>{teacher.activeTrialLoad} trials</em>
            </label>
          ))}
        </div>
        <div className="dashboard-form-actions">
          <ActionButton variant="copper" onClick={onSave}>Save Teacher</ActionButton>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
        </div>
      </div>
    </div>
  );
}
