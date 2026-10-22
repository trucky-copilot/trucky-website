"use client";

import { useState } from "react";
import { Icon } from "./Icons";
import { I18N, type Lang } from "@/lib/i18n";

const WHO_IMAGES = [
  "/who-owner-op.jpg",
  "/who-dispatcher.jpg",
  "/who-fleet.jpg",
];

export function Problem({ lang }: { lang: Lang }) {
  const t = I18N[lang].problem;
  return (
    <section className="problem" id="problem">
      <div className="container-tr">
        <div className="problem-grid">
          <div>
            <div className="section-tag" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              {t.tag}
            </div>
            <h2 className="h2" style={{ marginTop: 24, color: "white" }}>
              {t.title_1}
              <span className="italic-serif" style={{ color: "white" }}>
                {t.title_2}
              </span>
              {t.title_3}
            </h2>
            <p style={{ fontSize: "1.1rem", opacity: 0.85, marginTop: 20 }}>
              {t.subtitle}
            </p>
            <ul className="problem-list">
              {t.list.map((item, i) => (
                <li key={i}>
                  <Icon name="x" width={22} height={22} style={{ color: "#ff8a8a", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="problem-visual">
            <img
              src="/problem-stressed-driver.jpg"
              alt={
                lang === "es"
                  ? "Conductor revisando documentos mientras maneja"
                  : "Driver reviewing documents while driving"
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhoItsFor({ lang }: { lang: Lang }) {
  const t = I18N[lang].who;
  return (
    <section id="who">
      <div className="container-tr">
        <div className="section-header-center">
          <div className="section-tag">{t.tag}</div>
          <h2 className="h2" style={{ marginTop: 20 }}>
            {t.title_1}
            <span className="italic-serif">{t.title_2}</span>
            {t.title_3}
          </h2>
        </div>
        <div className="who-grid">
          {t.cards.map((c, i) => (
            <div key={i} className="who-card-photo">
              <div className="who-photo-wrap">
                <img src={WHO_IMAGES[i]} alt={c.role} />
                <div className="who-photo-gradient" />
                <div className="who-photo-role">{c.role}</div>
              </div>
              <div className="who-photo-body">
                <p>{c.desc}</p>
                <ul className="who-bullets">
                  {c.bullets.map((b, j) => (
                    <li key={j}>
                      <Icon name="check" width={14} height={14} style={{ color: "var(--brand)", flexShrink: 0 }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Solution({ lang }: { lang: Lang }) {
  const t = I18N[lang].solution;
  return (
    <section id="solution">
      <div className="container-tr">
        <div className="section-header-center">
          <div className="section-tag">{t.tag}</div>
          <h2 className="h2" style={{ marginTop: 20 }}>
            {t.title_1}
            <span className="italic-serif">{t.title_2}</span>
            {t.title_3}
          </h2>
          <p className="section-sub">{t.subtitle}</p>
        </div>
        <div className="features">
          {t.features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="icon">
                <Icon name={f.icon} width={26} height={26} />
              </div>
              <h3 className="h3">{f.title}</h3>
              <p>{f.desc}</p>
              {f.example && (
                <div className="feature-example">
                  <span className="feature-example-label">
                    {lang === "es" ? "Ejemplo real" : "Real example"}
                  </span>
                  <span>{f.example}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ lang }: { lang: Lang }) {
  const t = I18N[lang].how;
  return (
    <section className="how" id="how">
      <div className="container-tr">
        <div className="section-header-center">
          <div className="section-tag">{t.tag}</div>
          <h2 className="h2" style={{ marginTop: 20 }}>
            {t.title_1}
            <span className="italic-serif">{t.title_2}</span>
            {t.title_3}
          </h2>
        </div>
        <div className="steps">
          {t.steps.map((s, i) => (
            <div key={i} className="step">
              <div className="step-num">0{i + 1}</div>
              <h3 className="h3">{s.title}</h3>
              <p>{s.desc}</p>
              {s.detail && <div className="step-detail">{s.detail}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing({ lang, onOpenDemo }: { lang: Lang; onOpenDemo: () => void }) {
  const t = I18N[lang].pricing;
  return (
    <section id="pricing">
      <div className="container-tr">
        <div className="section-header-center">
          <div className="section-tag">{t.tag}</div>
          <h2 className="h2" style={{ marginTop: 20 }}>
            {t.title_1}
            <span className="italic-serif">{t.title_2}</span>
            {t.title_3}
          </h2>
          <p className="section-sub">{t.subtitle}</p>
        </div>
        <div className="pricing-grid">
          {t.plans.map((p, i) => (
            <div key={i} className={`price-card ${p.highlight ? "highlight" : ""}`}>
              {p.badge && <div className="price-badge">{p.badge}</div>}
              <div className="price-name">{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span className="price-num">{p.price}</span>
                <span className="price-period">{p.period}</span>
              </div>
              <div className="price-desc">{p.desc}</div>
              <ul className="price-bullets">
                {p.bullets.map((b, j) => (
                  <li key={j}>
                    <Icon name="check" width={15} height={15} style={{ color: p.highlight ? "white" : "var(--brand)", marginTop: 2, flexShrink: 0 }} />
                    {b}
                  </li>
                ))}
              </ul>
              <button className={`btn ${p.highlight ? "btn-primary" : "btn-ghost"} btn-block`} onClick={() => { if (i === 2) window.location.assign("mailto:trucky.road.copilot@gmail.com"); else window.location.assign(`/subscribe?plan=${i === 0 ? "owner_op" : "fleet"}`); }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
        <div className="price-note">{t.free_trial}</div>
      </div>
    </section>
  );
}

export function FAQ({ lang }: { lang: Lang }) {
  const t = I18N[lang].faq;
  const [open, setOpen] = useState(0);
  return (
    <section className="faq" id="faq">
      <div className="container-tr">
        <div className="faq-inner">
          <div>
            <div className="section-tag">{t.tag}</div>
            <h2 className="h2" style={{ marginTop: 20 }}>
              {t.title}
            </h2>
            <p className="section-sub" style={{ marginLeft: 0 }}>
              {t.subtitle}
            </p>
          </div>
          <div>
            {t.items.map((item, i) => (
              <div
                key={i}
                className={`faq-item ${open === i ? "open" : ""}`}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <div className="faq-q">
                  <span>{item.q}</span>
                  <span className="faq-toggle">{open === i ? "−" : "+"}</span>
                </div>
                <div className="faq-a">
                  <div className="faq-a-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCTA({ lang, onOpenDemo }: { lang: Lang; onOpenDemo: () => void }) {
  const t = I18N[lang].cta;
  return (
    <section className="cta" id="contact">
      <div className="container-tr">
        <h2 className="h2">
          {t.title_1}
          <span className="italic-serif" style={{ color: "white" }}>
            {t.title_2}
          </span>
          {t.title_3}
        </h2>
        <p>{t.subtitle}</p>
        <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <button className="btn btn-primary btn-lg" onClick={onOpenDemo}>
            <Icon name="calendar" width={18} height={18} />
            {t.primary}
          </button>
        </div>
      </div>
    </section>
  );
}
