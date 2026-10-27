"use client";
import { useEffect, useRef, useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import type { Lang } from "@/lib/i18n";
export function AccountButton({ lang }: { lang: Lang }) {
  const container = useRef<HTMLSpanElement>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const refresh = () => { getSession().then(setSession).catch(() => setSession(null)); };
    refresh(); window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  useEffect(() => { setImageFailed(false); setConfirmLogout(false); }, [session?.user?.image, session?.user?.email]);
  useEffect(() => {
    if (!confirmLogout) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !container.current?.contains(event.target)) setConfirmLogout(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setConfirmLogout(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [confirmLogout]);
  const label = session ? (lang === "es" ? "Abrir menú de cuenta" : "Open account menu") : (lang === "es" ? "Iniciar sesión con Google" : "Sign in with Google");
  return <span className="account-menu" ref={container}><button className="icon-btn" aria-expanded={confirmLogout} aria-haspopup="menu" aria-label={label} title={label}
    onClick={() => session ? setConfirmLogout(!confirmLogout) : signIn("google", { callbackUrl: "/" })}>
    {session?.user ? (session.user.image && !imageFailed ?
      <img src={session.user.image} alt="" referrerPolicy="no-referrer" className="account-avatar" onError={() => setImageFailed(true)} /> :
      <span className="account-avatar account-avatar-fallback" aria-hidden="true">{(session.user.name || session.user.email || "T").trim().charAt(0).toUpperCase()}</span>
    ) : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 22v-2a8 8 0 0 1 16 0v2" />
    </svg>}
  </button>
    {confirmLogout && <div className="account-dropdown" role="menu">
      <button role="menuitem" onClick={() => signOut({callbackUrl:"/"})}>{lang === "es" ? "Cerrar sesión" : "Sign out"}</button>
    </div>}
  </span>;
}
