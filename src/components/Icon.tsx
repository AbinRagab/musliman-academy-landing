import type { ReactNode } from 'react';
export type IconName =
  | 'calendar'
  | 'clock'
  | 'star'
  | 'bookOpen'
  | 'arabicLetters'
  | 'sunBook'
  | 'tajweed'
  | 'searchBook'
  | 'arabicDad'
  | 'mosque'
  | 'family'
  | 'teacher'
  | 'certificate'
  | 'route'
  | 'laptop'
  | 'users'
  | 'clipboard'
  | 'gift'
  | 'child'
  | 'adult'
  | 'globe'
  | 'readingIssue'
  | 'heartFamily'
  | 'presentation'
  | 'chat'
  | 'shield'
  | 'video'
  | 'quranStand'
  | 'chart'
  | 'whatsapp'
  | 'mail'
  | 'link'
  | 'send'
  | 'phone'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'x';

interface IconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, className = '', strokeWidth = 1.9 }: IconProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth,
  };

  const map: Record<IconName, ReactNode> = {
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" {...common} />
        <path d="M8 3v4M16 3v4M4 10h16" {...common} />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" {...common} />
        <path d="M12 7v5l3 2" {...common} />
      </>
    ),
    star: <path d="m12 3 2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 16.52 6.7 19.3l1.01-5.9-4.29-4.18 5.93-.86L12 3Z" {...common} />,
    bookOpen: (
      <>
        <path d="M4 5.4c2.65-.82 5.25-.42 8 1.2v13.1c-2.75-1.62-5.35-2.02-8-1.2V5.4Z" {...common} />
        <path d="M20 5.4c-2.65-.82-5.25-.42-8 1.2v13.1c2.75-1.62 5.35-2.02 8-1.2V5.4Z" {...common} />
        <path d="M12 6.6v13.1" {...common} />
      </>
    ),
    arabicLetters: (
      <>
        <path d="M5 18h8" {...common} />
        <path d="M8 6v7.5A2.5 2.5 0 0 1 5.5 16H5" {...common} />
        <path d="M13 7v8.2A2.8 2.8 0 0 0 15.8 18H18" {...common} />
        <path d="M17 10v8" {...common} />
        <path d="M7.7 4.7h.01M15.2 4.7h.01" {...common} />
      </>
    ),
    sunBook: (
      <>
        <path d="M5 14c2.7-.9 4.8-.45 7 1 2.2-1.45 4.3-1.9 7-1v4.2c-2.7-.9-4.8-.45-7 1-2.2-1.45-4.3-1.9-7-1V14Z" {...common} />
        <path d="M12 4v2M16.8 6.2l-1.4 1.4M7.2 6.2l1.4 1.4M18.5 10h-2M5.5 10h2" {...common} />
        <path d="M8.7 10a3.3 3.3 0 0 1 6.6 0" {...common} />
      </>
    ),
    tajweed: (
      <>
        <path d="M5 6h14" {...common} />
        <path d="M7 10c1.15-1 2.35-1 3.5 0s2.35 1 3.5 0 2.35-1 3.5 0" {...common} />
        <path d="M7 14c1.15-1 2.35-1 3.5 0s2.35 1 3.5 0 2.35-1 3.5 0" {...common} />
        <path d="M8 18h8" {...common} />
      </>
    ),
    searchBook: (
      <>
        <path d="M4 6c2.7-.8 5.2-.4 7.7 1.2v10.6C9.2 16.2 6.7 15.8 4 16.6V6Z" {...common} />
        <path d="M12 7.2c2.5-1.6 5-2 7.7-1.2v6.5" {...common} />
        <circle cx="16" cy="16" r="3" {...common} />
        <path d="m18.4 18.4 2.1 2.1" {...common} />
      </>
    ),
    arabicDad: (
      <>
        <path d="M5 19h8" {...common} />
        <path d="M8 6v7.5A2.5 2.5 0 0 1 5.5 16H5" {...common} />
        <path d="M13 7v8.2A2.8 2.8 0 0 0 15.8 18H18" {...common} />
        <path d="M18 10v8" {...common} />
        <path d="M15.2 4.7h.01M17.8 4.7h.01" {...common} />
      </>
    ),
    mosque: (
      <>
        <path d="M5 19h14M6 19V10l6-5 6 5v9" {...common} />
        <path d="M9 19v-5a3 3 0 0 1 6 0v5M4 19V12M20 19V12" {...common} />
        <path d="M14 4.5A3 3 0 0 1 11 2" {...common} />
      </>
    ),
    family: (
      <>
        <circle cx="8" cy="8" r="3" {...common} />
        <circle cx="16" cy="9" r="2.5" {...common} />
        <path d="M3.5 20a5 5 0 0 1 9 0M12 20a4.5 4.5 0 0 1 8.5 0" {...common} />
        <path d="m16 4 1 2 2 .2-1.5 1.3.5 2-2-1-2 1 .5-2L13 6.2l2-.2 1-2Z" {...common} />
      </>
    ),
    teacher: (
      <>
        <circle cx="12" cy="7" r="3" {...common} />
        <path d="M6 20v-2a6 6 0 0 1 12 0v2M9 11l3 3 3-3" {...common} />
      </>
    ),
    certificate: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" {...common} />
        <path d="M8 8h8M8 11h8" {...common} />
        <circle cx="12" cy="15" r="2" {...common} />
        <path d="m10.7 16.5-1 3M13.3 16.5l1 3" {...common} />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="6" r="2" {...common} />
        <circle cx="18" cy="18" r="2" {...common} />
        <path d="M8 6h5a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h5" {...common} />
      </>
    ),
    laptop: (
      <>
        <rect x="5" y="5" width="14" height="10" rx="1" {...common} />
        <path d="M3 19h18l-2-4H5l-2 4Z" {...common} />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" {...common} />
        <circle cx="17" cy="9" r="2.5" {...common} />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0M14.5 20a4.5 4.5 0 0 1 6-4" {...common} />
      </>
    ),
    clipboard: (
      <>
        <rect x="6" y="5" width="12" height="16" rx="2" {...common} />
        <path d="M9 5a3 3 0 0 1 6 0M9 10h6M9 14h6M9 18h4" {...common} />
      </>
    ),
    gift: (
      <>
        <path d="M4 10h16v10H4V10ZM4 10h16M12 10v10" {...common} />
        <path d="M12 10S8 9.2 8 6.7C8 5.6 8.9 5 9.8 5 11.4 5 12 7 12 7s.6-2 2.2-2C15.1 5 16 5.6 16 6.7 16 9.2 12 10 12 10Z" {...common} />
      </>
    ),
    child: (
      <>
        <circle cx="12" cy="10" r="4" {...common} />
        <path d="M7 19a5 5 0 0 1 10 0M8 8c1.5-3 6.5-3 8 0M9.5 11h.01M14.5 11h.01M10 14c1.2.8 2.8.8 4 0" {...common} />
      </>
    ),
    adult: (
      <>
        <circle cx="12" cy="8" r="4" {...common} />
        <path d="M5 21a7 7 0 0 1 14 0M8 9c1-3 7-3 8 0" {...common} />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="8" {...common} />
        <path d="M4 12h16M12 4c2.2 2.2 3.3 4.9 3.3 8s-1.1 5.8-3.3 8M12 4c-2.2 2.2-3.3 4.9-3.3 8S9.8 17.8 12 20" {...common} />
      </>
    ),
    readingIssue: (
      <>
        <path d="M4 6c2.6-.8 5.1-.45 8 1v11c-2.9-1.45-5.4-1.8-8-1V6Z" {...common} />
        <path d="M12 7c2.9-1.45 5.4-1.8 8-1v11c-2.6-.8-5.1-.45-8 1V7Z" {...common} />
        <path d="M9 12c1 .8 2 .8 3 0" {...common} />
      </>
    ),
    heartFamily: (
      <>
        <path d="M12 8.3C10.2 5.4 6 6.4 6 10c0 3 3.2 5.1 6 7.2 2.8-2.1 6-4.2 6-7.2 0-3.6-4.2-4.6-6-1.7Z" {...common} />
        <circle cx="6" cy="17" r="2" {...common} />
        <circle cx="18" cy="17" r="2" {...common} />
      </>
    ),
    presentation: (
      <>
        <rect x="4" y="5" width="16" height="11" rx="1" {...common} />
        <path d="M8 20l4-4 4 4M8 10h4M8 13h7" {...common} />
      </>
    ),
    chat: (
      <>
        <path d="M4 6.5A4.5 4.5 0 0 1 8.5 2h7A4.5 4.5 0 0 1 20 6.5v3A4.5 4.5 0 0 1 15.5 14H11l-5 4v-4.3A4.5 4.5 0 0 1 4 10V6.5Z" {...common} />
        <path d="M8 8h8M8 11h5" {...common} />
      </>
    ),
    shield: <path d="M12 3 5 6v5.5c0 4.6 3 7.4 7 9.5 4-2.1 7-4.9 7-9.5V6l-7-3ZM9 12l2 2 4-4" {...common} />,
    video: (
      <>
        <rect x="4" y="6" width="12" height="10" rx="2" {...common} />
        <path d="m16 10 4-2.5v7L16 12" {...common} />
      </>
    ),
    quranStand: (
      <>
        <path d="M6 6c2.4-.8 4.5-.4 6 1.1 1.5-1.5 3.6-1.9 6-1.1v9c-2.4-.8-4.5-.4-6 1.1-1.5-1.5-3.6-1.9-6-1.1V6Z" {...common} />
        <path d="M12 16v3M8 20l4-4 4 4" {...common} />
      </>
    ),
    chart: (
      <>
        <path d="M4 19h16M6 17v-5M12 17V8M18 17V5" {...common} />
        <path d="m7 11 5-4 3 2 4-5" {...common} />
      </>
    ),
    whatsapp: (
      <>
        <path d="M20 11.8a8 8 0 0 1-11.85 7.02L4 20l1.22-4.05A8 8 0 1 1 20 11.8Z" {...common} />
        <path
          d="M9.18 7.9c.17-.38.42-.46.72-.46h.58c.24 0 .43.12.56.42l.72 1.66c.12.28.08.52-.1.74l-.46.55c.74 1.22 1.76 2.14 3.03 2.74l.6-.68c.18-.2.42-.26.68-.14l1.56.7c.3.14.43.34.42.66-.03.7-.48 1.22-1.18 1.44-.72.23-1.55.1-2.46-.34-2.18-1.04-4.06-2.9-5.15-5.08-.45-.9-.53-1.67-.24-2.22Z"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
    mail: (
      <>
        <rect x="4" y="6" width="16" height="12" rx="2" {...common} />
        <path d="m4 8 8 6 8-6" {...common} />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7-7l-1.2 1.2" {...common} />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7 7l1.2-1.2" {...common} />
      </>
    ),
    send: (
      <>
        <path d="M21 3 10 14" {...common} />
        <path d="m21 3-7 18-4-7-7-4 18-7Z" {...common} />
      </>
    ),
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" {...common} />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" {...common} />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" {...common} />
      </>
    ),
    moon: <path d="M20 15.3A8 8 0 0 1 8.7 4a7 7 0 1 0 11.3 11.3Z" {...common} />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" {...common} />,
    x: <path d="M6 6l12 12M18 6 6 18" {...common} />,
  };

  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {map[name]}
    </svg>
  );
}
