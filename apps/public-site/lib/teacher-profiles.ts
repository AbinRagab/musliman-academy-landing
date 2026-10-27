import pages from './teacher-pages.json';
import { courses, teachers, text } from './catalog';
import type { Language } from './languages';

type TeacherPageCopy = (typeof pages)['en'];
export type TeacherUi = TeacherPageCopy['ui'];

// Subjects confirmed for every current teacher, each linked to its existing course page.
export const teacherSubjects = ['quranReading', 'tajweed', 'islamicStudies'].map(key => courses.find(course => course.key === key)!);

// Portraits are served as files so metadata and structured data can use absolute URLs.
export function teacherPhotoPath(id: string) {
  return `/teacher-photos/${id}.jpg`;
}

export function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}

export function teacherProfile(lang: Language, id: string) {
  const teacher = teachers.find(candidate => candidate.id === id);
  if (!teacher) return undefined;
  const copy = pages[lang] as TeacherPageCopy;
  const name = text(lang, `teachers.items.${teacher.key}.name`, teacher.fullName);
  const experience = text(lang, `teachers.items.${teacher.key}.experience`, teacher.experience);
  const languageNames = (teacher.languages ?? []).map(language => text(lang, `teachers.languages.${language}`, language));
  const specialization = text(lang, `teachers.items.${teacher.key}.specialization`, teacher.specialization);
  const values = { name, experience };
  const ui = Object.fromEntries(Object.entries(copy.ui).map(([key, value]) => [key, fill(value, values)])) as TeacherUi;
  const personal = copy.teachers[teacher.key as keyof TeacherPageCopy['teachers']];
  return { teacher, name, experience, languageNames, specialization, ui, intro: personal.intro, about: personal.about };
}

export function teacherPageCopy(lang: Language) {
  return pages[lang] as TeacherPageCopy;
}
