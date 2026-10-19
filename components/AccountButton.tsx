"use client";
import { useEffect, useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import type { Lang } from "@/lib/i18n";
export function AccountButton({ lang }: { lang: Lang }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { getSession().then(setSession).catch(() => setSession(null)); }, []);
  const label = session ? (lang === "es" ? "Cerrar sesión" : "Sign out") : (lang === "es" ? "Iniciar sesión con Google" : "Sign in with Google");
  return <button className="icon-btn" aria-label={label} title={label}
    onClick={() => session ? signOut({ callbackUrl: "/" }) : signIn("google", { callbackUrl: "/" })}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 22v-2a8 8 0 0 1 16 0v2" />
    </svg>
  </button>;
}
