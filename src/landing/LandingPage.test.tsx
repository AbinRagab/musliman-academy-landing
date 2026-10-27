import { act, fireEvent, render, screen, within } from '@testing-library/react';
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

  it('exposes FAQ open state and answer panels to assistive technology', async () => {
    render(<LandingPage />);
    const faq = document.getElementById('faq')!;
    const toggles = () => within(faq).getAllByRole('button').filter(button => button.hasAttribute('aria-expanded'));
    const panelFor = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-controls')!)!;
    const expanded = () => toggles().map(button => button.getAttribute('aria-expanded'));
    const onlyOpen = (index: number) => toggles().map((_, i) => String(i === index));

    const ids = toggles().map(button => button.getAttribute('aria-controls'));
    expect(new Set(ids).size).toBe(ids.length);
    expect(expanded()).toEqual(onlyOpen(0));
    for (const button of toggles()) {
      const panel = panelFor(button);
      expect(panel).toHaveAttribute('aria-labelledby', button.id);
      expect(panel.hidden).toBe(button.getAttribute('aria-expanded') === 'false');
    }
    expect(within(faq).getByRole('region', { name: 'Are the classes online?' })).toBeVisible();

    fireEvent.click(toggles()[1]);
    expect(expanded()).toEqual(onlyOpen(1));
    expect(panelFor(toggles()[0]).hidden).toBe(true);
    fireEvent.click(toggles()[1]);
    expect(expanded().every(state => state === 'false')).toBe(true);
    fireEvent.click(toggles()[2]);

    // Switching language keeps the open item and the panel associations.
    await loadLanguageResource('ar');
    await act(() => i18n.changeLanguage('ar'));
    expect(toggles().map(button => button.getAttribute('aria-controls'))).toEqual(ids);
    expect(expanded()).toEqual(onlyOpen(2));
    expect(within(faq).getByRole('button', { name: 'هل الحصص أونلاين؟' })).toHaveAttribute('aria-expanded', 'false');
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
    const countryInput = screen.getByRole('combobox', { name: 'الدولة' });
    const suggestions = document.getElementById(countryInput.getAttribute('list')!);
    for (const country of ['أنتيغوا وباربودا', 'البوسنة والهرسك', 'ميانمار']) {
      expect(Array.from(suggestions!.querySelectorAll('option')).some(option => option.value === country)).toBe(true);
    }
    fireEvent.change(countryInput, { target: { value: 'البوسنة والهرسك' } });
    expect(countryInput.closest('form')!.querySelector('input[name="country"]')).toHaveValue('Bosnia and Herzegovina');
    fireEvent.change(countryInput, { target: { value: 'البوسنة' } });
    expect(countryInput.closest('form')!.querySelector('input[name="country"]')).toHaveValue('');
    const programSelect = screen.getByRole('option', { name: 'اختر برنامجا' }).parentElement as HTMLSelectElement;
    expect(programSelect).toBeEnabled();
    expect(within(programSelect).getByRole('option', { name: 'قراءة القرآن' })).toBeInTheDocument();
    expect(within(programSelect).getAllByRole('option')).toHaveLength(9);
    expect(screen.queryByText('Schedule & Fee')).not.toBeInTheDocument();
    expect(screen.queryByText(/^(hero|about|how|training|faq)\./i)).not.toBeInTheDocument();
    expect(screen.queryByText(/returned an object instead of string/i)).not.toBeInTheDocument();
  });
});
