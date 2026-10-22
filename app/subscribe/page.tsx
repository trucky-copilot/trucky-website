"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
type Org = { id: string; name: string; subscription_status?: string };
export default function Subscribe() {
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/organizations", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw Error(body.error);
      setOrganizations(body.organizations);
      if (body.organizations.length === 1) setSelected(body.organizations[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : "BASE44_UNAVAILABLE"); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  const selectedOrg = organizations.find(org => org.id === selected);
  const subscribed = ["trialing", "active", "past_due"].includes(selectedOrg?.subscription_status || "");
  async function checkout() {
    if (!selected || busy || subscribed) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: selected }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error);
      const destination = new URL(body.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") throw Error("CHECKOUT_UNAVAILABLE");
      window.location.assign(destination.href);
    } catch (e) { setError(e instanceof Error ? e.message : "CHECKOUT_UNAVAILABLE"); setBusy(false); }
  }
  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_name: name }) });
      const body = await response.json();
      if (!response.ok) throw Error(body.error);
      setSelected(body.organization.id); setName(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "BASE44_UNAVAILABLE"); }
    finally { setBusy(false); }
  }
  return <main className="container-tr" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 700 }}>
    <a href="/">← Trucky</a><h1 className="h2">Tu empresa</h1>
    <p>Selecciona la empresa para la suscripción o crea una nueva.</p>
    {busy && <p role="status">Cargando…</p>}
    {error && <p role="alert">{error === "SIGN_IN_REQUIRED" ? "Inicia sesión de nuevo para continuar." : ({ CHECKOUT_NOT_READY: "Checkout aún no habilitado. No se ha iniciado ninguna compra.", TEST_ORGANIZATION_NOT_ALLOWED: "Esta empresa no está autorizada para pruebas.", RECONCILIATION_REQUIRED: "Hay un intento previo que requiere revisión. No vuelvas a contratar.", CHECKOUT_LOCKED: "Existe otro intento de compra en curso.", ALREADY_SUBSCRIBED: "Esta empresa ya tiene una suscripción." }[error] || "No se pudo completar la operación. No intentes crear otra suscripción; revisaremos el resultado.")}</p>}
    {error === "SIGN_IN_REQUIRED" && <button className="btn btn-primary" onClick={() => signIn("google", { callbackUrl: "/subscribe" })}>Continuar con Google</button>}
    {!error && <>
      <fieldset disabled={busy}><legend>Empresas que administras</legend>
        {organizations.length === 0 && <p>No hay empresas vinculadas a esta identidad de Google. Las cuentas antiguas requieren vinculación verificada.</p>}
        {organizations.map(org => <label key={org.id} style={{ display: "block", padding: 12 }}><input type="radio" name="organization" value={org.id} checked={selected === org.id} onChange={() => setSelected(org.id)} /> {org.name} — {org.subscription_status || "none"}</label>)}
      </fieldset>
      <form onSubmit={create} style={{ marginTop: 24 }}><label htmlFor="company">Nombre de la nueva empresa</label><input id="company" value={name} maxLength={120} required disabled={busy} onChange={e => setName(e.target.value)} /><button className="btn btn-ghost" disabled={busy || !name.trim()}>Crear empresa</button></form>
    </>}
    {subscribed ? <section style={{ marginTop: 24 }} aria-live="polite">
      <h2>{selectedOrg?.subscription_status === "trialing" ? "Tu empresa está en período de prueba" : selectedOrg?.subscription_status === "active" ? "Suscripción activa" : "La suscripción requiere atención de pago"}</h2>
      <p>La suscripción ya está registrada. No necesitas contratar otra vez.</p>
      <a className="btn btn-primary" href="https://trucky-17a283d5.base44.app/">Abrir aplicación Trucky</a>
      <p>La aplicación puede pedirte iniciar sesión de nuevo. Este enlace no transfiere tu sesión de Google ni garantiza permisos dentro de la app.</p>
    </section> : <>
      <button className="btn btn-primary" disabled={busy || !selected} onClick={checkout} style={{ marginTop: 24 }}>{busy ? "Procesando…" : "Continuar a Stripe — prueba"}</button>
      <p>30 días gratis al completar la suscripción. Esta pantalla no inicia la prueba ni activa acceso.</p>
    </>}
  </main>;
}
