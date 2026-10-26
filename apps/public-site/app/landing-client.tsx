'use client';

import { use, useEffect, useState } from 'react';
import LandingPage from '../../../src/landing/LandingPage';
import i18n, { initializeI18n, loadLanguageResource, normalizeLanguage } from '../../../src/i18n';

const i18nReady = initializeI18n('en');

export default function LandingClient() {
  use(i18nReady);
  const [bookingType, setBookingType] = useState<'training'>();
  useEffect(() => {
    let cancelled = false;
    async function applyBookingContext() {
      const query = new URLSearchParams(window.location.search);
      if (query.has('lang')) {
        const language = normalizeLanguage(query.get('lang') || 'en');
        await loadLanguageResource(language);
        if (cancelled) return;
        await i18n.changeLanguage(language);
      }
      if (cancelled) return;
      if (query.get('type') === 'training') {
        setBookingType('training');
        return;
      }
      const select = document.querySelector<HTMLSelectElement>('select[name="program"]');
      const program = query.get('program');
      if (select && program && Array.from(select.options).some(option => option.value === program)) {
        select.value = program;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    void applyBookingContext();
    return () => { cancelled = true; };
  }, []);
  return <LandingPage manageSeo={false} programPages requestedBookingType={bookingType} />;
}
