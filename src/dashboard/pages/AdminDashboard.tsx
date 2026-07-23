import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import CalendarMiniCard from '../components/CalendarMiniCard';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { academyOperations, adminStats, recentClasses } from '../data/mockData';

type RecentClass = (typeof recentClasses)[number];

const classColumns: Array<DataTableColumn<RecentClass>> = [
  { header: 'Time', accessor: 'time' },
  { header: 'Class', accessor: 'className' },
  { header: 'Teacher', accessor: 'teacher' },
  { header: 'Students', accessor: 'students' },
  { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
  { header: 'Action', accessor: () => <ActionButton variant="ghost">View</ActionButton> },
];

export default function AdminDashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">Admin Overview</span>
          <h1>Academy Operations Dashboard</h1>
          <p>Monitor students, teachers, trials, classes, attendance, and reports from one control surface.</p>
        </div>
        <ActionButton>
          <Icon name="calendar" size={18} />
          Schedule Review
        </ActionButton>
      </div>

      <div className="dashboard-stats-grid">
        {adminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Operational Health" subtitle="Live mock indicators for academy leadership">
          <div className="dashboard-metric-list">
            {academyOperations.map((item) => (
              <div className="dashboard-metric" key={item.title}>
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <p>{item.meta}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming Focus" subtitle="Priority items for today">
          <div className="dashboard-focus-row">
            <CalendarMiniCard month="Jul" day="24" label="Weekly academy report" />
            <div>
              <h3>Teacher capacity review</h3>
              <p>Check Quran Reading and Arabic beginner groups before adding new trials.</p>
            </div>
          </div>
          <div className="dashboard-focus-row">
            <CalendarMiniCard month="Jul" day="25" label="Trial follow-up" />
            <div>
              <h3>Free trial parent calls</h3>
              <p>19 families are waiting for placement confirmation and teacher assignment.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Upcoming Classes" subtitle="Mock class schedule across active programs">
        <DataTable columns={classColumns} rows={recentClasses} getRowKey={(row) => `${row.time}-${row.className}`} />
      </SectionCard>
    </div>
  );
}
