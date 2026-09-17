import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Musliman Academy',
    short_name: 'Musliman',
    description: 'Online Quran, Arabic, Tajweed, and Islamic Studies classes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F7F3',
    theme_color: '#0B1F3A',
    icons: [
      {
        src: '/assets/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
