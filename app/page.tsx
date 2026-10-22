"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import {
  Problem,
  WhoItsFor,
  Solution,
  HowItWorks,
  Pricing,
  FAQ,
  FinalCTA,
} from "@/components/Sections";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/Floating";
import { DemoModal } from "@/components/DemoModal";
import type { Lang } from "@/lib/i18n";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("es");
  const [theme, setTheme] = useState<"auto" | "light" | "dark">("auto");
  const [demoOpen, setDemoOpen] = useState(false);

  // Hydrate persisted state after mount
  useEffect(() => {
    const savedLang = localStorage.getItem("trucky_lang") as Lang | null;
    const savedTheme = localStorage.getItem("trucky_theme") as
      | "auto"
      | "light"
      | "dark"
      | null;
    if (savedLang) setLang(savedLang);
    else if (typeof navigator !== "undefined" && !navigator.language.startsWith("es"))
      setLang("en");
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
        onOpenDemo={() => window.location.assign("/subscribe")}
      />
      <main>
        <div role="note" style={{ padding: "12px 24px", textAlign: "center", background: "#151027", color: "#e2ddf5", position: "relative", zIndex: 10, marginTop: "var(--nav-h)" }}>
          Demo con Stripe en modo de pruebas. No uses tarjetas reales. No se realizarán cobros reales.
          {" "}<a href="/subscribe" style={{ textDecoration: "underline" }}>Mi suscripción / Ir a Trucky</a>
        </div>
        <Hero lang={lang} onOpenDemo={() => window.location.assign("/subscribe")} />
        <Problem lang={lang} />
        <WhoItsFor lang={lang} />
        <Solution lang={lang} />
        <HowItWorks lang={lang} />

        <FAQ lang={lang} />
        <FinalCTA lang={lang} onOpenDemo={() => window.location.assign("/subscribe")} />
      </main>
      <Footer lang={lang} />
      <FloatingActions lang={lang} />
      {demoOpen && <DemoModal lang={lang} onClose={() => setDemoOpen(false)} />}
    </>
  );
}
