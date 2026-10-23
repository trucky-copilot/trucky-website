"use client";

import { useState } from "react";
import { Icon } from "./Icons";
import { I18N, CONTACT, type Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  onClose: () => void;
};

export function DemoModal({ lang, onClose }: Props) {
  const t = I18N[lang].modal;
  const [tab, setTab] = useState<"form" | "wa" | "cal">("form");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    msg: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: POST to your backend / Formspree / Supabase
    try {
      const raw = localStorage.getItem("trucky_leads") || "[]";
      const leads = JSON.parse(raw);
      leads.push({
        ...form,
        lang,
        source: "form",
        created_at: new Date().toISOString(),
        id: Date.now(),
      });
      localStorage.setItem("trucky_leads", JSON.stringify(leads));
    } catch {}
    setSubmitted(true);
  };

  const openWA = () => {
    const msg = `Hola, soy ${form.name || "[nombre]"}${
      form.company ? " de " + form.company : ""
    }. Quiero agendar una demo del Verificador de Documentos de Trucky. ${form.msg || ""}`;
    window.open(
      `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h3>{t.title}</h3>
            <p>{t.sub}</p>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label={t.close}
            style={{ background: "var(--bg-elev)", color: "var(--text-muted)" }}
          >
            <Icon name="x" width={18} height={18} />
          </button>
        </div>
        <div className="modal-body">
          {!submitted && (
            <div className="tab-row">
              <button
                className={tab === "form" ? "active" : ""}
                onClick={() => setTab("form")}
              >
                {t.tab_form}
              </button>
              <button
                className={tab === "wa" ? "active" : ""}
                onClick={() => setTab("wa")}
              >
                {t.tab_wa}
              </button>
              <button
                className={tab === "cal" ? "active" : ""}
                onClick={() => setTab("cal")}
              >
                {t.tab_cal}
              </button>
            </div>
          )}

          {submitted && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#22c55e",
                  color: "white",
                  margin: "0 auto 20px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="check" width={32} height={32} />
              </div>
              <h4 style={{ fontFamily: "'Inter Tight'", fontSize: "1.4rem", margin: "0 0 8px" }}>
                {lang === "es" ? "¡Recibimos tu solicitud!" : "Request received!"}
              </h4>
              <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
                {lang === "es"
                  ? "Te escribiremos en menos de 24 horas."
                  : "We'll be in touch in under 24 hours."}
              </p>
              <button className="btn btn-ghost" onClick={onClose}>
                {t.close}
              </button>
            </div>
          )}

          {!submitted && tab === "form" && (
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="form-field">
                <label>{t.field_name} *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>{t.field_email} *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>{t.field_phone}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>{t.field_company}</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>{t.field_msg}</label>
                <textarea
                  rows={3}
                  value={form.msg}
                  onChange={(e) => setForm({ ...form, msg: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                {t.submit}
              </button>
            </form>
          )}

          {!submitted && tab === "wa" && (
            <div>
              <div className="form-grid">
                <div className="form-field">
                  <label>{t.field_name}</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>{t.field_msg}</label>
                  <textarea
                    rows={2}
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                  />
                </div>
                <button className="btn btn-wa" onClick={openWA}>
                  <Icon name="whatsapp" width={18} height={18} />
                  {t.wa_submit}
                </button>
              </div>
            </div>
          )}

          {!submitted && tab === "cal" && (
            <div>
              <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>{t.cal_desc}</p>
              <iframe
                src={CONTACT.calendly}
                width="100%"
                height="560"
                style={{ border: 0, borderRadius: 14 }}
                title="Calendly"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
