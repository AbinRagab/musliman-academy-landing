import Icon from '../../components/Icon';
import ActionButton from './ActionButton';
import StatusBadge from './StatusBadge';

export type ScheduleItem = {
  time: string;
  title: string;
  meta: string;
  status: string;
  platform?: string;
};

export default function ScheduleCard({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="dashboard-schedule-list">
      {items.map((item) => (
        <article className="dashboard-schedule-card" key={`${item.time}-${item.title}`}>
          <div className="dashboard-schedule-card__time">{item.time}</div>
          <div>
            <h3>{item.title}</h3>
            <p>{item.meta}</p>
            {item.platform && <small><Icon name="video" size={14} /> {item.platform}</small>}
          </div>
          <StatusBadge label={item.status} />
          <ActionButton variant="secondary">Open</ActionButton>
        </article>
      ))}
    </div>
  );
}
