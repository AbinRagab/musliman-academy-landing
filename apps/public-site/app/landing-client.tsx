'use client';

import { use } from 'react';
import LandingPage from '../../../src/landing/LandingPage';
import { initializeI18n } from '../../../src/i18n';

const i18nReady = initializeI18n('en');

export default function LandingClient() {
  use(i18nReady);
  return <LandingPage manageSeo={false} />;
}
