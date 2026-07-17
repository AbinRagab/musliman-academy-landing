import { FormEvent, MouseEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import './styles.css';
import Icon, { IconName } from './components/Icon';
import LanguageSwitcher from './components/LanguageSwitcher';
import Logo from './components/Logo';
import {
  contact,
  countryOptions,
  faqs,
  howSteps,
  navLinks,
  pricingData,
  programs,
  reasons,
  testimonials,
  trainingBadges,
  trainingIncludes,
  trustItems,
  type PricingCurrency,
} from './data/siteData';

type Theme = 'light' | 'dark';
type BookingType = 'trial' | 'training';
type DecorationVariant = 'light' | 'dark';
type DecorationType = 'hero' | 'trial' | 'about' | 'programs' | 'pricing' | 'why' | 'testimonials' | 'steps' | 'training' | 'faq' | 'footer' | 'default';
type VideoStory = {
  id: number;
  label: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  type: 'embed' | 'mp4';
};

type DecorationItem =
  | { kind: 'icon'; icon: IconName; className: string }
  | { kind: 'arch'; className: string }
  | { kind: 'crescent'; className: string };
type BookingLeadData = Record<string, string | undefined> & {
  requestType: 'Free Trial' | 'Teacher Training';
  name: string;
  whatsapp: string;
  country: string;
  preferredTime: string;
  message: string;
  source: string;
};

// TODO: move this URL to an environment variable before production if needed.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJ0VhS9N31RZtRt37NIj8MQHp66luS_1qMInzfv4wagELRjc3w6daWeVRX0CXOIOXx/exec';
const WHATSAPP_NUMBER = '+0201038331058';
const faqSocialLinks: Array<{ name: string; url: string; className: string; icon: IconType }> = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/muslimanacademy',
    className: 'facebook',
    icon: FaFacebookF,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/muslimanacademy/',
    className: 'instagram',
    icon: FaInstagram,
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/musliman-academy/',
    className: 'linkedin',
    icon: FaLinkedinIn,
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@muslimanacademy',
    className: 'tiktok',
    icon: FaTiktok,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@muslimanacademy',
    className: 'youtube',
    icon: FaYoutube,
  },
];

const faqIcons: IconName[] = ['laptop', 'book', 'users', 'gift', 'clipboardCheck', 'user'];
const experienceOptions = ['none', 'lessThanOne', 'oneToTwo', 'threePlus'];
const qualificationOptions = ['quranTeacher', 'arabicTeacher', 'islamicStudiesTeacher', 'ijazahHolder', 'studentOfKnowledge', 'other'];
const trainingGoalOptions = ['teachNonArabic', 'onlineTeaching', 'lessonPlanning', 'studentFollowUp', 'joinAcademy', 'other'];
const studentAgeOptions = ['child', 'teenager', 'adult'];
const preferredTimeOptions = ['morning', 'afternoon', 'evening', 'flexible'];
const videoStories: VideoStory[] = [
  {
    id: 1,
    label: 'Student Story',
    title: 'From First Letters to Confident Quran Reading',
    description: 'Step-by-step progress with Tajweed',
    duration: '1:24',
    thumbnail: '/assets/hero-bg.png',
    videoUrl: '/videos/student-story.mp4',
    type: 'mp4',
  },
  {
    id: 2,
    label: 'Parent Feedback',
    title: 'Parent Feedback',
    description: 'How our team supports every learner',
    duration: '1:15',
    thumbnail: '/assets/why-choose-visual.jpg',
    videoUrl: 'https://www.youtube.com/embed/YOUTUBE_VIDEO_ID',
    type: 'embed',
  },
  {
    id: 3,
    label: 'Arabic Beginner',
    title: 'Arabic Beginner',
    description: 'Learning Arabic with clarity',
    duration: '1:07',
    thumbnail: '/assets/about-visual.png',
    videoUrl: '/videos/arabic-beginner.mp4',
    type: 'mp4',
  },
  {
    id: 4,
    label: 'Teacher Training',
    title: 'Teacher Training',
    description: 'Training teachers to guide with confidence',
    duration: '1:42',
    thumbnail: '/assets/teacher-training-visual.jpg',
    videoUrl: '/videos/teacher-training.mp4',
    type: 'mp4',
  },
];

function SectionBadge({ icon, children, dark = false }: { icon?: IconName; children: string; dark?: boolean }) {
  return (
    <div className={`section-badge ${dark ? 'section-badge--dark' : ''}`}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </div>
  );
}

function Button({ href, children, icon = 'calendar', className = '', onClick }: { href: string; children: string; icon?: IconName; className?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <a className={`btn btn-primary ${className}`} href={href} onClick={onClick}>
      <Icon name={icon} />
      <span>{children}</span>
    </a>
  );
}

function ThemeToggle({ theme, onToggle, className = '' }: { theme: Theme; onToggle: () => void; className?: string }) {
  const { t } = useTranslation();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      className={`theme-toggle ${className}`}
      type="button"
      onClick={onToggle}
      aria-label={t('aria.switchToTheme', { theme: t(`theme.${nextTheme}`) })}
      aria-pressed={theme === 'dark'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      <span>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
    </button>
  );
}

function Navbar({ theme, onToggleTheme, onSelectBookingType }: { theme: Theme; onToggleTheme: () => void; onSelectBookingType: (type: BookingType) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const logoVariant = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo variant={logoVariant} />
        <nav className="navbar__links" aria-label={t('aria.mainNavigation')}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>{t(link.labelKey)}</a>
          ))}
        </nav>
        <div className="navbar__actions">
          <a className="whatsapp-circle" href={`https://wa.me/${contact.whatsappNumber}`} aria-label={t('aria.contactWhatsapp')} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" />
          </a>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <LanguageSwitcher />
          <Button href="#book-trial" onClick={(event) => { event.preventDefault(); onSelectBookingType('trial'); document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{t('nav.bookFreeTrial')}</Button>
          <button className="menu-button" type="button" aria-label={t('aria.openMenu')} onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
        </div>
      </div>
      <div className={`mobile-panel ${open ? 'is-open' : ''}`}>
        <div className="mobile-panel__top">
          <Logo variant={logoVariant} />
          <button className="menu-button" type="button" aria-label={t('aria.closeMenu')} onClick={() => setOpen(false)}>
            <Icon name="x" />
          </button>
        </div>
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{t(link.labelKey)}</a>
        ))}
        <LanguageSwitcher className="language-switcher--mobile" />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} className="theme-toggle--mobile" />
        <Button
          href="#book-trial"
          className="mobile-panel__cta"
          onClick={(event) => {
            event.preventDefault();
            onSelectBookingType('trial');
            setOpen(false);
            document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {t('nav.bookFreeTrial')}
        </Button>
      </div>
    </header>
  );
}

function ClassIllustration({ mode = 'hero' }: { mode?: 'hero' | 'light' }) {
  const { t } = useTranslation();

  return (
    <div className={`class-visual class-visual--${mode}`}>
      <div className="arch-frame" />
      <div className="floating-star star-one">*</div>
      <div className="floating-star star-two">*</div>
      <div className="desk-top">
        <div className="quran-book"><span>{t('illustration.quran')}</span></div>
        <div className="open-notebook" />
        <div className="plant"><span /></div>
      </div>
      <div className="laptop">
        <div className="laptop-screen">
          <div className="teacher-avatar">
            <div className="teacher-face" />
            <div className="teacher-cap" />
          </div>
          <div className="arabic-board">
            <span>{t('illustration.quranReading')}</span>
            <span>{t('illustration.stepByStep')}</span>
          </div>
          <div className="meeting-dots"><i /><i /><i /></div>
        </div>
        <div className="laptop-base" />
      </div>
      <div className="student student-one" />
      <div className="student student-two" />
    </div>
  );
}

function WhyChooseVisual() {
  const { t } = useTranslation();

  return (
    <div className="why-top__visual">
      <img
        src="/assets/why-choose-visual.jpg"
        alt={t('whyChoose.visualAlt')}
        loading="lazy"
      />
    </div>
  );
}

function getWhyCardsPerPage() {
  if (typeof window === 'undefined') {
    return 4;
  }

  if (window.innerWidth <= 640) {
    return 1;
  }

  if (window.innerWidth <= 1024) {
    return 2;
  }

  return 4;
}

const sectionDecorationItems: Record<DecorationType, DecorationItem[]> = {
  hero: [
    { kind: 'arch', className: 'decor-arch--hero' },
    { kind: 'crescent', className: 'decor-crescent--hero is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--hero-star-one' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--hero-star-two is-accent' },
  ],
  trial: [
    { kind: 'icon', icon: 'book', className: 'decor-icon--book decor-icon--md decor-pos--trial-book is-accent' },
    { kind: 'crescent', className: 'decor-crescent--trial' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--trial-star is-accent' },
  ],
  about: [
    { kind: 'icon', icon: 'bookMarked', className: 'decor-icon--about-mark decor-icon--xl decor-pos--about-mark is-accent' },
    { kind: 'icon', icon: 'globe', className: 'decor-icon--globe decor-icon--md decor-pos--about-globe' },
    { kind: 'crescent', className: 'decor-crescent--about is-accent' },
  ],
  programs: [
    { kind: 'icon', icon: 'book', className: 'decor-icon--book decor-icon--lg decor-pos--programs-book' },
    { kind: 'icon', icon: 'languages', className: 'decor-icon--arabic decor-icon--md decor-pos--programs-arabic is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--programs-star is-accent' },
  ],
  pricing: [
    { kind: 'icon', icon: 'calendar', className: 'decor-icon--calendar decor-icon--lg decor-pos--pricing-calendar is-accent' },
    { kind: 'icon', icon: 'award', className: 'decor-icon--award decor-icon--md decor-pos--pricing-award' },
    { kind: 'crescent', className: 'decor-crescent--pricing is-accent' },
  ],
  why: [
    { kind: 'arch', className: 'decor-arch--why' },
    { kind: 'icon', icon: 'shieldCheck', className: 'decor-icon--shield decor-icon--lg decor-pos--why-shield' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--why-star is-accent' },
  ],
  testimonials: [
    { kind: 'icon', icon: 'messageCircle', className: 'decor-icon--message decor-icon--lg decor-pos--testimonials-message is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--testimonials-star' },
    { kind: 'crescent', className: 'decor-crescent--testimonials is-accent' },
  ],
  steps: [
    { kind: 'icon', icon: 'calendar', className: 'decor-icon--calendar decor-icon--lg decor-pos--steps-calendar' },
    { kind: 'icon', icon: 'book', className: 'decor-icon--book decor-icon--md decor-pos--steps-book is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--steps-star is-accent' },
  ],
  training: [
    { kind: 'arch', className: 'decor-arch--training' },
    { kind: 'icon', icon: 'graduationCap', className: 'decor-icon--graduation decor-icon--lg decor-pos--training-teacher' },
    { kind: 'icon', icon: 'award', className: 'decor-icon--certificate decor-icon--md decor-pos--training-certificate is-accent' },
    { kind: 'icon', icon: 'book', className: 'decor-icon--book decor-icon--md decor-pos--training-book' },
  ],
  faq: [
    { kind: 'icon', icon: 'question', className: 'decor-icon--help decor-icon--lg decor-pos--faq-help' },
    { kind: 'crescent', className: 'decor-crescent--faq is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--faq-star is-accent' },
  ],
  footer: [
    { kind: 'arch', className: 'decor-arch--footer' },
    { kind: 'crescent', className: 'decor-crescent--footer is-accent' },
    { kind: 'icon', icon: 'book', className: 'decor-icon--book decor-icon--md decor-pos--footer-book' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--footer-star is-accent' },
  ],
  default: [
    { kind: 'icon', icon: 'book', className: 'decor-icon--book decor-icon--md decor-pos--default-book is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--default-star' },
  ],
};

function SectionDecorations({ variant = 'light', type = 'default' }: { variant?: DecorationVariant; type?: DecorationType }) {
  return (
    <div className={`section-decorations section-decorations--${variant} section-decorations--${type}`} aria-hidden="true">
      {sectionDecorationItems[type].map((item, index) => {
        if (item.kind === 'arch') {
          return <span className={`decor-arch ${item.className}`} key={`${item.kind}-${index}`} />;
        }

        if (item.kind === 'crescent') {
          return <span className={`decor-crescent ${item.className}`} key={`${item.kind}-${index}`} />;
        }

        return (
          <span className={`decor-icon ${item.className}`} key={`${item.icon}-${index}`}>
            <Icon name={item.icon} />
          </span>
        );
      })}
    </div>
  );
}

function HeroSection({ onSelectBookingType }: { onSelectBookingType: (type: BookingType) => void }) {
  const { t } = useTranslation();

  return (
    <section className="hero section-dark" id="home">
      <div className="hero__overlay" />
      <div className="hero__pattern" />
      <div className="container hero__inner">
        <div className="hero__content">
          <div className="hero__eyebrow">
            <span>{t('hero.eyebrow.live')}</span>
            <i />
            <span>{t('hero.eyebrow.personalized')}</span>
            <i />
            <span>{t('hero.eyebrow.trusted')}</span>
          </div>
          <h1>
            {t('hero.headlineLine1')}<br />
            {t('hero.headlineLine2')}<br />
            <span>{t('hero.headlineAccent')}</span>
          </h1>
          <p>{t('hero.description')}</p>
          <Button href="#book-trial" icon="calendar" className="hero__cta" onClick={(event) => { event.preventDefault(); onSelectBookingType('trial'); document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{t('hero.cta')}</Button>
          <div className="hero-trust">
            <div><Icon name="laptop" /><span>{t('hero.trust.online')}</span></div>
            <div><Icon name="clock" /><span>{t('hero.trust.schedule')}</span></div>
            <div><Icon name="star" /><span>{t('hero.trust.levels')}</span></div>
          </div>
        </div>
      </div>
      <div className="hero-curve" />
    </section>
  );
}

function BookingSection({ activeBookingType, onBookingTypeChange }: { activeBookingType: BookingType; onBookingTypeChange: (type: BookingType) => void }) {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<BookingLeadData | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const isTraining = activeBookingType === 'training';
  const heading = isTraining ? t('booking.titleTraining') : t('booking.titleTrial');
  const description = isTraining ? t('booking.descTraining') : t('booking.descTrial');
  const successMessage = isTraining ? t('booking.successTraining') : t('booking.successTrial');

  useEffect(() => {
    setErrors({});
    setIsSubmitting(false);
    setSubmittedLead(null);
    setSubmitError('');
    setFormResetKey((key) => key + 1);
  }, [activeBookingType]);

  function getFormValue(formData: FormData, field: string) {
    return String(formData.get(field) || '').trim();
  }

  function getFieldError(field: string) {
    return errors[field] ? <span className="field-error">{errors[field]}</span> : null;
  }

  function getOptionLabel(group: string, value: string) {
    return value ? t(`booking.options.${group}.${value}`, { defaultValue: value }) : '';
  }

  function getProgramLabel(value: string) {
    return value ? t(`programs.items.${value}.title`, { defaultValue: value }) : '';
  }

  function buildWhatsAppUrl(leadData: BookingLeadData) {
    const message = leadData.requestType === 'Teacher Training'
      ? [
        t('booking.whatsapp.trainingIntro'),
        '',
        `${t('booking.whatsapp.requestType')}: ${t('booking.requestTypes.teacherTraining')}`,
        `${t('booking.whatsapp.name')}: ${leadData.name}`,
        `${t('booking.whatsapp.whatsapp')}: ${leadData.whatsapp}`,
        `${t('booking.whatsapp.country')}: ${leadData.country}`,
        `${t('booking.whatsapp.experience')}: ${leadData.experience}`,
        `${t('booking.whatsapp.qualification')}: ${leadData.qualification}`,
        `${t('booking.whatsapp.trainingGoal')}: ${leadData.trainingGoal}`,
        `${t('booking.whatsapp.preferredTime')}: ${leadData.preferredTime}`,
        `${t('booking.whatsapp.message')}: ${leadData.message}`,
      ].join('\n')
      : [
        t('booking.whatsapp.trialIntro'),
        '',
        `${t('booking.whatsapp.requestType')}: ${t('booking.requestTypes.freeTrial')}`,
        `${t('booking.whatsapp.name')}: ${leadData.name}`,
        `${t('booking.whatsapp.whatsapp')}: ${leadData.whatsapp}`,
        `${t('booking.whatsapp.country')}: ${leadData.country}`,
        `${t('booking.whatsapp.studentAge')}: ${leadData.age}`,
        `${t('booking.whatsapp.program')}: ${leadData.program}`,
        `${t('booking.whatsapp.preferredTime')}: ${leadData.preferredTime}`,
        `${t('booking.whatsapp.message')}: ${leadData.message}`,
      ].join('\n');

    return `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const requiredFields = isTraining
      ? ['name', 'whatsapp', 'country', 'experience', 'qualification', 'trainingGoal', 'preferredTime']
      : ['name', 'whatsapp', 'country', 'age', 'program', 'preferredTime'];
    const nextErrors: Record<string, string> = {};

    requiredFields.forEach((field) => {
      if (!getFormValue(formData, field)) {
        nextErrors[field] = t('booking.validation.required');
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitError('');

    const leadData: BookingLeadData = isTraining
      ? {
        requestType: 'Teacher Training',
        name: getFormValue(formData, 'name'),
        whatsapp: getFormValue(formData, 'whatsapp'),
        country: getFormValue(formData, 'country'),
        experience: getOptionLabel('experience', getFormValue(formData, 'experience')),
        qualification: getOptionLabel('qualification', getFormValue(formData, 'qualification')),
        trainingGoal: getOptionLabel('trainingGoal', getFormValue(formData, 'trainingGoal')),
        preferredTime: getOptionLabel('preferredTime', getFormValue(formData, 'preferredTime')),
        message: getFormValue(formData, 'message'),
        source: 'Musliman Academy Website',
      }
      : {
        requestType: 'Free Trial',
        name: getFormValue(formData, 'name'),
        whatsapp: getFormValue(formData, 'whatsapp'),
        country: getFormValue(formData, 'country'),
        age: getOptionLabel('studentAge', getFormValue(formData, 'age')),
        program: getProgramLabel(getFormValue(formData, 'program')),
        preferredTime: getOptionLabel('preferredTime', getFormValue(formData, 'preferredTime')),
        message: getFormValue(formData, 'message'),
        source: 'Musliman Academy Website',
      };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(leadData),
      });

      setSubmittedLead(leadData);
    } catch (error) {
      setSubmitError(t('booking.validation.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetRequest() {
    setErrors({});
    setIsSubmitting(false);
    setSubmittedLead(null);
    setSubmitError('');
    setFormResetKey((key) => key + 1);
  }

  return (
    <section id="book-trial" className="booking-section section-light">
      <SectionDecorations variant="light" type="trial" />
      <div className="container">
        <div className="booking-card">
          <div className="booking-heading">
            <SectionBadge icon={isTraining ? 'award' : 'calendar'}>{isTraining ? t('booking.badgeTraining') : t('booking.badgeTrial')}</SectionBadge>
            <h2>{heading}</h2>
            <p>{description}</p>
          </div>

          <div className="booking-toggle" role="tablist" aria-label={t('aria.bookingType')}>
            <button
              type="button"
              role="tab"
              aria-selected={!isTraining}
              className={`booking-toggle__btn ${activeBookingType === 'trial' ? 'is-active' : ''}`}
              onClick={() => onBookingTypeChange('trial')}
            >
              {t('booking.toggleTrial')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isTraining}
              className={`booking-toggle__btn ${activeBookingType === 'training' ? 'is-active' : ''}`}
              onClick={() => onBookingTypeChange('training')}
            >
              {t('booking.toggleTraining')}
            </button>
          </div>

          {submittedLead ? (
            <div className="booking-success">
              <Icon name="shieldCheck" />
              <h3>{t('booking.successTitle')}</h3>
              <p>{successMessage}</p>
              <div className="booking-success__actions">
                <a className="btn whatsapp-btn" href={buildWhatsAppUrl(submittedLead)} target="_blank" rel="noreferrer">
                  <Icon name="whatsapp" />
                  <span>{t('booking.continueWhatsapp')}</span>
                </a>
                <button className="btn btn-primary" type="button" onClick={resetRequest}>
                  <Icon name="send" />
                  <span>{t('booking.submitAnother')}</span>
                </button>
              </div>
            </div>
          ) : (
            <form className="booking-form" onSubmit={handleSubmit} noValidate key={`${activeBookingType}-${formResetKey}`}>
              <div className="form-grid">
                <label>
                  <span>{t('booking.fields.name')}</span>
                  <input type="text" name="name" placeholder={t('booking.placeholders.name')} aria-invalid={Boolean(errors.name)} />
                  {getFieldError('name')}
                </label>
                <label>
                  <span>{t('booking.fields.whatsapp')}</span>
                  <input type="tel" name="whatsapp" placeholder={t('booking.placeholders.whatsapp')} aria-invalid={Boolean(errors.whatsapp)} />
                  {getFieldError('whatsapp')}
                </label>
                <label>
                  <span>{t('booking.fields.country')}</span>
                  <select name="country" defaultValue="" aria-invalid={Boolean(errors.country)}>
                    <option value="" disabled>{t('booking.placeholders.country')}</option>
                    {countryOptions.map((country) => <option key={country}>{country}</option>)}
                  </select>
                  {getFieldError('country')}
                </label>

                {isTraining ? (
                  <>
                    <label>
                      <span>{t('booking.fields.experience')}</span>
                      <select name="experience" defaultValue="" aria-invalid={Boolean(errors.experience)}>
                        <option value="" disabled>{t('booking.placeholders.experience')}</option>
                        {experienceOptions.map((option) => <option value={option} key={option}>{getOptionLabel('experience', option)}</option>)}
                      </select>
                      {getFieldError('experience')}
                    </label>
                    <label>
                      <span>{t('booking.fields.qualification')}</span>
                      <select name="qualification" defaultValue="" aria-invalid={Boolean(errors.qualification)}>
                        <option value="" disabled>{t('booking.placeholders.qualification')}</option>
                        {qualificationOptions.map((option) => <option value={option} key={option}>{getOptionLabel('qualification', option)}</option>)}
                      </select>
                      {getFieldError('qualification')}
                    </label>
                    <label>
                      <span>{t('booking.fields.trainingGoal')}</span>
                      <select name="trainingGoal" defaultValue="" aria-invalid={Boolean(errors.trainingGoal)}>
                        <option value="" disabled>{t('booking.placeholders.trainingGoal')}</option>
                        {trainingGoalOptions.map((option) => <option value={option} key={option}>{getOptionLabel('trainingGoal', option)}</option>)}
                      </select>
                      {getFieldError('trainingGoal')}
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      <span>{t('booking.fields.studentAge')}</span>
                      <select name="age" defaultValue="" aria-invalid={Boolean(errors.age)}>
                        <option value="" disabled>{t('booking.placeholders.studentAge')}</option>
                        {studentAgeOptions.map((option) => <option value={option} key={option}>{getOptionLabel('studentAge', option)}</option>)}
                      </select>
                      {getFieldError('age')}
                    </label>
                    <label>
                      <span>{t('booking.fields.program')}</span>
                      <select name="program" defaultValue="" aria-invalid={Boolean(errors.program)}>
                        <option value="" disabled>{t('booking.placeholders.program')}</option>
                        {programs.map((program) => <option value={program.key} key={program.key}>{getProgramLabel(program.key)}</option>)}
                      </select>
                      {getFieldError('program')}
                    </label>
                  </>
                )}

                <label>
                  <span>{isTraining ? t('booking.fields.preferredTrainingTime') : t('booking.fields.preferredClassTime')}</span>
                  <select name="preferredTime" defaultValue="" aria-invalid={Boolean(errors.preferredTime)}>
                    <option value="" disabled>{t('booking.placeholders.preferredTime')}</option>
                    {preferredTimeOptions.map((option) => <option value={option} key={option}>{getOptionLabel('preferredTime', option)}</option>)}
                  </select>
                  {getFieldError('preferredTime')}
                </label>
                <label className="form-grid__full">
                  <span>{t('booking.fields.message')}</span>
                  <textarea name="message" maxLength={300} placeholder={t('booking.placeholders.message')} />
                </label>
              </div>
              {submitError && <div className="booking-form__error">{submitError}</div>}
              <button className="btn btn-primary booking-form__button" type="submit" disabled={isSubmitting}>
                <Icon name="send" />
                <span>{isSubmitting ? t('booking.submitting') : isTraining ? t('booking.submitTraining') : t('booking.submitTrial')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const { t } = useTranslation();

  return (
    <section className="about-section section-light" id="about">
      <SectionDecorations variant="light" type="about" />
      <div className="container about-container about-section__grid">
        <div className="about-visual">
          <img
            src="/assets/about-visual.png"
            alt={t('about.imageAlt')}
            className="about-visual__image"
            loading="lazy"
          />
        </div>
        <div className="about-content">
          <SectionBadge icon="star">{t('about.badge')}</SectionBadge>
          <h2>{t('about.heading')}</h2>
          <p className="about-lead">{t('about.lead')}</p>
          <p>{t('about.paragraph1')}</p>
          <p>{t('about.paragraph2')}</p>
        </div>
      </div>
    </section>
  );
}

function TrustBarSection() {
  const { t } = useTranslation();

  return (
    <section className="trust-section section-light" aria-label={t('aria.trustHighlights')}>
      <SectionDecorations variant="light" type="default" />
      <div className="container">
        <div className="trust-bar">
          {trustItems.map((item) => (
            <div key={item.key} className="trust-bar__item">
              <Icon name={item.icon} />
              <span>{t(`trust.${item.key}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramsSection() {
  const { t } = useTranslation();

  return (
    <section className="programs section-light" id="programs">
      <SectionDecorations variant="light" type="programs" />
      <div className="container">
        <div className="section-heading section-heading--center">
          <SectionBadge icon="star">{t('programs.badge')}</SectionBadge>
          <h2>{t('programs.heading')}</h2>
          <p>{t('programs.description')}</p>
        </div>
        <div className="program-grid">
          {programs.map((program) => (
            <article className="program-card" key={program.key}>
              <span className="program-card__number">{program.number}</span>
              <div className="program-card__visual">
                <img
                  src={program.image}
                  alt={`${t(`programs.items.${program.key}.title`)} illustration`}
                  className="program-card__image"
                  loading="lazy"
                />
              </div>
              <h3>{t(`programs.items.${program.key}.title`)}</h3>
              <p>{t(`programs.items.${program.key}.text`)}</p>
              <a href="#book-trial">{t('programs.learnMore')} <span>-&gt;</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { t } = useTranslation();
  const [activeCurrency, setActiveCurrency] = useState<PricingCurrency>('USD');
  const currentPricing = pricingData[activeCurrency];
  const currencyEntries = Object.entries(pricingData) as Array<[PricingCurrency, (typeof pricingData)[PricingCurrency]]>;

  return (
    <section className="pricing-section section-light" id="schedule-fee">
      <SectionDecorations variant="light" type="pricing" />
      <div className="container pricing-container">
        <div className="section-heading pricing-heading">
          <SectionBadge icon="calendar">{t('pricing.badge')}</SectionBadge>
          <h2>{t('pricing.heading')}</h2>
          <p>{t('pricing.subtitle')}</p>
        </div>

        <div className="pricing-tabs-wrap">
          <div className="pricing-tabs" role="tablist" aria-label={t('pricing.currencyAria')}>
            {currencyEntries.map(([key, currency]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeCurrency === key}
                className={`pricing-tab ${activeCurrency === key ? 'is-active' : ''}`}
                onClick={() => setActiveCurrency(key)}
              >
                {currency.label}
              </button>
            ))}
          </div>
        </div>

        <p className="pricing-scroll-hint">Swipe to view all pricing details</p>

        <div className="pricing-table-card">
          <div className="pricing-table-scroll">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th scope="col">{t('pricing.columns.program')}</th>
                  <th scope="col">{t('pricing.columns.tier')}</th>
                  <th scope="col">{t('pricing.columns.oneOnOne')}</th>
                  <th scope="col">{t('pricing.columns.group')}</th>
                  <th scope="col">{t('pricing.columns.monthly')}</th>
                </tr>
              </thead>
              <tbody>
                {currentPricing.rows.map((row) => (
                  <tr key={row.track}>
                    <td>{row.track}</td>
                    <td>
                      <span className={`tier-badge tier-badge--${row.tier.toLowerCase()}`}>
                        {row.tier}
                      </span>
                    </td>
                    <td>{row.oneOnOne}</td>
                    <td>{row.group}</td>
                    <td className="pricing-table__monthly">{row.monthly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="pricing-note">{t('pricing.note')}</p>

        <div className="pricing-cta">
          <p>{t('pricing.ctaText')}</p>
          <Button href="#book-trial" icon="calendar">{t('pricing.cta')}</Button>
        </div>
      </div>
    </section>
  );
}

function WhyChooseSection() {
  const { t } = useTranslation();
  const [cardsPerPage, setCardsPerPage] = useState(getWhyCardsPerPage);
  const [activePage, setActivePage] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const totalPages = Math.ceil(reasons.length / cardsPerPage);

  const visibleCards = reasons.slice(
    activePage * cardsPerPage,
    activePage * cardsPerPage + cardsPerPage,
  );

  function goNext() {
    setActivePage((prev) => (prev + 1) % totalPages);
  }

  function goPrev() {
    setActivePage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  }

  useEffect(() => {
    if (isSliderPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActivePage((prev) => (prev + 1) % totalPages);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isSliderPaused, totalPages]);

  useEffect(() => {
    function handleResize() {
      setCardsPerPage(getWhyCardsPerPage());
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setActivePage((prev) => Math.min(prev, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  return (
    <section className="why-section section-light" id="why-choose-us">
      <SectionDecorations variant="light" type="why" />
      <div className="container why-container">
        <div className="why-top">
          <div className="why-top__content">
            <SectionBadge icon="star">{t('whyChoose.badge')}</SectionBadge>
            <h2><span>{t('whyChoose.headingLine1')}</span><br /><span>{t('whyChoose.headingLine2')}</span></h2>
            <div className="why-intro-card">
              <p>{t('whyChoose.intro.paragraph1')}</p>
              <p>{t('whyChoose.intro.paragraph2')}</p>
            </div>
          </div>
          <WhyChooseVisual />
        </div>

        <div
          className="why-slider-area"
          onMouseEnter={() => setIsSliderPaused(true)}
          onMouseLeave={() => setIsSliderPaused(false)}
        >
          <div className="why-slider-header">
            <div className="why-slider-controls">
              <button type="button" className="why-slider-btn" onClick={goPrev} aria-label={t('aria.previousFeature')}>
                <span aria-hidden="true">&lt;</span>
              </button>
              <span className="why-slider-count">{activePage + 1} / {totalPages}</span>
              <button type="button" className="why-slider-btn" onClick={goNext} aria-label={t('aria.nextFeature')}>
                <span aria-hidden="true">&gt;</span>
              </button>
            </div>
          </div>

          <div className="why-cards-grid">
            {visibleCards.map((item, index) => (
              <article className="why-card" key={`${item.key}-${index}`}>
                <span className="why-card__number">{activePage * cardsPerPage + index + 1}</span>
                <div className="why-card__icon">
                  <Icon name={item.icon} />
                </div>
                <h3>{t(`whyChoose.items.${item.key}.title`)}</h3>
                <div className="why-card__line" />
                <p>{t(`whyChoose.items.${item.key}.description`)}</p>
              </article>
            ))}
          </div>

          <div className="why-slider-dots">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                type="button"
                key={index}
                className={`why-dot ${index === activePage ? 'is-active' : ''}`}
                onClick={() => setActivePage(index)}
                aria-label={t('aria.showFeaturePage', { page: index + 1 })}
              />
            ))}
          </div>
        </div>

        <div className="why-stats why-stats-bar">
          <div className="why-stat"><Icon name="award" /><strong>10,000+</strong><span>{t('whyChoose.stats.students')}</span></div>
          <div className="why-stat"><Icon name="users" /><strong>50+</strong><span>{t('whyChoose.stats.teachers')}</span></div>
          <div className="why-stat"><Icon name="globe" /><strong>30+</strong><span>{t('whyChoose.stats.countries')}</span></div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  function goNext() {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }

  function goPrev() {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  }

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  const visibleTestimonials = Array.from({ length: 3 }, (_, offset) => testimonials[(activeIndex + offset) % testimonials.length]);

  return (
    <section className="testimonials-section section-light" id="testimonials">
      <SectionDecorations variant="light" type="testimonials" />
      <div className="container testimonials-container">
        <div className="section-heading testimonials-heading">
          <SectionBadge icon="star">Student & Parent Stories</SectionBadge>
          <h2>What Our Learners Say</h2>
          <p>Real feedback from learners and parents who started their Quran and Arabic learning journey with Musliman Academy.</p>
        </div>

        <div
          className="testimonials-slider-area"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="testimonials-controls">
            <button type="button" className="testimonial-btn" onClick={goPrev} aria-label="Previous testimonial">
              <Icon name="chevronLeft" />
            </button>
            <button type="button" className="testimonial-btn" onClick={goNext} aria-label="Next testimonial">
              <Icon name="chevronRight" />
            </button>
          </div>

          <div className="testimonials-grid">
            {visibleTestimonials.map((item, index) => (
              <article
                className={`testimonial-card ${index === 1 ? 'is-featured' : ''}`}
                key={`${item.name}-${item.program}-${index}`}
              >
                <div className="testimonial-quote-mark" aria-hidden="true" />

                <div className="testimonial-rating" role="img" aria-label={`${item.rating} star rating`}>
                  {Array.from({ length: item.rating }).map((_, starIndex) => (
                    <Icon key={starIndex} name="star" />
                  ))}
                </div>

                <p className="testimonial-quote">{item.quote}</p>

                <div className="testimonial-footer">
                  <div className="testimonial-avatar">
                    <Icon name="user" />
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.role}</p>
                  </div>
                </div>

                <span className="testimonial-program">{item.program}</span>
              </article>
            ))}
          </div>

          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <button
                type="button"
                key={index}
                className={`testimonial-dot ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="testimonials-cta">
          <p>Ready to start your learning journey?</p>
          <Button href="#book-trial" icon="calendar">Book a Free Trial</Button>
        </div>
      </div>
    </section>
  );
}

function VideoStoriesSection() {
  const [activeVideo, setActiveVideo] = useState<VideoStory>(videoStories[0]);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    if (!isVideoOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsVideoOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVideoOpen]);

  return (
    <section className="video-stories-section section-dark" id="video-stories">
      <div className="video-stories-bg-icon video-stories-bg-icon--one" aria-hidden="true" />
      <div className="video-stories-bg-icon video-stories-bg-icon--two" aria-hidden="true" />

      <div className="container video-stories-container">
        <div className="video-stories-header">
          <div className="section-badge section-badge--dark">
            <Icon name="play" />
            <span>Real Learning Moments</span>
          </div>

          <h2>Watch How Our Students Learn with Confidence</h2>

          <div className="section-divider" aria-hidden="true" />

          <p>
            Short video stories from students, parents, and teachers showing how Musliman Academy supports Quran, Arabic, and Islamic learning step by step.
          </p>
        </div>

        <div className="video-stories-layout">
          <div className="video-feature-card">
            <img
              src={activeVideo.thumbnail}
              alt={activeVideo.title}
              className="video-feature-card__image"
              loading="lazy"
            />

            <div className="video-feature-card__overlay" />

            <div className="video-feature-card__top">
              <span className="video-label">
                <Icon name="users" />
                {activeVideo.label}
              </span>

              <span className="video-duration">{activeVideo.duration}</span>
            </div>

            <button
              type="button"
              className="video-play-button"
              aria-label={`Play ${activeVideo.title}`}
              onClick={() => setIsVideoOpen(true)}
            >
              <Icon name="play" />
            </button>

            <div className="video-feature-card__content">
              <h3>{activeVideo.title}</h3>

              <div className="video-progress-line" aria-hidden="true">
                <span />
              </div>
            </div>
          </div>

          <aside className="video-playlist-card">
            <div className="video-playlist-title">
              <Icon name="list" />
              <span>Video Playlist</span>
            </div>

            <div className="video-playlist-list">
              {videoStories.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`video-playlist-item ${activeVideo.id === item.id ? 'is-active' : ''}`}
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveVideo(item);
                    setIsVideoOpen(true);
                  }}
                >
                  <span className="video-playlist-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="video-playlist-thumb">
                    <img src={item.thumbnail} alt="" loading="lazy" />
                    <span className="video-playlist-thumb__play">
                      <Icon name="play" />
                    </span>
                  </span>

                  <span className="video-playlist-text">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>

                  <span className="video-playlist-duration">{item.duration}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>

        <div className="video-stories-cta">
          <div className="video-stories-cta__icon">
            <Icon name="star" />
          </div>

          <div>
            <h3>Want your child to start their journey?</h3>
            <p>Book a free trial class and experience the difference.</p>
          </div>

          <Button href="#book-trial" icon="calendar" className="video-stories-cta__button">
            Book a Free Trial Class
          </Button>
        </div>
      </div>

      {isVideoOpen && (
        <div
          className="video-modal"
          role="dialog"
          aria-modal="true"
          aria-label={activeVideo.title}
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="video-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="video-modal__close"
              aria-label="Close video"
              onClick={() => setIsVideoOpen(false)}
            >
              <Icon name="x" />
            </button>

            <div className="video-modal__player">
              {activeVideo.type === 'embed' ? (
                <iframe
                  src={activeVideo.videoUrl}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video controls autoPlay poster={activeVideo.thumbnail}>
                  <source src={activeVideo.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="how section-warm section-light" id="how-it-works">
      <SectionDecorations variant="light" type="steps" />
      <div className="container">
        <div className="section-heading section-heading--center">
          <span className="eyebrow-line">{t('how.eyebrow')}</span>
          <h2>{t('how.heading')}</h2>
          <p>{t('how.description')}</p>
        </div>
        <div className="steps-grid">
          {howSteps.map((step) => (
            <article className="step-card" key={step.step}>
              <span className="step-card__badge">{step.step}</span>
              <div className="step-card__visual step-card__icon"><Icon name={step.icon} /></div>
              <h3>{t(`how.steps.${step.key}.title`)}</h3>
              <p>{t(`how.steps.${step.key}.text`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeacherTrainingSection({ onSelectBookingType }: { onSelectBookingType: (type: BookingType) => void }) {
  const { t } = useTranslation();

  return (
    <section className="teacher-training-section section-dark" id="teacher-training">
      <SectionDecorations variant="dark" type="training" />
      <div className="container teacher-training-container">
        <div className="teacher-training-content">
          <SectionBadge icon="award" dark>{t('training.badge')}</SectionBadge>
          <h2>{t('training.heading')}</h2>
          <p>{t('training.description')}</p>
          <div className="teacher-training-features">
            {trainingIncludes.map((item) => (
              <div className="teacher-training-feature" key={item.key}><Icon name={item.icon} /><span>{t(`training.includes.${item.key}`)}</span></div>
            ))}
          </div>
          <Button href="#book-trial" icon="award" className="training__cta" onClick={() => onSelectBookingType('training')}>{t('training.cta')}</Button>
        </div>
        <div className="teacher-training-visual">
          <img
            src="/assets/teacher-training-visual.jpg"
            alt="Online Quran teacher training program"
            loading="lazy"
          />
        </div>
        <div className="training-badges">
          {trainingBadges.map((badge) => (
            <div key={badge.key}><Icon name={badge.icon} /><span>{t(`training.badges.${badge.key}`)}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq section-light" id="faq">
      <SectionDecorations variant="light" type="faq" />
      <div className="container">
        <div className="section-heading section-heading--center">
          <span className="eyebrow-line">{t('faq.eyebrow')}</span>
          <h2>{t('faq.heading')}</h2>
          <p>{t('faq.description')}</p>
        </div>
        <div className="faq__grid">
          <div className="accordion-list">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div className={`accordion ${isOpen ? 'is-open' : ''}`} key={faq.key}>
                  <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : index)}>
                    <span className="accordion__icon">{isOpen ? '-' : '+'}</span>
                    <span className="accordion__number">{index + 1}.</span>
                    <strong>{t(`faq.${faq.key}.question`)}</strong>
                    <span className="accordion__chevron" aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div className="accordion__content">
                      <Icon name={faqIcons[index] || 'question'} />
                      <p>{t(`faq.${faq.key}.answer`)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <aside className="faq-card">
            <div className="faq-card__icon faq-icon"><Icon name="phone" /></div>
            <h3>{t('faq.cardTitle')}</h3>
            <p>{t('faq.cardText')}</p>
            <a className="btn whatsapp-btn" href={`https://wa.me/${contact.whatsappNumber}`} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" /> {t('faq.whatsappCta')}
            </a>
            <div className="faq-card__trust"><Icon name="shieldCheck" />{t('faq.trust')}</div>
            <div className="faq-social-block">
              <span className="faq-social-title">Follow us on social media</span>
              <div className="faq-social-links" aria-label="Musliman Academy social media links">
                {faqSocialLinks.map((item) => {
                  const SocialIcon = item.icon;

                  return (
                    <a
                      key={item.name}
                      href={item.url}
                      className={`faq-social-link faq-social-link--${item.className}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow Musliman Academy on ${item.name}`}
                    >
                      <SocialIcon aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useTranslation();
  const quickLinks = navLinks;

  return (
    <footer className="footer section-dark">
      <SectionDecorations variant="dark" type="footer" />
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo variant="light" />
          <p>{t('footer.aboutText')}</p>
          <div className="subscribe-card">
            <Icon name="mail" />
            <strong>{t('footer.stayConnected')}</strong>
            <span>{t('footer.subscribeText')}</span>
            <label>
              <input type="email" placeholder={t('booking.placeholders.email')} />
              <button type="button"><Icon name="send" /></button>
            </label>
          </div>
        </div>
        <div>
          <h3>{t('footer.programs')}</h3>
          <ul>
            {programs.map((program) => <li key={program.key}><a href="#programs"><Icon name={program.icon} />{t(`programs.items.${program.key}.title`)}</a></li>)}
            <li><a href="#teacher-training"><Icon name="award" />{t('footer.teacherTraining')}</a></li>
          </ul>
        </div>
        <div>
          <h3>{t('footer.quickLinks')}</h3>
          <ul>
            {quickLinks.map((link) => <li key={link.href}><a href={link.href}><Icon name="link" />{t(link.labelKey)}</a></li>)}
            <li><a href="#book-trial"><Icon name="link" />{t('footer.bookFreeTrial')}</a></li>
          </ul>
        </div>
        <div className="footer__contact">
          <h3>{t('footer.contact')}</h3>
          <a href={`https://wa.me/${contact.whatsappNumber}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" /><span>{t('footer.whatsapp')}<br /><small>{contact.whatsappDisplay}</small></span></a>
          <a href={`mailto:${contact.email}`}><Icon name="mail" /><span>{t('footer.email')}<br /><small>{contact.email}</small></span></a>
          <a href="#home"><Icon name="globe" /><span>{t('footer.website')}<br /><small>{contact.website}</small></span></a>
          <div className="social-links">
            {faqSocialLinks.map((item) => {
              const SocialIcon = item.icon;

              return (
                <a
                  key={item.name}
                  href={item.url}
                  className={`faq-social-link--${item.className}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow Musliman Academy on ${item.name}`}
                >
                  <SocialIcon aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>{t('footer.copyright')}</span>
        <span><Icon name="shieldCheck" /> {t('footer.trusted')}</span>
      </div>
    </footer>
  );
}

export default function App() {
  const { i18n, t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedTheme = window.localStorage.getItem('musliman-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [activeBookingType, setActiveBookingType] = useState<BookingType>('trial');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('musliman-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.title = t('seo.title');
    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = t('seo.description');
    }
  }, [i18n.resolvedLanguage, t]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} onSelectBookingType={setActiveBookingType} />
      <main>
        <HeroSection onSelectBookingType={setActiveBookingType} />
        <BookingSection activeBookingType={activeBookingType} onBookingTypeChange={setActiveBookingType} />
        <AboutSection />
        <TrustBarSection />
        <ProgramsSection />
        <PricingSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <VideoStoriesSection />
        <HowItWorksSection />
        <TeacherTrainingSection onSelectBookingType={setActiveBookingType} />
        <FAQSection />
      </main>
      <Footer />
      <a className="floating-whatsapp" href={`https://wa.me/${contact.whatsappNumber}`} target="_blank" rel="noreferrer" aria-label={t('aria.floatingWhatsapp')}>
        <Icon name="whatsapp" />
      </a>
    </div>
  );
}
