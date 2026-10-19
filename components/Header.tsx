"use client";

import { useEffect, useState } from "react";
import { Icon, Logo } from "./Icons";
import { I18N, type Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: "auto" | "light" | "dark";
  setTheme: (t: "auto" | "light" | "dark") => void;
  onOpenDemo: () => void;
};

export function Header({ lang, setLang, theme, setTheme, onOpenDemo }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = I18N[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark =
    theme === "dark" ||
    (theme === "auto" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <a href="#top" className="nav-logo" style={{ display: "flex" }}>
          <Logo height={26} />
        </a>
        <div className="nav-links">
          <a href="#solution" className="link">
            {t.nav.product}
          </a>
          <a href="#how" className="link">
            {t.nav.how}
          </a>
          <a href="#pricing" className="link">
            {t.nav.pricing}
          </a>
          <a href="#faq" className="link">
            {t.nav.faq}
          </a>
        </div>
        <div className="nav-tools">
          <div className="lang-toggle desktop-only">
            <button
              className={lang === "es" ? "active" : ""}
              onClick={() => setLang("es")}
            >
              ES
            </button>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
          <button
            className="icon-btn desktop-only"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Icon name={isDark ? "sun" : "moon"} width={20} height={20} />
          </button>
          <button className="btn btn-primary desktop-only" onClick={onOpenDemo}>
            {t.nav.cta}
          </button>
        </div>
      </div>
    </nav>
  );
}
