import ProgramLearningSections from '../../program-learning-sections';
import CourseChrome from '../../course-chrome';
import CourseDetail from '../../course-detail';
import { courseContent, trainingBookingHref } from '../../../lib/course-content';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { languages, labels, text, courses, teachers, paths, alternateUrls, siteUrl, yearLabels } from '../../../lib/catalog';
import DocumentLanguage from '../../document-language';
import '../../catalog.css';
type Props = { params: Promise<{lang:string; segments:string[]}> };
export const dynamicParams = false;
export function generateStaticParams() { return languages.flatMap(lang => paths.map(path => ({lang, segments:path.split('/')}))); }
function resolve(lang:string, path:string) {
  if (!languages.includes(lang as typeof languages[number]) || !paths.includes(path)) notFound();
  const [kind, slug] = path.split('/');
  const teacher = kind === 'teachers' ? teachers.find(t => t.id === slug) : undefined;
  const course = kind === 'programs' ? courses.find(p => p.slug === slug) : undefined;
  const training = slug === 'teacher-training';
  const title = teacher ? text(lang, `teachers.items.${teacher.key}.name`, teacher.fullName) : course ? text(lang, `programs.items.${course.key}.title`) : training ? text(lang,'training.heading') : labels[lang][kind === 'programs' ? 1 : 2];
  const description = teacher ? [title, labels[lang][4], text(lang,'teachers.languages.Arabic'), text(lang,'teachers.languages.English')].join(' · ') : course ? text(lang,`programs.items.${course.key}.text`) : text(lang,training ? 'training.description' : kind === 'programs' ? 'programs.description' : 'teachers.description');
  const contentKey = training ? 'teacherTraining' : course?.key;
  const reading = courseContent(contentKey, lang);
  return {kind,slug,teacher,course,training,title:reading?.title || title,description:reading?.intro || description,metaTitle:reading?.metaTitle || reading?.title || title,metaDescription:reading?.metaDescription || reading?.intro || description,reading,contentKey};
}
export async function generateMetadata({params}:Props):Promise<Metadata> {
 const {lang,segments}=await params; const path=segments.join('/'); const page=resolve(lang,path); const url=`${siteUrl}/${lang}/${path}`;
 return {title:page.metaTitle,description:page.metaDescription,alternates:{canonical:url,languages:{...alternateUrls(path),'x-default':`${siteUrl}/en/${path}`}},openGraph:{title:page.metaTitle,description:page.metaDescription,url,type:'website'},twitter:{card:'summary_large_image',title:page.metaTitle,description:page.metaDescription}};
}
export default async function Page({params}:Props) {
 const {lang,segments}=await params;const path=segments.join('/');const p=resolve(lang,path);const l=labels[lang];
 if (p.reading && p.contentKey) return <CourseDetail lang={lang} courseKey={p.contentKey}/>;
 const bookingHref=p.training ? trainingBookingHref(lang) : `/?lang=${lang}${p.course && p.course.key !== 'quranTajweed' ? `&program=${p.course.key}` : ''}#book-trial`;
 const bookingLabel=p.training ? text(lang,'training.cta') : l[3];
 const specializations=['quranReading','tajweed','islamicStudies'].map(k=>text(lang,`programs.items.${k}.title`)).join(', ');
 const experience = p.teacher ? text(lang,`teachers.items.${p.teacher.key}.experience`,new Intl.NumberFormat(lang).format(parseInt(p.teacher.experience || '0'))+'+ '+yearLabels[lang]) : '';
 const jsonLd={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:l[0],item:siteUrl},{'@type':'ListItem',position:2,name:l[p.kind==='programs'?1:2],item:`${siteUrl}/${lang}/${p.kind}`},...(p.slug?[{'@type':'ListItem',position:3,name:p.title,item:`${siteUrl}/${lang}/${path}`}]:[])]};
 return <div className="catalog-shell" lang={lang} dir={lang==='ar'||lang==='ur'?'rtl':'ltr'}><DocumentLanguage language={lang}/>
<CourseChrome lang={lang} path={path}/>
 <main className="catalog-main"><nav className="catalog-breadcrumb"><Link href={`/?lang=${lang}`}>{l[0]}</Link> / <Link href={`/${lang}/${p.kind}`}>{l[p.kind==='programs'?1:2]}</Link>{p.slug&&<> / {p.title}</>}</nav><div className={p.course ? 'catalog-hero catalog-hero--course' : 'catalog-hero'}>
 <div className="catalog-hero-copy"><span className="catalog-eyebrow">{l[p.kind==='programs'?1:2]} · Musliman Academy</span><h1>{p.title}</h1><p className="catalog-intro">{p.description}</p>
 {p.slug&&<Link className="btn btn-primary catalog-hero-cta" href={bookingHref}>{bookingLabel} <span aria-hidden="true">→</span></Link>}</div>
 {p.course&&<div className="catalog-hero-visual"><img src={p.course.image} alt={p.title}/></div>}
 </div>
 {!p.slug&&<div className="catalog-grid">{p.kind==='programs'?<>{courses.map(course=><article className="catalog-program-card" key={course.key}><img src={course.image} alt=""/><h2><Link className="catalog-program-link" href={`/${lang}/programs/${course.slug}`}>{text(lang,`programs.items.${course.key}.title`)}</Link></h2><p>{text(lang,`programs.items.${course.key}.text`)}</p></article>)}<article className="catalog-program-card"><h2><Link className="catalog-program-link" href={`/${lang}/programs/teacher-training`}>{text(lang,'training.heading')}</Link></h2><p>{text(lang,'training.description')}</p></article></>:teachers.map(teacher=><article key={teacher.id}><img src={teacher.photo} alt={teacher.fullName}/><h2><Link href={`/${lang}/teachers/${teacher.id}`}>{text(lang,`teachers.items.${teacher.key}.name`,teacher.fullName)}</Link></h2><p>{specializations}</p></article>)}</div>}
 {!p.slug && p.kind==='programs' && <ProgramLearningSections lang={lang}/>}
 {p.teacher&&<section className="catalog-profile"><img src={p.teacher.photo} alt={p.title}/><dl><dt>{l[4]}</dt><dd>{text(lang,'teachers.languages.Arabic')}, {text(lang,'teachers.languages.English')}</dd><dt>{l[5]}</dt><dd>{experience}</dd><dt>{l[6]}</dt><dd>{specializations}</dd></dl></section>}

 {p.slug&&<section><h2>{l[7]}</h2><p>{l[8]}</p><Link className="btn btn-primary" href={bookingHref}>{bookingLabel}</Link><p><Link href={`/${lang}/programs`}>{l[9]}</Link></p></section>}
 </main><CourseChrome lang={lang} path={path} footer/>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\u003c')}}/></div>;
}
