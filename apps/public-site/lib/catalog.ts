import en from '../../../src/i18n/locales/en.json';
import ar from '../../../src/i18n/locales/ar.json';
import es from '../../../src/i18n/locales/es.json';
import de from '../../../src/i18n/locales/de.json';
import it from '../../../src/i18n/locales/it.json';
import ur from '../../../src/i18n/locales/ur.json';
import tr from '../../../src/i18n/locales/tr.json';
import { programs, landingTeachers } from '../../../src/landing/data/siteData';
export const languages = ['en','ar','es','de','it','ur','tr'] as const;
export type Language = typeof languages[number];
export const siteUrl = 'https://www.muslimanacademy.com';
const resources: Record<string, unknown> = { en, ar, es, de, it, ur, tr };
export const labels: Record<string, string[]> = {"en": ["Home", "Programs", "Teachers", "Book a Free Trial", "Languages", "Experience", "Specialization", "How learning works", "Choose your program and discuss your level and goals during a free trial.", "Explore our programs"], "ar": ["الرئيسية", "البرامج", "المعلمون", "احجز حصة تجريبية مجانية", "اللغات", "الخبرة", "التخصص", "كيف يبدأ التعلم", "اختر برنامجك وناقش مستواك وأهدافك خلال حصة تجريبية مجانية.", "استكشف برامجنا"], "es": ["Inicio", "Programas", "Profesores", "Reserva una clase de prueba gratis", "Idiomas", "Experiencia", "Especialización", "Cómo empezar", "Elige tu programa y habla de tu nivel y tus objetivos durante una clase de prueba gratuita.", "Explora nuestros programas"], "de": ["Startseite", "Programme", "Lehrkräfte", "Kostenlose Probestunde buchen", "Sprachen", "Erfahrung", "Spezialisierung", "So beginnt das Lernen", "Wähle dein Programm und besprich dein Niveau und deine Ziele in einer kostenlosen Probestunde.", "Unsere Programme entdecken"], "it": ["Home", "Programmi", "Insegnanti", "Prenota una lezione di prova gratuita", "Lingue", "Esperienza", "Specializzazione", "Come iniziare", "Scegli il programma e parla del tuo livello e dei tuoi obiettivi durante una lezione di prova gratuita.", "Scopri i nostri programmi"], "ur": ["ہوم", "پروگرام", "اساتذہ", "مفت آزمائشی کلاس بک کریں", "زبانیں", "تجربہ", "تخصص", "سیکھنے کا آغاز", "اپنا پروگرام منتخب کریں اور مفت آزمائشی کلاس میں اپنی سطح اور اہداف پر بات کریں۔", "ہمارے پروگرام دیکھیں"], "tr": ["Ana sayfa", "Programlar", "Öğretmenler", "Ücretsiz deneme dersi ayırtın", "Diller", "Deneyim", "Uzmanlık", "Öğrenmeye nasıl başlanır", "Programınızı seçin ve ücretsiz deneme dersinde seviyenizi ve hedeflerinizi görüşün.", "Programlarımızı keşfedin"]};
export function text(lang: string, key: string, fallback = ''): string {
  let value: unknown = resources[lang];
  for (const part of key.split('.')) value = value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined;
  return typeof value === 'string' ? value : fallback;
}
const slugs: Record<string,string> = { quranReading:'quran-reading', tarteelQaidah:'tarteel-qaidah', quranMemorization:'quran-memorization', tajweed:'tajweed', quranTafseer:'quran-tafseer', arabicLanguage:'arabic-language', islamicStudies:'islamic-studies', islamicValues:'islamic-values-for-children' };
export const courses = programs.map(p => ({...p, slug:slugs[p.key]}));
export const teachers = landingTeachers;
export const paths = ['programs','teachers', ...courses.map(p => `programs/${p.slug}`), 'programs/teacher-training', ...teachers.map(p => `teachers/${p.id}`)];
export function alternateUrls(path: string) {
  return Object.fromEntries(languages.map(lang => [lang, `${siteUrl}/${lang}/${path}`]));
}

export const yearLabels: Record<string,string> = { en:'years', ar:'سنوات', es:'años', de:'Jahre', it:'anni', ur:'سال', tr:'yıl' };
