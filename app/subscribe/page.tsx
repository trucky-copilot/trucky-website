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
    {error && <p role="alert">{error === "SIGN_IN_REQUIRED" ? "Inicia sesión de nuevo para continuar." : "La integración de empresas está pendiente de publicación o no está disponible. No se ha iniciado ninguna compra."}</p>}
    {error === "SIGN_IN_REQUIRED" && <button className="btn btn-primary" onClick={() => signIn("google", { callbackUrl: "/subscribe" })}>Continuar con Google</button>}
    {!error && <>
      <fieldset disabled={busy}><legend>Empresas que administras</legend>
        {organizations.length === 0 && <p>No hay empresas vinculadas a esta identidad de Google. Las cuentas antiguas requieren vinculación verificada.</p>}
        {organizations.map(org => <label key={org.id} style={{ display: "block", padding: 12 }}><input type="radio" name="organization" value={org.id} checked={selected === org.id} onChange={() => setSelected(org.id)} /> {org.name} — {org.subscription_status || "none"}</label>)}
      </fieldset>
      <form onSubmit={create} style={{ marginTop: 24 }}><label htmlFor="company">Nombre de la nueva empresa</label><input id="company" value={name} maxLength={120} required disabled={busy} onChange={e => setName(e.target.value)} /><button className="btn btn-ghost" disabled={busy || !name.trim()}>Crear empresa</button></form>
    </>}
    <button className="btn btn-primary" disabled style={{ marginTop: 24 }}>Checkout pendiente de validación</button>
    <p>30 días gratis al completar la suscripción. Esta pantalla no inicia la prueba ni activa acceso.</p>
  </main>;
}
