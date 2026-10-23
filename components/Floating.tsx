"use client";

import { Icon } from "./Icons";
import { CONTACT, type Lang } from "@/lib/i18n";

export function FloatingActions({ lang }: { lang: Lang }) {
  const msg = lang === "es" ? CONTACT.whatsapp_msg_es : CONTACT.whatsapp_msg_en;
  const waHref = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  return (
    <div className="fab-stack">
      <a
        href={waHref}
        target="_blank"
        rel="noopener"
        className="fab fab-wa"
        aria-label="WhatsApp"
      >
        <Icon name="whatsapp" width={28} height={28} />
      </a>
    </div>
  );
}
