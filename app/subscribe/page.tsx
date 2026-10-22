"use client";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
type Org = { id: string; name: string; subscription_status?: string; billing_demo_enabled?: boolean };
const APP_URL = "https://trucky-17a283d5.base44.app/";
const hasAccess = (org: Org) => ["trialing", "active"].includes(org.subscription_status || "");
export default function Subscribe() {
  const started = useRef(false);
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Preparando el pago seguro…");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [planLabel, setPlanLabel] = useState("");

  async function openCheckout(id: string) {
    setBusy(true); setError(""); setMessage("Abriendo Stripe para registrar tu tarjeta de prueba…");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organization_id: id, plan: new URLSearchParams(window.location.search).get("plan") }) });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "CHECKOUT_UNAVAILABLE");
      const url = new URL(body.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw Error("CHECKOUT_UNAVAILABLE");
      window.location.assign(url.href);
    } catch (e) { setError(e instanceof Error ? e.message : "CHECKOUT_UNAVAILABLE"); setBusy(false); }
  }
  async function initialize() {
    try {
      const response = await fetch("/api/organizations", { cache: "no-store" });
      if (response.status === 401) { setNeedsLogin(true); setBusy(false); setMessage(""); return; }
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "BASE44_UNAVAILABLE");
      const orgs: Org[] = body.organizations;
      setOrganizations(orgs);
      const returned = new URLSearchParams(window.location.search).get("checkout");
      if (returned === "returned") {
        // Never grant access based on a browser return. Wait for webhook state.
        setMessage("Confirmando la suscripción con el servidor…");
        for (let attempt = 0; attempt < 15; attempt++) {
          const statusResponse = await fetch("/api/organizations", { cache: "no-store" });
          if (!statusResponse.ok) throw Error("SUBSCRIPTION_CONFIRMATION_PENDING");
          const status = await statusResponse.json();
          if (status.organizations.some(hasAccess)) { window.location.assign(APP_URL); return; }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw Error("SUBSCRIPTION_CONFIRMATION_PENDING");
      }
      if (orgs.length === 0 && returned !== "canceled") {
        setMessage("Preparando tu cuenta para continuar a Stripe…");
        const created = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prepare_checkout: true }) });
        const workspace = await created.json();
        if (!created.ok || !workspace.organization?.id) throw Error(workspace.error || "BASE44_UNAVAILABLE");
        await openCheckout(workspace.organization.id);
        return;
      }
      if (orgs.length === 1) {
        setSelected(orgs[0].id);
        if (hasAccess(orgs[0])) { window.location.assign(APP_URL); return; }
        if (orgs[0].subscription_status === "none" && returned !== "canceled") { await openCheckout(orgs[0].id); return; }
      }
      setBusy(false); setMessage(orgs.length ? "Selecciona tu cuenta para continuar." : "Indica tu empresa para asociar correctamente la suscripción.");
    } catch (e) { setError(e instanceof Error ? e.message : "BASE44_UNAVAILABLE"); setBusy(false); }
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const plan = new URLSearchParams(window.location.search).get("plan");
    if (plan !== "owner_op" && plan !== "fleet" && !new URLSearchParams(window.location.search).has("checkout")) {
      setError("Selecciona Owner-Op o Flota desde los planes."); setBusy(false); return;
    }
    setPlanLabel(plan === "owner_op" ? "Plan $29" : plan === "fleet" ? "Plan $99" : "Tu suscripción");
    void initialize();
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_name: name }) });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "BASE44_UNAVAILABLE");
      setSelected(body.organization.id);
      await openCheckout(body.organization.id);
    } catch (e) { setError(e instanceof Error ? e.message : "BASE44_UNAVAILABLE"); setBusy(false); }
  }
  if (needsLogin) return <main className="demo-page"><section className="demo-card plan-login">
    <a href="/">← Trucky</a>
    <h1>Inicia sesión</h1>

    <button className="btn google-login-btn" onClick={() => signIn("google", { callbackUrl: window.location.pathname + window.location.search })}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" style={{marginRight:12,flexShrink:0}}><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.76-5.6-4.13H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59A5.98 5.98 0 0 1 12 5.95Z"/></svg>
      Continuar con Google
    </button>
    <p>Continúa con Google. Después de completar los datos de tarjeta en Stripe y confirmar la suscripción, te dirigiremos a la aplicación.</p>
    <p>Modo de pruebas: no uses una tarjeta real.</p>
  </section></main>;
  return <main className="demo-page"><section className="demo-card">
    <a href="/">← Trucky</a><h1 className="h2">{planLabel}</h1>

    <p role="note">Modo de pruebas: no hay cobros reales. Usa solo tarjetas de prueba de Stripe.</p>
    {busy ? <div className="checkout-loading" role="status" aria-label="Cargando"><span className="checkout-spinner" aria-hidden="true" /><span className="sr-only">Cargando…</span></div> : <p role="status">{message}</p>}
    {error && <div role="alert" style={{ padding: 16, border: "1px solid #a78bfa", margin: "20px 0" }}>
      <p>{({ EXISTING_CHECKOUT_DIFFERENT_PLAN: "Ya hay un intento de otro plan para esta cuenta. Debemos comprobar y cerrar ese checkout antes de cambiar de plan, para evitar suscripciones duplicadas.", DEMO_ORGANIZATION_REQUIRED: "Esta empresa anterior no está habilitada para la demo pública. No se ha iniciado una compra.", SIGN_IN_REQUIRED: "La sesión expiró. Inicia sesión otra vez.", RECONCILIATION_REQUIRED: "Hay un intento pendiente que requiere revisión. No crees otra suscripción.", ALREADY_SUBSCRIBED: "Tu empresa ya tiene una suscripción.", SUBSCRIPTION_CONFIRMATION_PENDING: "La confirmación está pendiente. No repitas la compra. Puedes consultar el estado de nuevo actualizando esta página." }[error] || "No se pudo continuar. Código: " + error)}</p>
      {error === "SIGN_IN_REQUIRED" && <button onClick={() => signIn("google", { callbackUrl: window.location.pathname + window.location.search })}>Iniciar sesión con Google</button>}
    </div>}
    {!busy && !error && organizations.length === 0 && <p>Compra cancelada. Vuelve a los planes para continuar.</p>}
    {!busy && !error && !needsLogin && organizations.length > 0 && <fieldset><legend>Tu cuenta</legend>
      {organizations.map(org => <label key={org.id} style={{ display: "block", padding: 12 }}><input type="radio" name="org" checked={selected === org.id} onChange={() => setSelected(org.id)} /> {org.name}</label>)}
      <button className="btn btn-primary" disabled={!selected} onClick={() => {
        const org = organizations.find(o => o.id === selected);
        if (org && hasAccess(org)) window.location.assign(APP_URL); else void openCheckout(selected);
      }}>Continuar</button>
    </fieldset>}
    <p style={{ marginTop: 24 }}>La aplicación puede solicitar su propio inicio de sesión; no se transfiere una sesión entre dominios.</p>
  </section></main>;
}
