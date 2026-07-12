import {
  Award,
  BadgeCheck,
  BarChart3,
  BookMarked,
  BookOpen,
  BookUser,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleQuestionMark,
  ClipboardCheck,
  Clock,
  FileText,
  Gift,
  Globe2,
  GraduationCap,
  Headphones,
  HeartHandshake,
  HelpCircle,
  Landmark,
  Languages,
  Laptop,
  Link,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trophy,
  User,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  quran: BookOpen,
  bookOpen: BookOpen,
  'book-open': BookOpen,
  calendar: Calendar,
  clock: Clock,
  star: Star,
  laptop: Laptop,
  online: Laptop,
  users: Users,
  user: User,
  child: User,
  adult: Users,
  teacher: GraduationCap,
  training: GraduationCap,
  graduation: GraduationCap,
  graduationCap: GraduationCap,
  message: MessageCircle,
  chat: MessageCircle,
  messageCircle: MessageCircle,
  shield: ShieldCheck,
  secure: ShieldCheck,
  shieldCheck: ShieldCheck,
  gift: Gift,
  globe: Globe2,
  globe2: Globe2,
  clipboard: ClipboardCheck,
  report: ClipboardCheck,
  clipboardCheck: ClipboardCheck,
  certificate: Award,
  award: Award,
  check: CheckCircle2,
  checkCircle: CheckCircle2,
  checkCircle2: CheckCircle2,
  send: Send,
  phone: Phone,
  mail: Mail,
  email: Mail,
  link: Link,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  faq: HelpCircle,
  help: HelpCircle,
  mosque: Landmark,
  arch: Landmark,
  landmark: Landmark,
  tajweed: ScrollText,
  scrollText: ScrollText,
  arabic: Languages,
  arabicLetters: Languages,
  arabicDad: Languages,
  language: Languages,
  languages: Languages,
  islamic: BookMarked,
  sunBook: BookMarked,
  quranStand: BookMarked,
  bookMarked: BookMarked,
  values: HeartHandshake,
  family: HeartHandshake,
  heartFamily: HeartHandshake,
  heartHandshake: HeartHandshake,
  document: FileText,
  fileText: FileText,
  searchBook: FileText,
  trophy: Trophy,
  sparkle: Sparkles,
  sparkles: Sparkles,
  moon: Moon,
  sun: Sun,
  video: Video,
  progress: BarChart3,
  chart: BarChart3,
  barChart3: BarChart3,
  support: Headphones,
  headphones: Headphones,
  verified: BadgeCheck,
  badgeCheck: BadgeCheck,
  student: BookUser,
  readingIssue: BookUser,
  bookUser: BookUser,
  question: CircleQuestionMark,
  circleQuestionMark: CircleQuestionMark,
  route: ClipboardCheck,
  presentation: GraduationCap,
  menu: Menu,
  x: X,
};

export type IconName = string;

type IconProps = {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
};

function WhatsAppIcon({
  className,
  size,
  strokeWidth,
}: {
  className: string;
  size: number;
  strokeWidth: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      <path d="M20 11.8a8 8 0 0 1-11.85 7.02L4 20l1.22-4.05A8 8 0 1 1 20 11.8Z" />
      <path
        d="M9.18 7.9c.17-.38.42-.46.72-.46h.58c.24 0 .43.12.56.42l.72 1.66c.12.28.08.52-.1.74l-.46.55c.74 1.22 1.76 2.14 3.03 2.74l.6-.68c.18-.2.42-.26.68-.14l1.56.7c.3.14.43.34.42.66-.03.7-.48 1.22-1.18 1.44-.72.23-1.55.1-2.46-.34-2.18-1.04-4.06-2.9-5.15-5.08-.45-.9-.53-1.67-.24-2.22Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default function Icon({
  name,
  className = '',
  size = 24,
  strokeWidth = 1.9,
}: IconProps) {
  const resolvedClassName = `icon ${className}`.trim();

  if (name === 'whatsapp') {
    return <WhatsAppIcon className={resolvedClassName} size={size} strokeWidth={strokeWidth} />;
  }

  const LucideIcon = ICONS[name] || Sparkles;

  return (
    <LucideIcon
      className={resolvedClassName}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      focusable="false"
    />
  );
}
