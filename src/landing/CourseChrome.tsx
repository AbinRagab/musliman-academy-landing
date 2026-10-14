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
 const [theme,setTheme]=useState<'light'|'dark'>('light');
 useEffect(()=>{const navigate=(language:string)=>{if(language!==lang) window.location.assign(`/${language}/${path}`);};instance.on('languageChanged',navigate);return ()=>{instance.off('languageChanged',navigate);};},[instance,lang,path]);
 return <I18nextProvider i18n={instance}>{footer?<Footer anchorPrefix="/" logoHref="/"/>:<Navbar theme={theme} onToggleTheme={()=>{const next=theme==='light'?'dark':'light';setTheme(next);document.documentElement.dataset.theme=next;}} anchorPrefix="/" logoHref="/" bookingHref={`/?program=quranReading&lang=${lang}#book-trial`} scrollToBooking={false}/>}</I18nextProvider>;
}
