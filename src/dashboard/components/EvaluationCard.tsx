import Icon from '../../components/Icon';
import ProgressBar from './ProgressBar';

export default function EvaluationCard({
  title,
  score,
  note,
}: {
  title: string;
  score: number;
  note: string;
}) {
  return (
    <article className="dashboard-evaluation-card">
      <div>
        <Icon name="star" />
        <h3>{title}</h3>
      </div>
      <ProgressBar value={score} label="Completion" />
      <p>{note}</p>
    </article>
  );
}
