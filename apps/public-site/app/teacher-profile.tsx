import Link from 'next/link';
import CourseChrome from './course-chrome';
import { labels, localizedPath, siteUrl, teachers, text, direction } from '../lib/catalog';
import type { Language } from '../lib/languages';
import { teacherPhotoPath, teacherProfile, teacherSubjects } from '../lib/teacher-profiles';
import { organizationReference } from '../lib/brand';
import './teacher-profile.css';

const languageCodes: Record<string, string> = { Arabic: 'ar', English: 'en' };
// Academy-wide questions, already translated and confirmed on the homepage.
const academyFaqs = ['q4', 'q7', 'q8', 'q5'];
const howSteps = ['freeTrial', 'findPlan', 'setSchedule', 'startLearning'];
const listSeparator = (lang: Language) => (lang === 'ar' || lang === 'ur' ? '، ' : ', ');

export function TeacherCard({ lang, id, headingLevel = 'h2' }: { lang: Language; id: string; headingLevel?: 'h2' | 'h3' }) {
  const profile = teacherProfile(lang, id)!;
  const Heading = headingLevel;
  return <article className="teacher-profile-card">
    <img src={teacherPhotoPath(id)} alt="" width={600} height={600} loading="lazy" decoding="async" />
    <div className="teacher-profile-card__body">
      <Heading><Link className="teacher-profile-card__link" href={`/${lang}/teachers/${id}`}>{profile.name}</Link></Heading>
      <dl>
        <div><dt>{text(lang, 'teachers.experienceLabel')}</dt><dd>{profile.experience}</dd></div>
        <div><dt>{text(lang, 'teachers.languagesLabel')}</dt><dd>{profile.languageNames.join(listSeparator(lang))}</dd></div>
        <div><dt>{text(lang, 'teachers.specializationLabel')}</dt><dd>{profile.specialization}</dd></div>
      </dl>
      <span className="teacher-profile-card__more" aria-hidden="true">{text(lang, 'teachers.viewProfile')} <span className="teacher-arrow">→</span></span>
    </div>
  </article>;
}

export function teacherStructuredData(lang: Language, id: string) {
  const profile = teacherProfile(lang, id)!;
  const url = siteUrl + localizedPath(lang, `teachers/${id}`);
  const l = labels[lang];
  return [
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: l[0], item: siteUrl + localizedPath(lang) },
        { '@type': 'ListItem', position: 2, name: l[2], item: siteUrl + localizedPath(lang, 'teachers') },
        { '@type': 'ListItem', position: 3, name: profile.name, item: url },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'ProfilePage', url, inLanguage: lang, name: profile.ui.metaTitle,
      mainEntity: {
        '@type': 'Person',
        name: profile.name,
        url,
        image: siteUrl + teacherPhotoPath(id),
        jobTitle: profile.ui.role,
        description: profile.intro,
        knowsLanguage: (profile.teacher.languages ?? []).map(language => languageCodes[language] ?? language),
        knowsAbout: teacherSubjects.map(subject => text(lang, `programs.items.${subject.key}.title`)),
        worksFor: organizationReference,
      },
    },
  ];
}

export default function TeacherProfile({ lang, id }: { lang: Language; id: string }) {
  const profile = teacherProfile(lang, id)!;
  const { ui } = profile;
  const path = `teachers/${id}`;
  const l = labels[lang];
  // No teacher field exists in the booking form, so this is a general free trial.
  const bookingHref = `${localizedPath(lang)}#book-trial`;
  const related = teachers.filter(teacher => teacher.id !== id);
  return <div className="catalog-shell teacher-page" lang={lang} dir={direction(lang)}>
    <CourseChrome lang={lang} path={path} />
    <main className="teacher-main">
      <nav className="teacher-breadcrumb" aria-label={ui.breadcrumbLabel}>
        <ol>
          <li><Link href={localizedPath(lang)}>{l[0]}</Link></li>
          <li><Link href={localizedPath(lang, 'teachers')}>{l[2]}</Link></li>
          <li aria-current="page">{profile.name}</li>
        </ol>
      </nav>

      <section className="teacher-hero" aria-labelledby="teacher-name">
        <div className="teacher-hero__portrait">
          <img src={teacherPhotoPath(id)} alt={ui.imageAlt} width={600} height={600} fetchPriority="high" />
        </div>
        <div className="teacher-hero__copy">
          <span className="catalog-eyebrow">{ui.role}</span>
          <h1 id="teacher-name">{profile.name}</h1>
          <p className="teacher-hero__intro">{profile.intro}</p>
          <dl className="teacher-facts">
            <div><dt>{text(lang, 'teachers.experienceLabel')}</dt><dd>{profile.experience}</dd></div>
            <div><dt>{text(lang, 'teachers.languagesLabel')}</dt><dd>{profile.languageNames.join(listSeparator(lang))}</dd></div>
            <div><dt>{text(lang, 'teachers.specializationLabel')}</dt><dd>{profile.specialization}</dd></div>
          </dl>
          <div className="teacher-hero__actions">
            <Link className="btn btn-primary teacher-hero__cta" href={bookingHref}>{ui.cta} <span className="teacher-arrow" aria-hidden="true">→</span></Link>
            <Link className="teacher-text-link" href={localizedPath(lang, 'teachers')}>{ui.allTeachers}</Link>
          </div>
          <p className="teacher-hero__note">{ui.ctaNote}</p>
        </div>
      </section>

      <section className="teacher-section teacher-about" aria-labelledby="teacher-about">
        <h2 id="teacher-about">{ui.aboutHeading}</h2>
        <p>{profile.about}</p>
      </section>

      <section className="teacher-section" aria-labelledby="teacher-subjects">
        <h2 id="teacher-subjects">{ui.subjectsHeading}</h2>
        <p className="teacher-section__intro">{ui.subjectsIntro}</p>
        <div className="teacher-subjects">
          {teacherSubjects.map(subject => <article className="teacher-subject" key={subject.key}>
            <img src={subject.image} alt="" width={480} height={320} loading="lazy" decoding="async" />
            <h3><Link className="teacher-subject__link" href={localizedPath(lang, `programs/${subject.slug}`)}>{text(lang, `programs.items.${subject.key}.title`)}</Link></h3>
            <p>{text(lang, `programs.items.${subject.key}.text`)}</p>
            <span className="teacher-subject__more" aria-hidden="true">{ui.viewCourse} <span className="teacher-arrow">→</span></span>
          </article>)}
        </div>
      </section>

      <section className="teacher-section teacher-how" aria-labelledby="teacher-how">
        <h2 id="teacher-how">{ui.howHeading}</h2>
        <p className="teacher-section__intro">{ui.howIntro}</p>
        <ol className="teacher-steps">
          {howSteps.map(step => <li key={step}>
            <h3>{text(lang, `how.steps.${step}.title`)}</h3>
            <p>{text(lang, `how.steps.${step}.text`)}</p>
          </li>)}
        </ol>
      </section>

      <section className="teacher-section teacher-faq" aria-labelledby="teacher-faq">
        <h2 id="teacher-faq">{ui.faqHeading}</h2>
        <details>
          <summary>{ui.preferenceQuestion}</summary>
          <p>{ui.preferenceAnswer}</p>
        </details>
        {academyFaqs.map(key => <details key={key}>
          <summary>{text(lang, `faq.${key}.question`)}</summary>
          <p>{text(lang, `faq.${key}.answer`)}</p>
        </details>)}
      </section>

      <section className="teacher-section" aria-labelledby="teacher-related">
        <h2 id="teacher-related">{ui.relatedHeading}</h2>
        <div className="teacher-directory teacher-directory--related">
          {related.map(teacher => <TeacherCard key={teacher.id} lang={lang} id={teacher.id} headingLevel="h3" />)}
        </div>
      </section>
    </main>
    <CourseChrome lang={lang} path={path} footer />
    {teacherStructuredData(lang, id).map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />)}
  </div>;
}
