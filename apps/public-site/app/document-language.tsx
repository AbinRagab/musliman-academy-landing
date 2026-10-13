'use client';
import { useEffect } from 'react';
export default function DocumentLanguage({language}:{language:string}) { useEffect(()=>{document.documentElement.lang=language;document.documentElement.dir=language==='ar'||language==='ur'?'rtl':'ltr';},[language]);return null; }
