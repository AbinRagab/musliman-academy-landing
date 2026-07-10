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
  programOptions,
  programs,
  reasons,
  trainingBadges,
  trainingIncludes,
  trustItems,
} from './data/siteData';

type Theme = 'light' | 'dark';
type DecorationVariant = 'light' | 'dark';
type DecorationType = 'hero' | 'trial' | 'about' | 'programs' | 'who' | 'why' | 'steps' | 'training' | 'faq' | 'footer' | 'default';

type DecorationItem =
  | { kind: 'icon'; icon: IconName; className: string }
  | { kind: 'arch'; className: string }
  | { kind: 'crescent'; className: string };

function SectionBadge({ icon, children, dark = false }: { icon?: IconName; children: string; dark?: boolean }) {
  return (
    <div className={`section-badge ${dark ? 'section-badge--dark' : ''}`}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </div>
  );
}

function Button({ href, children, icon = 'calendar', className = '' }: { href: string; children: string; icon?: IconName; className?: string }) {
  return (
    <a className={`btn btn-primary ${className}`} href={href}>
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

function Navbar({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
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
          <Button href="#book-trial">Book Free Trial</Button>
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
        <Button href="#book-trial" className="mobile-panel__cta">Book Free Trial</Button>
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

function HeroSection() {
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
          <Button href="#book-trial" icon="calendar" className="hero__cta">Book Your Free Trial Class</Button>
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

function TrialForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="book-trial" className="booking-section">
      <SectionDecorations variant="light" type="trial" />
      <div className="container">
        <form className="trial-form" onSubmit={handleSubmit}>
          <div className="trial-form__heading">
            <Icon name="calendar" />
            <h2>Book a Free Trial</h2>
            <p>Fill in the form below and our team will get in touch with you.</p>
          </div>
          <div className="form-grid">
            <label>
              <span>Student / Parent Name</span>
              <input type="text" name="name" placeholder="Enter your full name" required />
            </label>
            <label>
              <span>WhatsApp Number</span>
              <input type="tel" name="whatsapp" placeholder="e.g. +20 123 456 7890" required />
            </label>
            <label>
              <span>Country</span>
              <select name="country" required defaultValue="">
                <option value="" disabled>Select your country</option>
                {countryOptions.map((country) => <option key={country}>{country}</option>)}
              </select>
            </label>
            <label>
              <span>Student Age</span>
              <select name="age" required defaultValue="">
                <option value="" disabled>Select age</option>
                <option>4 - 6</option>
                <option>7 - 10</option>
                <option>11 - 15</option>
                <option>16 - 18</option>
                <option>Adult</option>
              </select>
            </label>
            <label>
              <span>Program Interested In</span>
              <select name="program" required defaultValue="">
                <option value="" disabled>Select a program</option>
                {programOptions.map((program) => <option key={program}>{program}</option>)}
              </select>
            </label>
            <label>
              <span>Preferred Class Time</span>
              <select name="time" required defaultValue="">
                <option value="" disabled>Select preferred time</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
                <option>Weekend</option>
                <option>Flexible</option>
              </select>
            </label>
            <label className="form-grid__full">
              <span>Message (Optional)</span>
              <textarea name="message" maxLength={300} placeholder="Tell us anything else we should know..." />
              <small>0 / 300</small>
            </label>
          </div>
          <button className="btn btn-primary trial-form__button" type="submit">
            <Icon name="send" />
            <span>Book Free Trial</span>
          </button>
          <div className={`success-note ${submitted ? 'is-visible' : ''}`}>
            <Icon name="shield" /> Our team will contact you shortly.
          </div>
        </form>
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
  return (
    <section className="why-section" id="why-choose-us">
      <SectionDecorations variant="light" type="why" />
      <div className="container why-container">
        <div className="why-layout">
          <div className="why-left">
            <SectionBadge icon="star">Why Choose Musliman Academy?</SectionBadge>
            <h2>A Simple, Trusted<br />Learning Experience</h2>
            <p className="section-description">We make learning the Quran, Arabic, and Islamic studies easy, effective, and meaningful for every background, age, and level.</p>
            <div className="reasons-grid">
              {reasons.map((reason, index) => (
                <article className="reason-card" key={reason.title}>
                  <span className="reason-card__number">{index + 1}</span>
                  <Icon name={reason.icon} />
                  <div>
                    <h3>{reason.title}</h3>
                    <p>{reason.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <WhyChooseVisual />
        </div>
        <div className="why-stats stats-bar">
          <div><Icon name="certificate" /><strong>10,000+</strong><span>Students Taught</span></div>
          <div><Icon name="users" /><strong>50+</strong><span>Expert Teachers</span></div>
          <div><Icon name="globe" /><strong>30+</strong><span>Countries Served</span></div>
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

function TeacherTrainingSection() {
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
          <Button href="#book-trial" icon="certificate" className="training__cta">Join Teacher Training</Button>
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('musliman-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <HeroSection />
        <TrialForm />
        <AboutSection />
        <TrustBarSection />
        <ProgramsSection />
        <AudienceSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <TeacherTrainingSection />
        <FAQSection />
      </main>
      <Footer />
      <a className="floating-whatsapp" href={`https://wa.me/${contact.whatsappNumber}`} target="_blank" rel="noreferrer" aria-label="Contact Musliman Academy on WhatsApp">
        <Icon name="whatsapp" />
      </a>
    </div>
  );
}
