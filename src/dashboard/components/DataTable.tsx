import type { ReactNode } from 'react';
import { useDashboardLanguage } from '../i18n/DashboardLanguageProvider';

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
  const { t } = useDashboardLanguage();
  const actionColumn = columns.find((column) => getColumnClassName(column.header) === 'actions-cell');
  const displayColumns = columns.filter((column) => getColumnClassName(column.header) !== 'actions-cell');

  function renderCell(column: DataTableColumn<T>, row: T) {
    if (typeof column.accessor === 'function') return column.accessor(row);
    const value = row[column.accessor];
    return typeof value === 'string' ? t(value) : String(value ?? '');
  }

  return (
    <div className={`dashboard-table-card dashboard-table-wrapper dashboard-table-wrap ${className}`.trim()}>
      <table className={`dashboard-table ${tableClassName}`.trim()}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} className={getColumnClassName(column.header)}>{t(column.header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((column) => {
                const columnClassName = getColumnClassName(column.header);
                const content = renderCell(column, row);

                return (
                  <td key={column.header} className={columnClassName}>
                    {columnClassName === 'actions-cell' ? <div className="action-cell-inner">{content}</div> : <div className="truncate-text">{content}</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="dashboard-mobile-records" aria-label={t('Records')}>
        {rows.map((row, rowIndex) => {
          const rowKey = getRowKey(row, rowIndex);
          const titleColumn = displayColumns[0];
          const subtitleColumn = displayColumns[1];
          const statusColumn = displayColumns.find((column) => getColumnClassName(column.header) === 'status-cell');
          const fieldColumns = displayColumns
            .filter((column) => column !== titleColumn && column !== subtitleColumn && column !== statusColumn)
            .slice(0, 4);

          return (
            <article className="dashboard-mobile-record-card" key={rowKey}>
              <div className="dashboard-mobile-record-card__header">
                <div>
                  {titleColumn && <div className="dashboard-mobile-record-card__title">{renderCell(titleColumn, row)}</div>}
                  {subtitleColumn && <div className="dashboard-mobile-record-card__subtitle"><span>{t(subtitleColumn.header)}</span>{renderCell(subtitleColumn, row)}</div>}
                </div>
                {statusColumn && <div className="dashboard-mobile-record-card__status">{renderCell(statusColumn, row)}</div>}
              </div>
              {fieldColumns.length > 0 && (
                <dl className="dashboard-mobile-record-card__fields">
                  {fieldColumns.map((column) => (
                    <div key={column.header}>
                      <dt>{t(column.header)}</dt>
                      <dd>{renderCell(column, row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {actionColumn && <div className="dashboard-mobile-record-card__actions">{renderCell(actionColumn, row)}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
