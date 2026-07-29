export default function DashboardSkeleton({
  rows = 5,
  cards = 0,
  label = 'Loading records',
}: {
  rows?: number;
  cards?: number;
  label?: string;
}) {
  return (
    <div className="dashboard-skeleton" aria-label={label} role="status">
      {cards > 0 && (
        <div className="dashboard-skeleton__cards">
          {Array.from({ length: cards }).map((_, index) => <span key={`card-${index}`} />)}
        </div>
      )}
      <div className="dashboard-skeleton__table">
        {Array.from({ length: rows }).map((_, index) => <span key={`row-${index}`} />)}
      </div>
    </div>
  );
}
