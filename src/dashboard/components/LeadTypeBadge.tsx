import type { LeadType } from '../services/leadsService';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

const labels: Record<LeadType, string> = {
  student: 'Student Lead',
  teacher_training: 'Teacher Training',
};

export default function LeadTypeBadge({ type }: { type?: LeadType | null }) {
  const { t } = useDashboardLanguage();
  const normalized = type === 'teacher_training' ? 'teacher_training' : 'student';

  return <span className={`lead-type-badge lead-type-badge--${normalized}`}>{t(labels[normalized])}</span>;
}
