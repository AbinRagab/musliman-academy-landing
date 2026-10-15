import Link from 'next/link';
import { BookOpen, Brain, CalendarDays, ChevronDown, Globe, GraduationCap, Heart, Languages, Pencil, Star, Target, TrendingUp, UserRound, UsersRound, Video, Volume2 } from 'lucide-react';
import content from '../lib/program-directory.json';
import { text } from '../lib/catalog';
import './program-learning-sections.css';

const skills = [
  { key: 'quranReading', Icon: BookOpen },
  { key: 'tajweed', Icon: Volume2 },
  { key: 'quranMemorization', Icon: Brain },
  { key: 'arabicLanguage', Icon: Languages },
  { key: 'islamicStudies', Icon: GraduationCap },
];
const outcomeIcons = [BookOpen, Heart, Target, TrendingUp, UsersRound, Globe];
const questionIcons = [BookOpen, UserRound, Video, CalendarDays, Pencil, Star];

export default function ProgramLearningSections({ lang }: { lang: string }) {
  const copy = content[lang as keyof typeof content];
  return <div className="program-learning">
    <section className="program-learning__section" aria-labelledby="program-learning-title">
      <div className="program-learning__heading">
        <p className="program-learning__eyebrow">{copy.learnLabel}</p>
        <h2 id="program-learning-title">{copy.learnTitle}<span>{copy.learnAccent}</span></h2>
        <p>{copy.learnText}</p>
      </div>
      <div className="program-learning__skills">
        {skills.map(({ key, Icon }) => <article className="program-learning__card" key={key}>
          <span className="program-learning__icon"><Icon aria-hidden="true" size={28}/></span>
          <h3>{text(lang, `programs.items.${key}.title`)}</h3>
          <p>{text(lang, `programs.items.${key}.text`)}</p>
        </article>)}
      </div>
    </section>
    <section className="program-learning__section program-learning__section--outcomes" aria-labelledby="program-outcomes-title">
      <div className="program-learning__heading">
        <p className="program-learning__eyebrow">{copy.outcomesLabel}</p>
        <h2 id="program-outcomes-title">{copy.outcomesTitle}<span>{copy.outcomesAccent}</span></h2>
        <p>{copy.outcomesText}</p>
      </div>
      <div className="program-learning__outcomes">
        {copy.outcomes.map((item, index) => {
          const Icon = outcomeIcons[index];
          return <article className="program-learning__card" key={item.title}>
            <span className="program-learning__icon"><Icon aria-hidden="true" size={28}/></span>
            <h3>{item.title}</h3><p>{item.text}</p>
          </article>;
        })}
      </div>
    </section>
    <section className="program-learning__section program-learning__section--faq" aria-labelledby="program-questions-title">
      <div className="program-learning__heading">
        <h2 id="program-questions-title">{copy.faqTitle} <span>{copy.faqAccent}</span></h2>
        <p>{copy.faqText}</p>
      </div>
      <div className="program-learning__questions">
        {copy.faq.map(([question, answer], index) => {
          const Icon = questionIcons[index];
          return <details key={question}>
            <summary><span className="program-learning__question-icon"><Icon aria-hidden="true" size={22}/></span><strong>{question}</strong><ChevronDown className="program-learning__chevron" aria-hidden="true" size={20}/></summary>
            <p>{answer}</p>
          </details>;
        })}
      </div>
      <div className="program-learning__cta"><Link className="btn btn-primary" href={`/?lang=${lang}#book-trial`}>{copy.cta}</Link></div>
    </section>
  </div>;
}
