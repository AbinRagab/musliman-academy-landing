'use client';
import { useEffect, useState } from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { Navbar, Footer } from './LandingPage';
import en from '../i18n/locales/en.json';
import ar from '../i18n/locales/ar.json';
import es from '../i18n/locales/es.json';
import de from '../i18n/locales/de.json';
import it from '../i18n/locales/it.json';
import ur from '../i18n/locales/ur.json';
import tr from '../i18n/locales/tr.json';
export default function CourseChrome({lang,path,footer=false}:{lang:string;path:string;footer?:boolean}) {
 const [instance]=useState(()=>{const i=createInstance();void i.init({lng:lang,fallbackLng:'en',initAsync:false,resources:{en:{translation:en},ar:{translation:ar},es:{translation:es},de:{translation:de},it:{translation:it},ur:{translation:ur},tr:{translation:tr}},interpolation:{escapeValue:false}});return i;});
 const homeHref=`/?lang=${lang}`;
 const programSlugs: Record<string,string>={quranReading:'quran-reading',tajweed:'tajweed',quranMemorization:'quran-memorization',quranTafseer:'quran-tafseer',arabicLanguage:'arabic-language',islamicStudies:'islamic-studies',islamicValues:'islamic-values-for-children',tarteelQaidah:'tarteel-qaidah'};
 const slug=path.split('/')[1];
 const program=Object.keys(programSlugs).find(key=>programSlugs[key]===slug) || (slug==='quran-tajweed'?'quranReading':undefined);
 const bookingHref=`${homeHref}${program?`&program=${program}`:''}#book-trial`;
 const linkOverrides={'#programs':`/${lang}/programs`,'#teacher-training':`/${lang}/programs/teacher-training`,'#book-trial':bookingHref};
 const programLinks=Object.fromEntries(Object.entries(programSlugs).map(([key,slug])=>[key,`/${lang}/programs/${slug}`]));
 const [theme,setTheme]=useState<'light'|'dark'>('light');
 useEffect(()=>{const navigate=(language:string)=>{if(language!==lang) window.location.assign(`/${language}/${path}`);};instance.on('languageChanged',navigate);return ()=>{instance.off('languageChanged',navigate);};},[instance,lang,path]);
 return <I18nextProvider i18n={instance}>{footer?<Footer anchorPrefix={homeHref} logoHref={homeHref} linkOverrides={linkOverrides} programLinks={programLinks}/>:<Navbar theme={theme} onToggleTheme={()=>{const next=theme==='light'?'dark':'light';setTheme(next);document.documentElement.dataset.theme=next;}} anchorPrefix={homeHref} logoHref={homeHref} linkOverrides={linkOverrides} bookingHref={bookingHref} scrollToBooking={false}/>}</I18nextProvider>;
}
