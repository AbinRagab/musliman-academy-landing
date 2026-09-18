import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18n, { initializeI18n, loadLanguageResource } from '../i18n';
import LandingPage from './LandingPage';

vi.mock('../shared/services/programsService', () => ({
  usePrograms: () => ({ loading: false, error: null, programs: [], refetch: vi.fn() }),
}));

describe('LandingPage', () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders the public landing experience', async () => {
    render(<LandingPage />);

    expect(screen.getAllByLabelText(/Musliman Academy home/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /whatsapp/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('Live · Personalized · Trusted')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Start Your Quran and Arabic Learning Journey Now/i })).toBeInTheDocument();
    expect(screen.getByText('One-to-One Learning')).toBeInTheDocument();
    expect(screen.queryByText(/returned an object instead of string/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^(hero|about)\./i)).not.toBeInTheDocument();

    const programSelect = screen.getByRole('option', { name: 'Select a program' }).parentElement as HTMLSelectElement;
    expect(programSelect).toBeEnabled();
    expect(within(programSelect).getByRole('option', { name: 'Quran Reading' })).toBeInTheDocument();
    expect(within(programSelect).getAllByRole('option')).toHaveLength(9);
  });

  it('renders the Arabic experience without English fallbacks or raw translation keys', async () => {
    await loadLanguageResource('ar');
    await i18n.changeLanguage('ar');

    render(<LandingPage />);

    expect(screen.getByRole('heading', { name: /ابدأ رحلة تعلم القرآن واللغة العربية اليوم/i })).toBeInTheDocument();
    expect(screen.getByText('خطط الأسعار')).toBeInTheDocument();
    expect(screen.getByText('قصص الطلاب')).toBeInTheDocument();
    expect(screen.getByText('معلمونا')).toBeInTheDocument();
    expect(screen.getByText('هل الحصص أونلاين؟')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'أنتيغوا وباربودا' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'البوسنة والهرسك' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ميانمار' })).toBeInTheDocument();
    const programSelect = screen.getByRole('option', { name: 'اختر برنامجا' }).parentElement as HTMLSelectElement;
    expect(programSelect).toBeEnabled();
    expect(within(programSelect).getByRole('option', { name: 'قراءة القرآن' })).toBeInTheDocument();
    expect(within(programSelect).getAllByRole('option')).toHaveLength(9);
    expect(screen.queryByText('Schedule & Fee')).not.toBeInTheDocument();
    expect(screen.queryByText(/^(hero|about|how|training|faq)\./i)).not.toBeInTheDocument();
    expect(screen.queryByText(/returned an object instead of string/i)).not.toBeInTheDocument();
  });
});
