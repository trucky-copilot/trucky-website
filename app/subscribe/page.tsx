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
      if (orgs.length === 1) {
        setSelected(orgs[0].id);
        if (hasAccess(orgs[0])) { window.location.assign(APP_URL); return; }
        if (orgs[0].subscription_status === "none" && returned !== "canceled") { await openCheckout(orgs[0].id); return; }
      }
      setBusy(false); setMessage(orgs.length ? "Selecciona tu empresa para continuar." : "Indica tu empresa para asociar correctamente la suscripción.");
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
    <p>Continúa con Google para contratar el plan {planLabel}.</p>
    <button className="btn btn-primary" onClick={() => signIn("google", { callbackUrl: window.location.pathname + window.location.search })}>
      <span aria-hidden="true" style={{background:"white",color:"#4285f4",borderRadius:4,padding:"2px 7px",marginRight:12,fontWeight:800}}>G</span>
      Continuar con Google
    </button>
    <p>Después continuarás a Stripe para introducir tu tarjeta. Primeros 30 días gratis. El precio mensual se confirma en Stripe.</p>
    <p>Modo de pruebas: no uses una tarjeta real.</p>
  </section></main>;
  return <main className="demo-page"><section className="demo-card">
    <a href="/">← Trucky</a><h1 className="h2">{planLabel}</h1>

    <p role="note">Modo de pruebas: no hay cobros reales. Usa solo tarjetas de prueba de Stripe.</p>
    <p role="status">{message}</p>
    {error && <div role="alert" style={{ padding: 16, border: "1px solid #a78bfa", margin: "20px 0" }}>
      <p>{({ DEMO_ORGANIZATION_REQUIRED: "Esta empresa anterior no está habilitada para la demo pública. No se ha iniciado una compra.", SIGN_IN_REQUIRED: "La sesión expiró. Inicia sesión otra vez.", RECONCILIATION_REQUIRED: "Hay un intento pendiente que requiere revisión. No crees otra suscripción.", ALREADY_SUBSCRIBED: "Tu empresa ya tiene una suscripción.", SUBSCRIPTION_CONFIRMATION_PENDING: "La confirmación está pendiente. No repitas la compra. Puedes consultar el estado de nuevo actualizando esta página." }[error] || "No se pudo continuar. Código: " + error)}</p>
      {error === "SIGN_IN_REQUIRED" && <button onClick={() => signIn("google", { callbackUrl: window.location.pathname + window.location.search })}>Iniciar sesión con Google</button>}
    </div>}
    {!busy && !error && !needsLogin && organizations.length === 0 && <form onSubmit={create}>
      <label htmlFor="company">Nombre de tu empresa</label>
      <input id="company" required maxLength={120} value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: 12, margin: "12px 0", color: "#111", borderRadius: 8 }} />
      <button className="btn btn-primary" disabled={!name.trim()}>Continuar a Stripe</button>
    </form>}
    {!busy && !error && !needsLogin && organizations.length > 0 && <fieldset><legend>Tu empresa</legend>
      {organizations.map(org => <label key={org.id} style={{ display: "block", padding: 12 }}><input type="radio" name="org" checked={selected === org.id} onChange={() => setSelected(org.id)} /> {org.name}</label>)}
      <button className="btn btn-primary" disabled={!selected} onClick={() => {
        const org = organizations.find(o => o.id === selected);
        if (org && hasAccess(org)) window.location.assign(APP_URL); else void openCheckout(selected);
      }}>Continuar</button>
    </fieldset>}
    <p style={{ marginTop: 24 }}>La aplicación puede solicitar su propio inicio de sesión; no se transfiere una sesión entre dominios.</p>
  </section></main>;
}
