"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import {
  Problem,
  WhoItsFor,
  Solution,
  HowItWorks,
  Academies,
  Pricing,
  FAQ,
  FinalCTA,
} from "@/components/Sections";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/Floating";
import { DemoModal } from "@/components/DemoModal";
import { demoWhatsAppHref, type Lang } from "@/lib/i18n";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("es");
  const [theme, setTheme] = useState<"auto" | "light" | "dark">("auto");
  const [demoSent, setDemoSent] = useState(false);
  useEffect(() => { setDemoSent(new URLSearchParams(window.location.search).get("demo") === "sent"); }, []);
  const [demoOpen, setDemoOpen] = useState(false);

  // Hydrate persisted state after mount
  useEffect(() => {
    const queryLang = new URLSearchParams(window.location.search).get("lang");
    const savedLang = (queryLang === "en" || queryLang === "es" ? queryLang : localStorage.getItem("trucky_lang")) as Lang | null;
    const savedTheme = localStorage.getItem("trucky_theme") as
      | "auto"
      | "light"
      | "dark"
      | null;
    if (savedLang) setLang(savedLang);
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem("trucky_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("trucky_theme", theme);
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <Header
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        onOpenDemo={() => window.location.assign(demoWhatsAppHref(lang))}
      />
      <main>
        {demoSent && <p role="status" style={{position:"fixed",bottom:24,left:24,zIndex:200,padding:20,background:"#24163b",color:"white",borderRadius:16}}>{lang === "en" ? "Request sent. Check your inbox and spam folder." : "Solicitud enviada. Revisa tu correo y la carpeta de spam."}</p>}
        <Hero lang={lang} onOpenDemo={() => window.location.assign(demoWhatsAppHref(lang))} />
        <Problem lang={lang} />
        <WhoItsFor lang={lang} />
        <Solution lang={lang} />
        <HowItWorks lang={lang} />

        <Academies lang={lang} onOpenDemo={() => window.location.assign(demoWhatsAppHref(lang))} />
        <Pricing lang={lang} onOpenDemo={() => window.location.assign(demoWhatsAppHref(lang))} />
        <FAQ lang={lang} />
        <FinalCTA lang={lang} onOpenDemo={() => window.location.assign(demoWhatsAppHref(lang))} />
      </main>
      <Footer lang={lang} />
      <FloatingActions lang={lang} />
      {demoOpen && <DemoModal lang={lang} onClose={() => setDemoOpen(false)} />}
    </>
  );
}
