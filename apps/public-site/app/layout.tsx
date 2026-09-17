import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { GoogleTagManager } from '@next/third-parties/google';
import '../../../src/landing/styles/landing.css';

const siteUrl = 'https://www.muslimanacademy.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Musliman Academy | Online Quran, Arabic & Tajweed Classes',
    template: '%s | Musliman Academy',
  },
  description: 'Learn Quran, Arabic, Tajweed, and Islamic Studies online with qualified Egyptian teachers. Book a free trial class with Musliman Academy.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Musliman Academy',
    title: 'Musliman Academy | Online Quran, Arabic & Tajweed Classes',
    description: 'Live, personalized online Quran and Arabic classes for children and adults.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Musliman Academy | Online Quran, Arabic & Tajweed Classes',
    description: 'Live, personalized online Quran and Arabic classes for children and adults.',
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Musliman Academy',
  url: siteUrl,
  logo: `${siteUrl}/assets/favicon-dark.png`,
  description: 'Online Quran, Arabic, Tajweed, and Islamic Studies classes for non-Arabic speakers.',
  sameAs: [
    'https://www.facebook.com/muslimanacademy',
    'https://www.instagram.com/muslimanacademy/',
    'https://www.linkedin.com/company/musliman-academy/',
    'https://www.tiktok.com/@muslimanacademy',
    'https://www.youtube.com/@muslimanacademy',
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <GoogleTagManager gtmId="GTM-NTDCC9TM" />
      <body>
        {children}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
        >
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','2322077895279770');fbq('track','PageView');`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
