import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { siteUrl } from '../lib/languages';
import '../../../src/landing/styles/landing.css';

// Served for URLs outside the localized routes, which have no root layout.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Page not found | Musliman Academy',
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <body>
        <main className="route-not-found">
          <Image
            src="/assets/musliman-logo-light-bg-transparent.png"
            alt="Musliman Academy"
            width={640}
            height={247}
          />
          <p className="route-not-found__code">404</p>
          <h1>Page not found</h1>
          <p>The page you requested does not exist or may have moved.</p>
          <Link href="/en">Return to Musliman Academy</Link>
        </main>
      </body>
    </html>
  );
}
