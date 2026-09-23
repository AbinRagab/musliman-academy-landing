import Icon from '../../components/Icon';
import ProgressBar from './ProgressBar';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

export default function EvaluationCard({
  title,
  score,
  note,
}: {
  title: string;
  score: number;
  note: string;
}) {
  const { t } = useDashboardLanguage();

  return (
    <article className="dashboard-evaluation-card">
      <div>
        <Icon name="star" />
        <h3>{t(title)}</h3>
      </div>
      <ProgressBar value={score} label="Completion" />
      <p>{t(note)}</p>
    </article>
  );
}
