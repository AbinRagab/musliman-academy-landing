import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { GoogleTagManager } from '@next/third-parties/google';
import { direction, isLanguage, languages, siteUrl } from '../../lib/catalog';
import { brandName, jsonLdHtml, organizationJsonLd } from '../../lib/brand';
import '../../../../src/landing/styles/landing.css';

// Every page sets its own title, description, canonical URL and alternates.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: brandName,
    template: `%s | ${brandName}`,
  },
  icons: {
    icon: '/assets/favicon.ico',
    apple: '/assets/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B1F3A',
};

export const dynamicParams = false;

export function generateStaticParams() {
  return languages.map(lang => ({ lang }));
}

export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();
  return (
    <html lang={lang} dir={direction(lang)} suppressHydrationWarning>
      <GoogleTagManager gtmId="GTM-NTDCC9TM" />
      <body>
        {children}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
        >
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','2322077895279770');fbq('track','PageView');`}
        </Script>
        {/* The academy, once per page under a stable @id that other entities reference. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
