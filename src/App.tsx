import { FormEvent, useEffect, useState } from 'react';
import './styles.css';
import Icon, { IconName } from './components/Icon';
import Logo from './components/Logo';
import {
  audiences,
  contact,
  countryOptions,
  faqs,
  howSteps,
  navLinks,
  programs,
  trainingBadges,
  trainingIncludes,
  trustItems,
} from './data/siteData';

type Theme = 'light' | 'dark';
type BookingType = 'trial' | 'training';
type DecorationVariant = 'light' | 'dark';
type DecorationType = 'hero' | 'trial' | 'about' | 'programs' | 'who' | 'why' | 'steps' | 'training' | 'faq' | 'footer' | 'default';

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

const whyChooseItems: Array<{ title: string; description: string; icon: IconName }> = [
  {
    title: 'Qualified Egyptian Teachers',
    description: 'Learn with experienced, patient, and certified Egyptian teachers.',
    icon: 'teacher',
  },
  {
    title: 'Al-Azhar Educational Background',
    description: 'Strong foundation in authentic Islamic knowledge and values.',
    icon: 'mosque',
  },
  {
    title: 'Simple Approach for Non-Arabic Speakers',
    description: 'Step-by-step lessons designed to build understanding and confidence.',
    icon: 'chat',
  },
  {
    title: 'Suitable for All Levels',
    description: 'From beginner to advanced, we have the right program for you.',
    icon: 'star',
  },
  {
    title: 'Flexible One-to-One and Small Group Classes',
    description: 'Choose the format that suits your schedule and goals.',
    icon: 'users',
  },
  {
    title: 'Parent Follow-up & Reports',
    description: "Stay informed with regular updates on your child's progress.",
    icon: 'clipboard',
  },
  {
    title: 'Safe Online Learning Environment',
    description: 'A secure, respectful, and moderated space for focused Islamic learning.',
    icon: 'shield',
  },
  {
    title: 'Free Trial Class',
    description: 'Try a class for free and experience the Musliman Academy difference.',
    icon: 'gift',
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

function Button({ href, children, icon = 'calendar', className = '', onClick }: { href: string; children: string; icon?: IconName; className?: string; onClick?: () => void }) {
  return (
    <a className={`btn btn-primary ${className}`} href={href} onClick={onClick}>
      <Icon name={icon} />
      <span>{children}</span>
    </a>
  );
}

function ThemeToggle({ theme, onToggle, className = '' }: { theme: Theme; onToggle: () => void; className?: string }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      className={`theme-toggle ${className}`}
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={theme === 'dark'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}

function Navbar({ theme, onToggleTheme, onSelectBookingType }: { theme: Theme; onToggleTheme: () => void; onSelectBookingType: (type: BookingType) => void }) {
  const [open, setOpen] = useState(false);
  const logoVariant = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo variant={logoVariant} />
        <nav className="navbar__links" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>
        <div className="navbar__actions">
          <a className="whatsapp-circle" href={`https://wa.me/${contact.whatsappNumber}`} aria-label="Contact on WhatsApp" target="_blank" rel="noreferrer">
            <Icon name="whatsapp" />
          </a>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <Button href="#book-trial" onClick={() => onSelectBookingType('trial')}>Book Free Trial</Button>
          <button className="menu-button" type="button" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
        </div>
      </div>
      <div className={`mobile-panel ${open ? 'is-open' : ''}`}>
        <div className="mobile-panel__top">
          <Logo variant={logoVariant} />
          <button className="menu-button" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
            <Icon name="x" />
          </button>
        </div>
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
        ))}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} className="theme-toggle--mobile" />
        <Button
          href="#book-trial"
          className="mobile-panel__cta"
          onClick={() => {
            onSelectBookingType('trial');
            setOpen(false);
          }}
        >
          Book Free Trial
        </Button>
      </div>
    </header>
  );
}

function ClassIllustration({ mode = 'hero' }: { mode?: 'hero' | 'light' | 'training' }) {
  return (
    <div className={`class-visual class-visual--${mode}`}>
      <div className="arch-frame" />
      <div className="floating-star star-one">*</div>
      <div className="floating-star star-two">*</div>
      <div className="desk-top">
        <div className="quran-book"><span>Quran</span></div>
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
            <span>Quran Reading</span>
            <span>Step by step learning</span>
          </div>
          <div className="meeting-dots"><i /><i /><i /></div>
        </div>
        <div className="laptop-base" />
      </div>
      <div className="student student-one" />
      <div className="student student-two" />
      {mode === 'training' && (
        <div className="mini-call-grid">
          <span /><span /><span /><span />
        </div>
      )}
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <img src="/assets/hero-visual.jpg" alt="" />
    </div>
  );
}

function WhoWeTeachVisual() {
  return (
    <div className="who-visual">
      <img src="/assets/who-we-teach-visual.jpg" alt="Online learning for different students" />
    </div>
  );
}

function WhyChooseVisual() {
  return (
    <div className="why-visual">
      <img src="/assets/why-choose-visual.jpg" alt="Trusted online Quran learning experience" />
    </div>
  );
}

const sectionDecorationItems: Record<DecorationType, DecorationItem[]> = {
  hero: [
    { kind: 'arch', className: 'decor-arch--hero' },
    { kind: 'crescent', className: 'decor-crescent--hero is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--hero-star-one' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--hero-star-two is-accent' },
  ],
  trial: [
    { kind: 'icon', icon: 'bookOpen', className: 'decor-icon--book decor-icon--md decor-pos--trial-book is-accent' },
    { kind: 'crescent', className: 'decor-crescent--trial' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--trial-star is-accent' },
  ],
  about: [
    { kind: 'icon', icon: 'quranStand', className: 'decor-icon--book decor-icon--xl decor-pos--about-book is-accent' },
    { kind: 'icon', icon: 'globe', className: 'decor-icon--globe decor-icon--md decor-pos--about-globe' },
    { kind: 'crescent', className: 'decor-crescent--about is-accent' },
  ],
  programs: [
    { kind: 'icon', icon: 'bookOpen', className: 'decor-icon--book decor-icon--lg decor-pos--programs-book' },
    { kind: 'icon', icon: 'arabicLetters', className: 'decor-icon--arabic decor-icon--md decor-pos--programs-arabic is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--programs-star is-accent' },
  ],
  who: [
    { kind: 'icon', icon: 'globe', className: 'decor-icon--globe decor-icon--lg decor-pos--who-globe' },
    { kind: 'icon', icon: 'bookOpen', className: 'decor-icon--book decor-icon--md decor-pos--who-book is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--who-star is-accent' },
  ],
  why: [
    { kind: 'arch', className: 'decor-arch--why' },
    { kind: 'icon', icon: 'shield', className: 'decor-icon--shield decor-icon--lg decor-pos--why-shield' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--why-star is-accent' },
  ],
  steps: [
    { kind: 'icon', icon: 'calendar', className: 'decor-icon--calendar decor-icon--lg decor-pos--steps-calendar' },
    { kind: 'icon', icon: 'bookOpen', className: 'decor-icon--book decor-icon--md decor-pos--steps-book is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--steps-star is-accent' },
  ],
  training: [
    { kind: 'arch', className: 'decor-arch--training' },
    { kind: 'icon', icon: 'teacher', className: 'decor-icon--graduation decor-icon--lg decor-pos--training-teacher' },
    { kind: 'icon', icon: 'certificate', className: 'decor-icon--certificate decor-icon--md decor-pos--training-certificate is-accent' },
    { kind: 'icon', icon: 'bookOpen', className: 'decor-icon--book decor-icon--md decor-pos--training-book' },
  ],
  faq: [
    { kind: 'icon', icon: 'chat', className: 'decor-icon--help decor-icon--lg decor-pos--faq-help' },
    { kind: 'crescent', className: 'decor-crescent--faq is-accent' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--faq-star is-accent' },
  ],
  footer: [
    { kind: 'arch', className: 'decor-arch--footer' },
    { kind: 'crescent', className: 'decor-crescent--footer is-accent' },
    { kind: 'icon', icon: 'bookOpen', className: 'decor-icon--book decor-icon--md decor-pos--footer-book' },
    { kind: 'icon', icon: 'star', className: 'decor-icon--star decor-icon--sm decor-pos--footer-star is-accent' },
  ],
  default: [
    { kind: 'icon', icon: 'bookOpen', className: 'decor-icon--book decor-icon--md decor-pos--default-book is-accent' },
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
  return (
    <section className="hero section-dark" id="home">
      <SectionDecorations variant="dark" type="hero" />
      <div className="container hero__grid">
        <div className="hero__content">
          <div className="hero__eyebrow">
            <span>Live</span>
            <i />
            <span>Personalized</span>
            <i />
            <span>Trusted</span>
          </div>
          <h1>
            Start Your Quran and<br />
            Arabic Learning Journey<br />
            <span>Today</span>
          </h1>
          <p>Book a free trial class for you or your child and experience our live, one-to-one Islamic learning with qualified Egyptian teachers.</p>
          <Button href="#book-trial" icon="calendar" className="hero__cta" onClick={() => onSelectBookingType('trial')}>Book Your Free Trial Class</Button>
          <div className="hero-trust">
            <div><Icon name="laptop" /><span>Online Classes</span></div>
            <div><Icon name="clock" /><span>Flexible Schedule</span></div>
            <div><Icon name="star" /><span>All Levels Welcome</span></div>
          </div>
        </div>
      </div>
      <HeroVisual />
      <div className="hero-curve" />
    </section>
  );
}

function BookingSection({ activeBookingType, onBookingTypeChange }: { activeBookingType: BookingType; onBookingTypeChange: (type: BookingType) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<BookingLeadData | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  const isTraining = activeBookingType === 'training';
  const heading = isTraining ? 'Join Teacher Training' : 'Book a Free Trial';
  const description = isTraining
    ? 'Tell us about your teaching background and our team will contact you with the suitable training path.'
    : 'Fill in the form below and our team will get in touch with you.';
  const successMessage = isTraining
    ? 'Your teacher training request has been received. Our team will contact you shortly.'
    : 'Your free trial request has been received. Our team will contact you shortly.';

  useEffect(() => {
    setErrors({});
    setIsSubmitting(false);
    setSubmittedLead(null);
    setFormResetKey((key) => key + 1);
  }, [activeBookingType]);

  function getFormValue(formData: FormData, field: string) {
    return String(formData.get(field) || '').trim();
  }

  function getFieldError(field: string) {
    return errors[field] ? <span className="field-error">{errors[field]}</span> : null;
  }

  function buildWhatsAppUrl(leadData: BookingLeadData) {
    const message = leadData.requestType === 'Teacher Training'
      ? [
        'Hello Musliman Academy, I would like to join the Teacher Training program.',
        '',
        'Request Type: Teacher Training',
        `Name: ${leadData.name}`,
        `WhatsApp: ${leadData.whatsapp}`,
        `Country: ${leadData.country}`,
        `Teaching Experience: ${leadData.experience}`,
        `Current Qualification: ${leadData.qualification}`,
        `Training Goal: ${leadData.trainingGoal}`,
        `Preferred Time: ${leadData.preferredTime}`,
        `Message: ${leadData.message}`,
      ].join('\n')
      : [
        'Hello Musliman Academy, I would like to book a free trial class.',
        '',
        'Request Type: Free Trial',
        `Name: ${leadData.name}`,
        `WhatsApp: ${leadData.whatsapp}`,
        `Country: ${leadData.country}`,
        `Student Age: ${leadData.age}`,
        `Program: ${leadData.program}`,
        `Preferred Time: ${leadData.preferredTime}`,
        `Message: ${leadData.message}`,
      ].join('\n');

    return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
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
        nextErrors[field] = 'This field is required.';
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const leadData: BookingLeadData = isTraining
      ? {
        requestType: 'Teacher Training',
        name: getFormValue(formData, 'name'),
        whatsapp: getFormValue(formData, 'whatsapp'),
        country: getFormValue(formData, 'country'),
        experience: getFormValue(formData, 'experience'),
        qualification: getFormValue(formData, 'qualification'),
        trainingGoal: getFormValue(formData, 'trainingGoal'),
        preferredTime: getFormValue(formData, 'preferredTime'),
        message: getFormValue(formData, 'message'),
        source: 'Musliman Academy Website',
      }
      : {
        requestType: 'Free Trial',
        name: getFormValue(formData, 'name'),
        whatsapp: getFormValue(formData, 'whatsapp'),
        country: getFormValue(formData, 'country'),
        age: getFormValue(formData, 'age'),
        program: getFormValue(formData, 'program'),
        preferredTime: getFormValue(formData, 'preferredTime'),
        message: getFormValue(formData, 'message'),
        source: 'Musliman Academy Website',
      };

    // TODO: Send leadData to Google Sheets or CRM when integration details are available.
    window.setTimeout(() => {
      setSubmittedLead(leadData);
      setIsSubmitting(false);
    }, 650);
  }

  function resetRequest() {
    setErrors({});
    setIsSubmitting(false);
    setSubmittedLead(null);
    setFormResetKey((key) => key + 1);
  }

  return (
    <section id="book-trial" className="booking-section section-light">
      <SectionDecorations variant="light" type="trial" />
      <div className="container">
        <div className="booking-card">
          <div className="booking-heading">
            <SectionBadge icon={isTraining ? 'certificate' : 'calendar'}>{isTraining ? 'Teacher Training' : 'Book Online'}</SectionBadge>
            <h2>{heading}</h2>
            <p>{description}</p>
          </div>

          <div className="booking-toggle" role="tablist" aria-label="Booking request type">
            <button
              type="button"
              role="tab"
              aria-selected={!isTraining}
              className={`booking-toggle__btn ${activeBookingType === 'trial' ? 'is-active' : ''}`}
              onClick={() => onBookingTypeChange('trial')}
            >
              Book a Free Trial
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isTraining}
              className={`booking-toggle__btn ${activeBookingType === 'training' ? 'is-active' : ''}`}
              onClick={() => onBookingTypeChange('training')}
            >
              Teacher Training
            </button>
          </div>

          {submittedLead ? (
            <div className="booking-success">
              <Icon name="shield" />
              <h3>Request Received</h3>
              <p>{successMessage}</p>
              <div className="booking-success__actions">
                <a className="btn whatsapp-btn" href={buildWhatsAppUrl(submittedLead)} target="_blank" rel="noreferrer">
                  <Icon name="whatsapp" />
                  <span>Continue on WhatsApp</span>
                </a>
                <button className="btn btn-primary" type="button" onClick={resetRequest}>
                  <Icon name="send" />
                  <span>Submit Another Request</span>
                </button>
              </div>
            </div>
          ) : (
            <form className="booking-form" onSubmit={handleSubmit} noValidate key={`${activeBookingType}-${formResetKey}`}>
              <div className="form-grid">
                <label>
                  <span>{isTraining ? 'Full Name' : 'Student / Parent Name'}</span>
                  <input type="text" name="name" placeholder="Enter your full name" aria-invalid={Boolean(errors.name)} />
                  {getFieldError('name')}
                </label>
                <label>
                  <span>WhatsApp Number</span>
                  <input type="tel" name="whatsapp" placeholder="e.g. +20 123 456 7890" aria-invalid={Boolean(errors.whatsapp)} />
                  {getFieldError('whatsapp')}
                </label>
                <label>
                  <span>Country</span>
                  <select name="country" defaultValue="" aria-invalid={Boolean(errors.country)}>
                    <option value="" disabled>Select your country</option>
                    {countryOptions.map((country) => <option key={country}>{country}</option>)}
                  </select>
                  {getFieldError('country')}
                </label>

                {isTraining ? (
                  <>
                    <label>
                      <span>Teaching Experience</span>
                      <select name="experience" defaultValue="" aria-invalid={Boolean(errors.experience)}>
                        <option value="" disabled>Select experience</option>
                        <option>No experience</option>
                        <option>Less than 1 year</option>
                        <option>1-2 years</option>
                        <option>3+ years</option>
                      </select>
                      {getFieldError('experience')}
                    </label>
                    <label>
                      <span>Current Qualification</span>
                      <select name="qualification" defaultValue="" aria-invalid={Boolean(errors.qualification)}>
                        <option value="" disabled>Select qualification</option>
                        <option>Quran Teacher</option>
                        <option>Arabic Teacher</option>
                        <option>Islamic Studies Teacher</option>
                        <option>Ijazah Holder</option>
                        <option>Student of Knowledge</option>
                        <option>Other</option>
                      </select>
                      {getFieldError('qualification')}
                    </label>
                    <label>
                      <span>Training Goal</span>
                      <select name="trainingGoal" defaultValue="" aria-invalid={Boolean(errors.trainingGoal)}>
                        <option value="" disabled>Select training goal</option>
                        <option>Teach non-Arabic speakers</option>
                        <option>Improve online teaching skills</option>
                        <option>Learn lesson planning</option>
                        <option>Improve student follow-up</option>
                        <option>Join Musliman Academy teachers</option>
                        <option>Other</option>
                      </select>
                      {getFieldError('trainingGoal')}
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      <span>Student Age</span>
                      <select name="age" defaultValue="" aria-invalid={Boolean(errors.age)}>
                        <option value="" disabled>Select age</option>
                        <option>Child</option>
                        <option>Teenager</option>
                        <option>Adult</option>
                      </select>
                      {getFieldError('age')}
                    </label>
                    <label>
                      <span>Program Interested In</span>
                      <select name="program" defaultValue="" aria-invalid={Boolean(errors.program)}>
                        <option value="" disabled>Select a program</option>
                        {programs.map((program) => <option key={program.title}>{program.title}</option>)}
                      </select>
                      {getFieldError('program')}
                    </label>
                  </>
                )}

                <label>
                  <span>{isTraining ? 'Preferred Training Time' : 'Preferred Class Time'}</span>
                  <select name="preferredTime" defaultValue="" aria-invalid={Boolean(errors.preferredTime)}>
                    <option value="" disabled>Select preferred time</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                    <option>Flexible</option>
                  </select>
                  {getFieldError('preferredTime')}
                </label>
                <label className="form-grid__full">
                  <span>Message (Optional)</span>
                  <textarea name="message" maxLength={300} placeholder="Tell us anything else we should know..." />
                </label>
              </div>
              <button className="btn btn-primary booking-form__button" type="submit" disabled={isSubmitting}>
                <Icon name="send" />
                <span>{isSubmitting ? 'Submitting...' : isTraining ? 'Submit Teacher Training Request' : 'Book Free Trial'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="about-section section-light" id="about">
      <SectionDecorations variant="light" type="about" />
      <div className="container about-container about-section__grid">
        <div className="about-visual">
          <img
            src="/assets/about-visual.png"
            alt="Quran learning visual"
            className="about-visual__image"
          />
        </div>
        <div className="about-content">
          <SectionBadge icon="star">About Musliman Academy</SectionBadge>
          <h2>Every Learner Has a Way</h2>
          <p className="about-lead">At Musliman Academy, we make learning simple, clear, and achievable through the right method, patient guidance, and step-by-step support for every student.</p>
          <p>At Musliman Academy, we believe that every learner has a way. Every student learns differently, so we provide simple, patient, and step-by-step online education designed around each learner's level and needs.</p>
          <p>The Academy offers Quran, Arabic, Tajweed, Islamic Studies, Islamic Values, Quran Memorization, Quran Tafseer, Tarteel Qaidah, and Teacher Training programs through qualified Egyptian teachers with Al-Azhar educational background.</p>
        </div>
      </div>
    </section>
  );
}

function TrustBarSection() {
  return (
    <section className="trust-section" aria-label="Academy trust highlights">
      <SectionDecorations variant="light" type="default" />
      <div className="container">
        <div className="trust-bar">
          {trustItems.map((item) => (
            <div key={item.label} className="trust-bar__item">
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramsSection() {
  return (
    <section className="programs section-light" id="programs">
      <SectionDecorations variant="light" type="programs" />
      <div className="container">
        <div className="section-heading section-heading--center">
          <SectionBadge icon="star">Our Programs</SectionBadge>
          <h2>Choose the Right Learning Path</h2>
          <p>Programs designed for every level, age, and goal, helping you learn, understand, and live the teachings of Islam with confidence.</p>
        </div>
        <div className="program-grid">
          {programs.map((program) => (
            <article className="program-card" key={program.title}>
              <span className="card-number">{program.number}</span>
              <div className="program-card__icon"><Icon name={program.icon} /></div>
              <h3>{program.title}</h3>
              <p>{program.text}</p>
              <a href="#book-trial">Learn More <span>-&gt;</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section className="audience section-light" id="who-we-teach">
      <SectionDecorations variant="light" type="who" />
      <div className="container">
        <div className="audience__top">
          <div className="audience__copy">
            <SectionBadge icon="users">Who We Teach</SectionBadge>
            <h2>Learning for Every<br />Stage and Level</h2>
            <p>We teach children, adults, non-Arabic speakers, beginners, and advanced learners through simple, patient, and step-by-step online education. Whether a student is starting from zero or needs extra support, Musliman Academy helps every learner find the right way to learn with confidence.</p>
          </div>
          <WhoWeTeachVisual />
        </div>
        <div className="audience-grid">
          {audiences.map((audience) => (
            <article className="audience-card" key={audience.title}>
              <div className="round-icon"><Icon name={audience.icon} /></div>
              <div>
                <h3>{audience.title}</h3>
                <p>{audience.text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="reassurance-banner">
          <Icon name="shield" />
          <p>No matter who you are or where you’re from, you’re welcome here. <strong>We’re here to help you learn, grow, and stay connected to the Quran and your faith.</strong></p>
        </div>
      </div>
    </section>
  );
}

function WhyChooseSection() {
  const cardsPerPage = 2;
  const totalPages = Math.ceil(whyChooseItems.length / cardsPerPage);
  const [activePage, setActivePage] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);

  const visibleCards = whyChooseItems.slice(
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
    }, 2000);

    return () => window.clearInterval(interval);
  }, [isSliderPaused, totalPages]);

  return (
    <section className="why-section section-light" id="why-choose-us">
      <SectionDecorations variant="light" type="why" />
      <div className="container why-container">
        <div className="why-layout">
          <div className="why-left">
            <SectionBadge icon="star">Why Choose Musliman Academy</SectionBadge>
            <h2><span>A Simple, Trusted</span><br /><span>Learning Experience</span></h2>
            <p className="why-description">We make learning the Quran, Arabic, and Islamic studies easy, effective, and meaningful for every background, age, and level.</p>

            <div
              className="why-slider-area"
              onMouseEnter={() => setIsSliderPaused(true)}
              onMouseLeave={() => setIsSliderPaused(false)}
            >
              <div className="why-slider-controls">
                <button type="button" className="why-slider-btn" onClick={goPrev} aria-label="Previous feature">
                  <span aria-hidden="true">&lt;</span>
                </button>
                <span className="why-slider-count">{activePage + 1} / {totalPages}</span>
                <button type="button" className="why-slider-btn" onClick={goNext} aria-label="Next feature">
                  <span aria-hidden="true">&gt;</span>
                </button>
              </div>

              <div className="why-slider">
                {visibleCards.map((item, index) => (
                  <article className="why-slide-card" key={`${item.title}-${index}`}>
                    <span className="why-slide-card__number">{activePage * cardsPerPage + index + 1}</span>
                    <div className="why-slide-card__icon">
                      <Icon name={item.icon} />
                    </div>
                    <h3>{item.title}</h3>
                    <div className="why-slide-card__line" />
                    <p>{item.description}</p>
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
                    aria-label={`Show feature page ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <WhyChooseVisual />
        </div>
        <div className="why-stats">
          <div className="why-stat"><Icon name="certificate" /><strong>10,000+</strong><span>Students Taught</span></div>
          <div className="why-stat"><Icon name="users" /><strong>50+</strong><span>Expert Teachers</span></div>
          <div className="why-stat"><Icon name="globe" /><strong>30+</strong><span>Countries Served</span></div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="how section-warm" id="how-it-works">
      <SectionDecorations variant="light" type="steps" />
      <div className="container">
        <div className="section-heading section-heading--center">
          <span className="eyebrow-line">How It Works</span>
          <h2>Start Learning in 3 Simple Steps</h2>
          <p>Getting started at Musliman Academy is easy and hassle-free.</p>
        </div>
        <div className="steps-grid">
          {howSteps.map((step) => (
            <article className="step-card" key={step.step}>
              <span className="step-card__badge">{step.step}</span>
              <div className="step-card__visual"><Icon name={step.icon} /></div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeacherTrainingSection({ onSelectBookingType }: { onSelectBookingType: (type: BookingType) => void }) {
  return (
    <section className="training section-dark" id="teacher-training">
      <SectionDecorations variant="dark" type="training" />
      <div className="container training__grid">
        <div className="training__content">
          <SectionBadge icon="certificate" dark>Teacher Training Program</SectionBadge>
          <h2>Train Teachers to Teach with Confidence</h2>
          <p>Musliman Academy offers practical training for beginner and experienced teachers who want to improve their Quran, Arabic, and Islamic-values teaching for non-Arabic speakers.</p>
          <div className="training-list">
            {trainingIncludes.map((item) => (
              <div key={item.title}><Icon name={item.icon} /><span>{item.title}</span></div>
            ))}
          </div>
          <Button href="#book-trial" icon="certificate" className="training__cta" onClick={() => onSelectBookingType('training')}>Join Teacher Training</Button>
        </div>
        <ClassIllustration mode="training" />
        <div className="training-badges">
          {trainingBadges.map((badge) => (
            <div key={badge.title}><Icon name={badge.icon} /><span>{badge.title}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq section-light" id="faq">
      <SectionDecorations variant="light" type="faq" />
      <div className="container">
        <div className="section-heading section-heading--center">
          <span className="eyebrow-line">FAQ</span>
          <h2>Frequently Asked Questions</h2>
          <p>Find answers to common questions about our online Islamic and Arabic classes.</p>
        </div>
        <div className="faq__grid">
          <div className="accordion-list">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div className={`accordion ${isOpen ? 'is-open' : ''}`} key={faq.question}>
                  <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : index)}>
                    <span className="accordion__icon">{isOpen ? '-' : '+'}</span>
                    <span className="accordion__number">{index + 1}.</span>
                    <strong>{faq.question}</strong>
                    <span className="accordion__chevron" aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div className="accordion__content">
                      <Icon name="laptop" />
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <aside className="faq-card">
            <div className="faq-card__icon"><Icon name="phone" /></div>
            <h3>Still have questions?</h3>
            <p>We're here to help you on your learning journey.</p>
            <a className="btn whatsapp-btn" href={`https://wa.me/${contact.whatsappNumber}`} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" /> Contact us on WhatsApp
            </a>
            <div className="faq-card__trust"><Icon name="shield" />Trusted support from real people</div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const quickLinks = navLinks.filter((link) => link.label !== 'Teacher Training');

  return (
    <footer className="footer">
      <SectionDecorations variant="dark" type="footer" />
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo variant="light" />
          <p>Musliman Academy is a trusted online platform helping non-Arabic speakers learn the Quran, Arabic, and Islamic values with qualified Egyptian teachers in a supportive environment.</p>
          <div className="subscribe-card">
            <Icon name="mail" />
            <strong>Stay Connected</strong>
            <span>Get updates on new programs, classes, and exclusive offers.</span>
            <label>
              <input type="email" placeholder="Enter your email" />
              <button type="button"><Icon name="send" /></button>
            </label>
          </div>
        </div>
        <div>
          <h3>Programs</h3>
          <ul>
            {programs.map((program) => <li key={program.title}><a href="#programs"><Icon name={program.icon} />{program.title}</a></li>)}
            <li><a href="#teacher-training"><Icon name="certificate" />Teacher Training</a></li>
          </ul>
        </div>
        <div>
          <h3>Quick Links</h3>
          <ul>
            {quickLinks.map((link) => <li key={link.href}><a href={link.href}><Icon name="link" />{link.label}</a></li>)}
            <li><a href="#book-trial"><Icon name="link" />Book Free Trial</a></li>
          </ul>
        </div>
        <div className="footer__contact">
          <h3>Contact</h3>
          <a href={`https://wa.me/${contact.whatsappNumber}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" /><span>WhatsApp<br /><small>{contact.whatsappDisplay}</small></span></a>
          <a href={`mailto:${contact.email}`}><Icon name="mail" /><span>Email<br /><small>{contact.email}</small></span></a>
          <a href="#home"><Icon name="globe" /><span>Website<br /><small>{contact.website}</small></span></a>
          <div className="social-links">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="YouTube">YT</a>
            <a href="#" aria-label="TikTok">TT</a>
          </div>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>Copyright 2026 Musliman Academy. All rights reserved.</span>
        <span><Icon name="shield" /> Trusted Online Islamic Education</span>
      </div>
    </footer>
  );
}

export default function App() {
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
        <AudienceSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <TeacherTrainingSection onSelectBookingType={setActiveBookingType} />
        <FAQSection />
      </main>
      <Footer />
      <a className="floating-whatsapp" href={`https://wa.me/${contact.whatsappNumber}`} target="_blank" rel="noreferrer" aria-label="Contact Musliman Academy on WhatsApp">
        <Icon name="whatsapp" />
      </a>
    </div>
  );
}
