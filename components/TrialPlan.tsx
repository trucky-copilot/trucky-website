"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import type { Lang } from "@/lib/i18n";
export function TrialPlan({ lang }: { lang: Lang }) {
  const [plan, setPlan] = useState<{ amount: number; currency: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { fetch("/api/plan").then(r => { if (!r.ok) throw Error(); return r.json(); }).then(setPlan).catch(() => setFailed(true)); }, []);
  const es = lang === "es";
  return <section id="pricing"><div className="container-tr">
    <div className="section-header-center"><h2 className="h2">{es ? "Plan Trucky" : "Trucky Plan"}</h2>
      <p className="section-sub">{es ? "30 días completos gratis. Después, pago mensual." : "30 full days free. Monthly billing afterwards."}</p></div>
    <div className="price-card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="price-name">Trucky</div>
      <div className="price-num">{plan ? new Intl.NumberFormat(es ? "es" : "en", { style: "currency", currency: plan.currency }).format(plan.amount) : "—"}</div>
      <p>{es ? "al mes, después de 30 días gratis" : "per month after 30 free days"}</p>
      <p>{es ? "Entorno de pruebas. No se realizan cobros reales." : "Test environment. No real charges."}</p>
      {failed && <p role="alert">{es ? "No se pudo cargar el precio. Intenta de nuevo más tarde." : "Price unavailable. Please try again later."}</p>}
      <button className="btn btn-primary btn-block" onClick={() => signIn("google", { callbackUrl: "/subscribe" })}>{es ? "Empezar demo" : "Start demo"}</button>
      <p className="price-note">{es ? "Checkout pendiente de conectar con la activación de cuentas. Iniciar sesión todavía no activa la prueba." : "Checkout pending account provisioning integration. Signing in does not start a trial yet."}</p>
    </div>
  </div></section>;
}
