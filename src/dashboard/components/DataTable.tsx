import type { ReactNode } from 'react';

export type DataTableColumn<T> = {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
};

type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  className?: string;
  tableClassName?: string;
};

function getColumnClassName(header: string) {
  const normalized = header.trim().toLowerCase();

  if (normalized === 'action' || normalized === 'actions' || normalized.includes('receipt')) {
    return 'actions-cell';
  }

  if (normalized.includes('status') || normalized.includes('attendance') || normalized.includes('report')) {
    return 'status-cell';
  }

  if (normalized.includes('time') || normalized.includes('date') || normalized.includes('scheduled')) {
    return 'time-cell';
  }

  if (['level', 'currency', 'amount', 'period', 'metric', 'trials', 'students'].includes(normalized)) {
    return 'compact-cell';
  }

  return '';
}

export default function DataTable<T>({ columns, rows, getRowKey, className = '', tableClassName = '' }: DataTableProps<T>) {
  return (
    <div className={`dashboard-table-card dashboard-table-wrapper dashboard-table-wrap ${className}`.trim()}>
      <table className={`dashboard-table ${tableClassName}`.trim()}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} className={getColumnClassName(column.header)}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((column) => {
                const className = getColumnClassName(column.header);
                const content = typeof column.accessor === 'function' ? column.accessor(row) : String(row[column.accessor] ?? '');

                return (
                  <td key={column.header} className={className}>
                    {className === 'actions-cell' ? <div className="action-cell-inner">{content}</div> : <div className="truncate-text">{content}</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
