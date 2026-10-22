"use client";
import { useEffect, useState } from 'react';
export function useFlowLanguage() {
 const [english,setEnglish]=useState(false);
 useEffect(()=>{
  const query=new URLSearchParams(window.location.search).get('lang');
  const language=query==='en'||query==='es'?query:localStorage.getItem('trucky_lang')||'es';
  setEnglish(language==='en');document.documentElement.lang=language;
  if(query==='en'||query==='es') localStorage.setItem('trucky_lang',query);
 },[]);
 return (es:string,en:string)=>english?en:es;
}
