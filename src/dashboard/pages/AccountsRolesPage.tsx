import { FormEvent, useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { accountsRoles, type AuthRole } from '../auth/AuthProvider';
import { useAuth } from '../auth/AuthProvider';
import AccessDeniedPage from './AccessDeniedPage';
import ActionButton from '../components/ActionButton';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import RoleBadge from '../components/RoleBadge';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { type ToastMessage } from '../components/Toast';
import { permissionToggles, permissionsMatrix } from '../data/mockData';
import {
  createUserAccount,
  fetchProfiles,
  updateUserRole,
  updateUserStatus,
  type AccountStatus,
  type CreateAccountPayload,
  type ProfileRow,
} from '../services/accountsService';

type PermissionRow = (typeof permissionsMatrix)[number];
type FormState = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: CreateAccountPayload['role'];
  status: CreateAccountPayload['status'];
};

const createRoleOptions: Array<{ value: CreateAccountPayload['role']; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'admissions', label: 'Admissions' },
  { value: 'academic_manager', label: 'Academic Manager' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'finance', label: 'Finance' },
  { value: 'viewer', label: 'Viewer' },
];

const filterRoleOptions: Array<{ value: AuthRole | 'all'; label: string }> = [
  { value: 'all', label: 'All roles' },
  { value: 'super_admin', label: 'Super Admin' },
  ...createRoleOptions,
];

const initialFormState: FormState = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  role: 'teacher',
  status: 'active',
};

function PermissionMark({ enabled }: { enabled: boolean }) {
  return <span className={`dashboard-permission-mark ${enabled ? 'is-enabled' : ''}`}>{enabled ? 'Yes' : 'No'}</span>;
}

function getStatusTone(status: string) {
  if (status === 'active') {
    return 'success' as const;
  }

  if (status === 'pending') {
    return 'warning' as const;
  }

  if (status === 'inactive') {
    return 'neutral' as const;
  }

  return 'danger' as const;
}

function formatRole(role: string) {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function AccountActionsMenu({
  profile,
  onView,
  onChangeRole,
  onToggleStatus,
  onResetPassword,
}: {
  profile: ProfileRow;
  onView: () => void;
  onChangeRole: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
}) {
  return (
    <details className="dashboard-actions-menu">
      <summary aria-label={`Actions for ${profile.full_name}`}>
        <Icon name="moreVertical" size={18} />
      </summary>
      <div className="dashboard-actions-menu__content">
        <button type="button" onClick={onView}>View Profile</button>
        <button type="button" disabled={profile.role === 'super_admin'} onClick={onChangeRole}>Change Role</button>
        <button type="button" onClick={onToggleStatus}>{profile.status === 'active' ? 'Deactivate' : 'Activate'}</button>
        <button type="button" onClick={onResetPassword}>Reset Password</button>
      </div>
    </details>
  );
}

const permissionColumns: Array<DataTableColumn<PermissionRow>> = [
  { header: 'Permissions', accessor: 'permission' },
  { header: 'Super Admin', accessor: (row) => <PermissionMark enabled={row.superAdmin} /> },
  { header: 'Admin', accessor: (row) => <PermissionMark enabled={row.admin} /> },
  { header: 'Teacher', accessor: (row) => <PermissionMark enabled={row.teacher} /> },
  { header: 'Student', accessor: (row) => <PermissionMark enabled={row.student} /> },
];

export default function AccountsRolesPage() {
  const { role: currentRole } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AuthRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [viewProfile, setViewProfile] = useState<ProfileRow | null>(null);
  const [roleProfile, setRoleProfile] = useState<ProfileRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<CreateAccountPayload['role']>('teacher');

  async function loadProfiles() {
    setLoading(true);
    setError('');

    try {
      const rows = await fetchProfiles();
      setProfiles(rows);
    } catch (profilesError) {
      setError(profilesError instanceof Error ? profilesError.message : 'Unable to load profiles.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesSearch = !query
        || profile.full_name.toLowerCase().includes(query)
        || profile.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || profile.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [profiles, roleFilter, search, statusFilter]);

  const stats = useMemo(() => [
    { label: 'Total Accounts', value: profiles.length, trend: 'Profiles table', icon: 'users' },
    { label: 'Admins', value: profiles.filter((profile) => ['super_admin', 'admin'].includes(profile.role)).length, trend: 'Account control', icon: 'shieldCheck' },
    { label: 'Teachers', value: profiles.filter((profile) => profile.role === 'teacher').length, trend: 'Teaching team', icon: 'teacher' },
    { label: 'Students', value: profiles.filter((profile) => profile.role === 'student').length, trend: 'Learner accounts', icon: 'student' },
  ], [profiles]);

  const userColumns: Array<DataTableColumn<ProfileRow>> = [
    { header: 'Full Name', accessor: 'full_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: (row) => row.phone || '-' },
    { header: 'Role', accessor: (row) => <RoleBadge role={row.role} /> },
    { header: 'Status', accessor: (row) => <StatusBadge label={row.status} tone={getStatusTone(row.status)} /> },
    { header: 'Created At', accessor: (row) => formatDate(row.created_at) },
    {
      header: 'Actions',
      accessor: (row) => (
        <AccountActionsMenu
          profile={row}
          onView={() => setViewProfile(row)}
          onChangeRole={() => {
              setRoleProfile(row);
              setSelectedRole(row.role === 'super_admin' ? 'admin' : row.role as CreateAccountPayload['role']);
          }}
          onToggleStatus={() => handleStatusChange(row)}
          onResetPassword={() => setToast({ type: 'info', message: 'Password reset flow will be added in the next phase.' })}
        />
      ),
    },
  ];

  if (!currentRole || !accountsRoles.includes(currentRole)) {
    return <AccessDeniedPage />;
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.full_name.trim()) {
      nextErrors.full_name = 'Full name is required.';
    }

    if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (form.password.length < 8) {
      nextErrors.password = 'Temporary password must be at least 8 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createUserAccount({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        role: form.role,
        status: form.status,
      });
      setToast({ type: 'success', message: 'Account created successfully' });
      setForm(initialFormState);
      setFieldErrors({});
      await loadProfiles();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create account.';
      setToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(profile: ProfileRow) {
    const nextStatus: AccountStatus = profile.status === 'active' ? 'inactive' : 'active';

    try {
      const updatedProfile = await updateUserStatus(profile.id, nextStatus);
      setProfiles((current) => current.map((row) => (row.id === updatedProfile.id ? updatedProfile : row)));
      setToast({ type: 'success', message: `Account ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.` });
    } catch (statusError) {
      setToast({ type: 'error', message: statusError instanceof Error ? statusError.message : 'Unable to update status.' });
    }
  }

  async function handleRoleChange() {
    if (!roleProfile) {
      return;
    }

    try {
      const updatedProfile = await updateUserRole(roleProfile.id, selectedRole);
      setProfiles((current) => current.map((row) => (row.id === updatedProfile.id ? updatedProfile : row)));
      setRoleProfile(null);
      setToast({ type: 'success', message: 'Role updated successfully.' });
    } catch (roleError) {
      setToast({ type: 'error', message: roleError instanceof Error ? roleError.message : 'Unable to update role.' });
    }
  }

  return (
    <div className="dashboard-page dashboard-page--accounts">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="dashboard-page-header dashboard-page-header--accounts">
        <div>
          <span className="dashboard-eyebrow">ADMIN AREA</span>
          <h1>Admin Control Center</h1>
          <p>Manage users, roles, permissions and academy operations</p>
        </div>
        <ActionButton variant="secondary" onClick={loadProfiles}>
          <Icon name="shieldCheck" size={18} />
          Refresh Accounts
        </ActionButton>
      </div>

      <div className="dashboard-stats-grid dashboard-stats-grid--accounts">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--accounts">
        <SectionCard className="dashboard-card--accounts-table" title="User Management" subtitle="Live profiles from Supabase">
            <div className="dashboard-filters">
              <label>
                <span>Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" />
              </label>
              <label>
                <span>Role</span>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as AuthRole | 'all')}>
                  {filterRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AccountStatus | 'all')}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>

            {loading && <div className="dashboard-loading-state">Loading academy accounts...</div>}
            {error && <div className="dashboard-inline-error">{error}</div>}
            {!loading && !error && filteredProfiles.length === 0 && (
              <EmptyState title="No accounts found" description="Create a dashboard account or adjust your filters." />
            )}
            {!loading && !error && filteredProfiles.length > 0 && (
              <DataTable columns={userColumns} rows={filteredProfiles} getRowKey={(row) => row.id} />
            )}
        </SectionCard>

        <aside className="dashboard-side-panel">
          <div className="dashboard-card__header">
            <div>
              <h2>Create New Account</h2>
              <p>Create secure Supabase Auth users through the server-side Edge Function.</p>
            </div>
          </div>
          <form className="dashboard-form" onSubmit={handleSubmit}>
            <label>
              <span>Full Name</span>
              <input
                type="text"
                value={form.full_name}
                onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                placeholder="Enter full name"
              />
              {fieldErrors.full_name && <small className="dashboard-field-error">{fieldErrors.full_name}</small>}
            </label>
            <label>
              <span>Email Address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
              />
              {fieldErrors.email && <small className="dashboard-field-error">{fieldErrors.email}</small>}
            </label>
            <label>
              <span>Phone / WhatsApp</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+20..."
              />
            </label>
            <label>
              <span>Temporary Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              {fieldErrors.password && <small className="dashboard-field-error">{fieldErrors.password}</small>}
            </label>
            <label>
              <span>Role</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as CreateAccountPayload['role'] }))}>
                {createRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CreateAccountPayload['status'] }))}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </label>
            <details className="dashboard-advanced-permissions">
              <summary>
                <span>Advanced Permissions</span>
                <Icon name="chevronRight" size={17} />
              </summary>
              <div className="dashboard-toggle-group">
                {permissionToggles.map((permission) => (
                  <label className="dashboard-toggle" key={permission}>
                    <span>{permission}</span>
                    <input type="checkbox" defaultChecked={['Manage Students', 'View Reports', 'Manage Classes'].includes(permission)} />
                  </label>
                ))}
                <small>Permission toggles are visual in this phase. Role assignment is saved now.</small>
              </div>
            </details>
            <div className="dashboard-form-actions">
              <ActionButton type="submit" variant="copper" disabled={submitting}>{submitting ? 'Creating Account' : 'Create Account'}</ActionButton>
              <ActionButton type="button" variant="secondary" onClick={() => { setForm(initialFormState); setFieldErrors({}); }}>Cancel</ActionButton>
            </div>
          </form>
        </aside>
      </div>

      <SectionCard className="dashboard-card--permissions" title="Permissions Matrix" subtitle="Role defaults for the academy dashboard">
        <DataTable columns={permissionColumns} rows={permissionsMatrix} getRowKey={(row) => row.permission} />
      </SectionCard>

      {viewProfile && (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Profile for ${viewProfile.full_name}`}>
          <div className="dashboard-modal__panel">
            <div className="dashboard-card__header">
              <div>
                <h2>{viewProfile.full_name}</h2>
                <p>Read-only account profile</p>
              </div>
              <button type="button" className="dashboard-icon-button" aria-label="Close profile" onClick={() => setViewProfile(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="dashboard-profile-details">
              <span>Email <strong>{viewProfile.email}</strong></span>
              <span>Phone <strong>{viewProfile.phone || '-'}</strong></span>
              <span>Role <RoleBadge role={viewProfile.role} /></span>
              <span>Status <StatusBadge label={viewProfile.status} tone={getStatusTone(viewProfile.status)} /></span>
              <span>Created <strong>{formatDate(viewProfile.created_at)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {roleProfile && (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Change role for ${roleProfile.full_name}`}>
          <div className="dashboard-modal__panel dashboard-modal__panel--small">
            <div className="dashboard-card__header">
              <div>
                <h2>Change Role</h2>
                <p>{roleProfile.full_name}</p>
              </div>
              <button type="button" className="dashboard-icon-button" aria-label="Close role editor" onClick={() => setRoleProfile(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="dashboard-form">
              <label>
                <span>New Role</span>
                <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as CreateAccountPayload['role'])}>
                  {createRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="dashboard-form-actions">
                <ActionButton onClick={handleRoleChange}>Save Role</ActionButton>
                <ActionButton variant="secondary" onClick={() => setRoleProfile(null)}>Cancel</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
