import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from './AuthProvider';

vi.mock('./AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/admin']}>
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Protected admin content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('shows setup guidance when Supabase is not configured', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      role: null,
      isReady: true,
      isConfigured: false,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute();

    expect(screen.getByRole('heading', { name: /Supabase setup required/i })).toBeInTheDocument();
  });

  it('shows a loading state while auth is initializing', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      role: null,
      isReady: false,
      isConfigured: true,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute();

    expect(screen.getByRole('heading', { name: /Loading dashboard/i })).toBeInTheDocument();
  });

  it('renders children for an allowed role', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      role: 'admin',
      isReady: true,
      isConfigured: true,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute();

    expect(screen.getByText('Protected admin content')).toBeInTheDocument();
  });

  it('blocks a teacher from an admin-only route', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      role: 'teacher',
      isReady: true,
      isConfigured: true,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute();

    expect(screen.getByRole('heading', { name: /Access Restricted/i })).toBeInTheDocument();
  });
});
