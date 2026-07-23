import Icon from '../../components/Icon';
import ActionButton from '../components/ActionButton';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import RoleBadge from '../components/RoleBadge';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminStats,
  permissionToggles,
  permissionsMatrix,
  users,
} from '../data/mockData';

type UserRow = (typeof users)[number];
type PermissionRow = (typeof permissionsMatrix)[number];

function PermissionMark({ enabled }: { enabled: boolean }) {
  return <span className={`dashboard-permission-mark ${enabled ? 'is-enabled' : ''}`}>{enabled ? 'Yes' : 'No'}</span>;
}

const userColumns: Array<DataTableColumn<UserRow>> = [
  { header: 'Name', accessor: 'name' },
  { header: 'Email', accessor: 'email' },
  { header: 'Role', accessor: (row) => <RoleBadge role={row.role} /> },
  { header: 'Status', accessor: (row) => <StatusBadge label={row.status} /> },
  { header: 'Permissions', accessor: 'permissions' },
  {
    header: 'Actions',
    accessor: () => (
      <div className="dashboard-table-actions">
        <ActionButton variant="ghost">Edit</ActionButton>
        <ActionButton variant="ghost">Suspend</ActionButton>
      </div>
    ),
  },
];

const permissionColumns: Array<DataTableColumn<PermissionRow>> = [
  { header: 'Permissions', accessor: 'permission' },
  { header: 'Super Admin', accessor: (row) => <PermissionMark enabled={row.superAdmin} /> },
  { header: 'Admin', accessor: (row) => <PermissionMark enabled={row.admin} /> },
  { header: 'Teacher', accessor: (row) => <PermissionMark enabled={row.teacher} /> },
  { header: 'Student', accessor: (row) => <PermissionMark enabled={row.student} /> },
];

export default function AccountsRolesPage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">Admin Area</span>
          <h1>Admin Control Center</h1>
          <p>Manage users, roles, permissions and academy operations</p>
        </div>
        <ActionButton>
          <Icon name="shieldCheck" size={18} />
          Audit Permissions
        </ActionButton>
      </div>

      <div className="dashboard-stats-grid">
        {adminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--accounts">
        <div className="dashboard-stack">
          <SectionCard title="User Management" subtitle="Mock users prepared for future authentication wiring">
            <DataTable columns={userColumns} rows={users} getRowKey={(row) => row.email} />
          </SectionCard>

          <SectionCard title="Permissions Matrix" subtitle="Role defaults for the academy dashboard">
            <DataTable columns={permissionColumns} rows={permissionsMatrix} getRowKey={(row) => row.permission} />
          </SectionCard>
        </div>

        <aside className="dashboard-side-panel">
          <div className="dashboard-card__header">
            <div>
              <h2>Create New Account</h2>
              <p>Temporary mock form for role and permission setup.</p>
            </div>
          </div>
          <form className="dashboard-form">
            <label>
              <span>Full Name</span>
              <input type="text" placeholder="Enter full name" />
            </label>
            <label>
              <span>Email Address</span>
              <input type="email" placeholder="name@example.com" />
            </label>
            <label>
              <span>Role</span>
              <select defaultValue="Admin">
                <option>Super Admin</option>
                <option>Admin</option>
                <option>Teacher</option>
                <option>Student</option>
              </select>
            </label>
            <div className="dashboard-toggle-group">
              <strong>Permissions</strong>
              {permissionToggles.map((permission) => (
                <label className="dashboard-toggle" key={permission}>
                  <span>{permission}</span>
                  <input type="checkbox" defaultChecked={['Manage Students', 'View Reports', 'Manage Classes'].includes(permission)} />
                </label>
              ))}
            </div>
            <div className="dashboard-form-actions">
              <ActionButton type="button">Create Account</ActionButton>
              <ActionButton type="button" variant="secondary">Cancel</ActionButton>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
