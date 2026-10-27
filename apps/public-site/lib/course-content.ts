import additionalContent from './additional-courses.json';
import arabicContent from './arabic-language.json';
import combinedContent from './quran-tajweed.json';
import programPages from './program-pages.json';
import readingContent from './quran-reading.json';

type Card = { title: string; text: string };

export type CourseContent = {
  title: string;
  intro: string;
  eyebrow?: string;
  audienceTitle: string;
  audience: string[];
  learnTitle: string;
  learn: string[];
  requirementsTitle: string;
  requirements: string;
  lessonsTitle: string;
  lessons: string;
  planNote?: string;
  curriculum?: { title: string; topics: string[] }[];
  faqTitle: string;
  faq: string[][];
  // Optional fields used by the expanded program pages.
  metaTitle?: string;
  metaDescription?: string;
  badge?: string;
  image?: string;
  imageAlt?: string;
  features?: Card[];
  outcomesTitle?: string;
  outcomesIntro?: string;
  outcomes?: string[];
  guide?: { title: string; text: string; items: (Card & { slug?: string })[] };
  journeyTitle?: string;
  journey?: Card[];
  related?: string[];
  cta?: { title: string; text: string; points: Card[]; closingTitle: string };
};

// Detailed content keyed by program, then language. A missing language keeps
// that route on the simpler catalog layout with its existing translated copy.
const content: Record<string, Partial<Record<string, CourseContent>>> = {
  quranReading: readingContent,
  quranTajweed: combinedContent,
  arabicLanguage: arabicContent,
  ...additionalContent,
  ...programPages,
};

export function courseContent(key: string | undefined, lang: string): CourseContent | undefined {
  return key ? content[key]?.[lang] : undefined;
}

export function trainingBookingHref(lang: string) {
  return `/${lang}?type=training#book-trial`;
}

export function courseBookingHref(lang: string, courseKey: string) {
  if (courseKey === 'teacherTraining') return trainingBookingHref(lang);
  // The combined Quran & Tajweed page books the Quran Reading program.
  return `/${lang}?program=${courseKey === 'quranTajweed' ? 'quranReading' : courseKey}#book-trial`;
}
