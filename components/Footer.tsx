import { Icon, Logo } from "./Icons";
import { I18N, CONTACT, type Lang } from "@/lib/i18n";

export function Footer({ lang }: { lang: Lang }) {
  const t = I18N[lang].footer;
  return (
    <footer className="footer">
      <div className="container-tr">
        <div className="footer-grid">
          <div className="footer-brand">
            <h4 style={{ margin: "0 0 16px" }}>
              <Logo height={32} />
            </h4>
            <p>{t.tagline}</p>
            <div className="footer-socials">
              <a href={CONTACT.instagram} target="_blank" rel="noopener" aria-label="Instagram">
                <Icon name="instagram" width={18} height={18} />
              </a>
              <a href={CONTACT.facebook} target="_blank" rel="noopener" aria-label="Facebook">
                <Icon name="facebook" width={18} height={18} />
              </a>
              <a href={CONTACT.tiktok} target="_blank" rel="noopener" aria-label="TikTok">
                <Icon name="tiktok" width={18} height={18} />
              </a>
              <a href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" aria-label="WhatsApp">
                <Icon name="whatsapp" width={18} height={18} />
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h5>{t.product}</h5>
            {t.product_links.map((l, i) => (
              <a key={i} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="footer-col">
            <h5>{t.company}</h5>
            {t.company_links.map((l, i) => (
              <a key={i} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="footer-col">
            <h5>{t.legal}</h5>
            {t.legal_links.map((l, i) => (
              <a key={i} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t.copyright}</span>
          <div style={{ display: "flex", gap: 16 }}>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">
              {CONTACT.whatsapp_display}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
