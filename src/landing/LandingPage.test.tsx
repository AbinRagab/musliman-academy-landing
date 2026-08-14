import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { initializeI18n } from '../i18n';
import LandingPage from './LandingPage';

vi.mock('../dashboard/services/programsService', () => ({
  usePrograms: () => ({ loading: false, error: null, programs: [], refetch: vi.fn() }),
}));

describe('LandingPage', () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it('renders the public landing experience', async () => {
    render(<LandingPage />);

    expect(screen.getAllByLabelText(/Musliman Academy home/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /whatsapp/i }).length).toBeGreaterThan(0);
  });
});
