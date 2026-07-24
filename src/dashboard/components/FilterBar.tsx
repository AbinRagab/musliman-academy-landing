import type { ReactNode } from 'react';

export default function FilterBar({
  search,
  onSearchChange,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="dashboard-filters dashboard-filters--inline">
      <label>
        <span>Search</span>
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search records" />
      </label>
      {children}
    </div>
  );
}
