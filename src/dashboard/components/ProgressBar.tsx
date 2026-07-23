export default function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="dashboard-progress" aria-label={label || `Progress ${value}%`}>
      <div className="dashboard-progress__top">
        {label && <span>{label}</span>}
        <strong>{value}%</strong>
      </div>
      <div className="dashboard-progress__track">
        <span style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
      </div>
    </div>
  );
}
