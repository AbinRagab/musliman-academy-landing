import type { LeadType } from '../services/leadsService';

const labels: Record<LeadType, string> = {
  student: 'Student Lead',
  teacher_training: 'Teacher Training',
};

export default function LeadTypeBadge({ type }: { type?: LeadType | null }) {
  const normalized = type === 'teacher_training' ? 'teacher_training' : 'student';

  return (
    <span className={`lead-type-badge lead-type-badge--${normalized}`}>
      {labels[normalized]}
    </span>
  );
}
