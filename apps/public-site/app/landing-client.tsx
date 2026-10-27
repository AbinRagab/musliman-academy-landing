'use client';

import { useEffect, useState } from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import LandingPage from '../../../src/landing/LandingPage';
import en from '../../../src/i18n/locales/en.json';

const languageHref = (language: string) => `/${language}`;

export default function LandingClient({ lang, messages }: { lang: string; messages?: Record<string, unknown> }) {
  // A dedicated instance per render keeps concurrent server requests from
  // sharing language state, and lets the server HTML render in `lang`.
  const [i18n] = useState(() => {
    const instance = createInstance();
    void instance.init({
      lng: lang,
      fallbackLng: 'en',
      initAsync: false,
      resources: { en: { translation: en }, ...(messages ? { [lang]: { translation: messages } } : {}) },
      interpolation: { escapeValue: false },
    });
    return instance;
  });
  // Booking context lives in the query string, which static HTML cannot see.
  const [booking, setBooking] = useState<{ type?: 'training'; program?: string }>({});
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('type') === 'training') setBooking({ type: 'training' });
    else if (query.get('program')) setBooking({ program: query.get('program') ?? undefined });
  }, []);
  return <I18nextProvider i18n={i18n}>
    <LandingPage manageSeo={false} programPages requestedBookingType={booking.type} requestedProgram={booking.program} languageHref={languageHref} />
  </I18nextProvider>;
}
