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
    window.sessionStorage.clear();
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
  it('opens the compact menu as a labelled dialog that manages focus and Escape', () => {
    render(<LandingPage />);
    const header = document.querySelector('header.navbar') as HTMLElement;
    const toggle = within(header).getByRole('button', { name: 'Open menu' });
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('role', 'dialog');
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(panel).toHaveAttribute('aria-label', 'Main navigation');
    // A closed panel cannot receive focus.
    expect(panel).toHaveAttribute('inert');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('inert');
    expect(within(panel).getByRole('button', { name: 'Close menu' })).toHaveFocus();

    // Focus wraps inside the open panel.
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
    focusable[focusable.length - 1].focus();
    fireEvent.keyDown(panel, { key: 'Tab' });
    expect(focusable[0]).toHaveFocus();
    fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true });
    expect(focusable[focusable.length - 1]).toHaveFocus();

    // Escape inside the language list closes only that list.
    const languageToggle = within(panel).getByRole('button', { name: /language/i });
    fireEvent.click(languageToggle);
    expect(languageToggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(languageToggle, { key: 'Escape' });
    expect(languageToggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(panel, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('inert');
    expect(toggle).toHaveFocus();

    fireEvent.click(toggle);
    fireEvent.pointerDown(document.querySelector('main')!);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    for (const link of Array.from(panel.querySelectorAll('a'))) expect(link.querySelector('a, button')).toBeNull();
  });

  it('keeps the WhatsApp greeting dismissible and out of the way of the booking form', () => {
    let reportBooking: ((entries: Array<Partial<IntersectionObserverEntry>>) => void) | undefined;
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: (entries: Array<Partial<IntersectionObserverEntry>>) => void) { reportBooking = callback; }
      observe() {}
      disconnect() {}
    });
    const box = (left: number, width: number, top: number, height: number) => () => ({ left, right: left + width, top, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) });
    const { unmount } = render(<LandingPage />);
    const greeting = document.querySelector('.floating-whatsapp-greeting') as HTMLElement;
    const button = screen.getByRole('link', { name: 'Contact Musliman Academy on WhatsApp' });
    // The number and enquiry message are unchanged; nothing is sent until the visitor follows the link.
    const href = `https://wa.me/201038331058?text=${encodeURIComponent("Assalamu Alaikum! I'd like to know more about your courses, schedules, and fees.")}`;
    expect(greeting.querySelector('a')).toHaveAttribute('href', href);
    expect(button).toHaveAttribute('href', href);
    expect(greeting).toHaveClass('is-visible');

    // Editing a field hides the greeting and the button, then restores them.
    const nameField = document.querySelector<HTMLInputElement>('#book-trial input[name="name"]')!;
    act(() => nameField.focus());
    expect(greeting).not.toHaveClass('is-visible');
    expect(greeting).toHaveAttribute('inert');
    expect(button).toHaveClass('is-tucked');
    expect(button).toHaveAttribute('inert');
    act(() => nameField.blur());
    expect(greeting).toHaveClass('is-visible');
    expect(button).not.toHaveClass('is-tucked');

    // With the booking card in view the greeting hides; the button steps aside only where it would cover the card.
    const card = document.querySelector('#book-trial .booking-card') as HTMLElement;
    card.getBoundingClientRect = box(16, 358, 0, 800);
    button.getBoundingClientRect = box(320, 54, 774, 54);
    act(() => reportBooking!([{ isIntersecting: true }]));
    expect(greeting).not.toHaveClass('is-visible');
    expect(button).toHaveClass('is-tucked');
    card.getBoundingClientRect = box(130, 1180, 0, 800);
    button.getBoundingClientRect = box(1356, 60, 816, 60);
    act(() => reportBooking!([{ isIntersecting: true }]));
    expect(button).not.toHaveClass('is-tucked');
    // When changes arrive together, the latest one decides.
    card.getBoundingClientRect = box(16, 358, 0, 800);
    button.getBoundingClientRect = box(320, 54, 774, 54);
    act(() => reportBooking!([{ isIntersecting: false }, { isIntersecting: true }]));
    expect(button).toHaveClass('is-tucked');
    act(() => reportBooking!([{ isIntersecting: false }]));
    expect(greeting).toHaveClass('is-visible');
    expect(button).not.toHaveClass('is-tucked');

    // The open menu is modal: both stay hidden and unfocusable until it closes.
    const menuToggle = within(document.querySelector('header.navbar') as HTMLElement).getByRole('button', { name: 'Open menu' });
    fireEvent.click(menuToggle);
    expect(greeting).not.toHaveClass('is-visible');
    expect(greeting).toHaveAttribute('inert');
    expect(button).toHaveClass('is-tucked');
    expect(button).toHaveAttribute('inert');
    fireEvent.keyDown(document.getElementById(menuToggle.getAttribute('aria-controls')!)!, { key: 'Escape' });
    expect(greeting).toHaveClass('is-visible');
    expect(button).not.toHaveClass('is-tucked');
    fireEvent.click(menuToggle);
    fireEvent.pointerDown(document.querySelector('main')!);
    expect(greeting).toHaveClass('is-visible');

    // Dismissal moves focus to the WhatsApp button and lasts for the visit.
    fireEvent.click(within(greeting).getByRole('button', { name: 'Hide WhatsApp greeting' }));
    expect(greeting).not.toHaveClass('is-visible');
    expect(button).toHaveFocus();
    expect(window.sessionStorage.getItem('musliman-whatsapp-greeting-dismissed')).toBe('true');
    unmount();
    render(<LandingPage />);
    expect(document.querySelector('.floating-whatsapp-greeting')).not.toHaveClass('is-visible');
    vi.unstubAllGlobals();
  });

  it('links each carousel teacher to a localized profile only where profiles exist', async () => {
    const { unmount } = render(<LandingPage />);
    expect(document.querySelector('.teacher-card__profile')).toBeNull();
    unmount();

    await loadLanguageResource('de');
    await i18n.changeLanguage('de');
    render(<LandingPage programPages />);
    const carousel = screen.getByRole('region', { name: i18n.t('teachers.aria.region') });
    const links = () => within(carousel).getAllByRole('link');
    expect(links().map(link => link.getAttribute('href'))).toEqual(['/de/teachers/mazin-yasser', '/de/teachers/fatimah-al-shazly', '/de/teachers/ahmed-yasser']);
    expect(links()[1]).toHaveAccessibleName('Profil ansehen: Fatimah Al Shazly');
    for (const link of links()) expect(link.querySelector('a, button')).toBeNull();
    fireEvent.click(within(carousel).getByRole('button', { name: i18n.t('teachers.aria.next') }));
    expect(links().map(link => link.getAttribute('href'))).toEqual(['/de/teachers/fatimah-al-shazly', '/de/teachers/ahmed-yasser', '/de/teachers/gehad-ragab']);
  });
});
