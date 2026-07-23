export default function CalendarMiniCard({ month, day, label }: { month: string; day: string; label: string }) {
  return (
    <div className="dashboard-calendar-mini">
      <span>{month}</span>
      <strong>{day}</strong>
      <small>{label}</small>
    </div>
  );
}
