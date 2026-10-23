# Trucky — Marketing Website

Cinematic landing page for **Trucky**, an AI-powered Rate Confirmation verifier for owner-operators, dispatchers, and small fleets.

## Stack

- **Next.js 15** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** + custom design tokens as CSS variables
- Static assets in `/public` (hero video, portraits, logos)

## Features

- **Cinematic hero** with full-bleed autoplay video (Rolex-style)
- **Bilingual ES / EN** with runtime toggle
- **Dark / light mode** with auto system detection + manual override
- **Interactive sections**: Problem → Who it's for → Solution → How → Pricing → FAQ → CTA
- **Demo modal** with 3 tabs: Form / WhatsApp / Calendly (embedded iframe)
- **Floating WhatsApp** button with pre-composed message

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── layout.tsx          Root layout + Google Fonts
├── page.tsx            Home page — orchestrates all sections
└── globals.css         Design tokens (CSS vars) + component styles

components/
├── Header.tsx          Sticky nav with lang/theme toggle
├── Hero.tsx            Cinematic video hero + trust stats
├── Sections.tsx        Problem, WhoItsFor, Solution, HowItWorks, Pricing, FAQ, FinalCTA
├── Footer.tsx          4-col footer with socials
├── Floating.tsx        WhatsApp FAB
├── DemoModal.tsx       3-tab demo booking modal (form + wa + calendly)
└── Icons.tsx           Feather-style icon set + Logo component

lib/
└── i18n.ts             Bilingual copy dictionary + CONTACT config

public/                 Static assets
├── logo-trucky.png     (white variant, for dark bgs)
├── logo-trucky-purple.png  (purple, for light bgs)
├── hero-video.mp4      (2.4 MB, 8s cinematic)
├── hero-poster.jpg     (video poster)
├── who-owner-op.jpg    (Owner-Op portrait)
├── who-dispatcher.jpg  (Dispatcher portrait)
├── who-fleet.jpg       (Fleet Manager portrait)
├── problem-stressed-driver.jpg  (Problem section image)
└── truck.png           (top-down truck cutout, unused but kept)
```

## Configuration

All contact info + Calendly URL live in `lib/i18n.ts` → `CONTACT`:

```ts
export const CONTACT = {
  whatsapp: "+573115533824",
  email: "trucky.road.copilot@gmail.com",
  calendly: "https://calendly.com/trucky-road-copilot/30min",
  instagram: "https://www.instagram.com/trucky.ai",
  facebook: "https://www.facebook.com/share/1FWNZG9TeT/",
  tiktok: "https://www.tiktok.com/@trucky.ia",
};
```

Move to environment variables (`NEXT_PUBLIC_TRUCKY_*`) before production.

## Design Tokens

Defined as CSS custom properties in `app/globals.css` and mirrored in `tailwind.config.ts`:

**Brand color:** `#4b1fd6` (purple-600) — single hero color, no competing accents.

**Semaphore (verdict):** green `#22c55e`, yellow `#fbbf24`, red `#e63b3b`.

**Typography:**
- Display: `Inter Tight` 700/800, letter-spacing `-0.04em`
- Body: `Inter` 400-700
- Serif italic accent: `Instrument Serif` (used for stylized words in headings)
- Mono: `JetBrains Mono` (for code/doc fields)

**Radii:** `10px` (sm), `18px` (md), `28px` (lg), `999px` (pill).

**Shadows:** purple-tinted (`rgba(74,31,214,.10-.18)`) — never gray.

**Motion signature:** `cubic-bezier(0.16, 1, 0.3, 1)` (spring-out).

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project in [vercel.com/new](https://vercel.com/new)
3. Deploy (auto-detects Next.js, no config needed)

Alternatively, drop the zipped project on **Vercel dashboard → Add new → Project → Upload**.

### Custom domain

Once deployed:
- Vercel → your project → Settings → Domains → Add
- Point your registrar's DNS to Vercel's records (A + CNAME)
- SSL auto-generated

## Production TODOs

Before shipping publicly, you'll want to:

- [ ] **Backend for leads** — Currently form submissions save to `localStorage` only. Wire to Supabase / Formspree / your API endpoint (see `components/DemoModal.tsx` → `handleSubmit`).
- [ ] **Move contact info to env vars** — Extract `CONTACT` in `lib/i18n.ts` to `NEXT_PUBLIC_*` env vars.
- [ ] **Optimize images** — Convert JPG portraits to WebP/AVIF; serve hero-video via a CDN with adaptive bitrate (mux.com, Cloudflare Stream).
- [ ] **Reduced-motion fallback** — Add `<img>` fallback for hero video when `prefers-reduced-motion: reduce`.
- [ ] **AI chat integration** (optional) — The original prototype had a floating AI chat that answered product questions. Rebuild it against OpenAI/Anthropic API if desired.
- [ ] **Admin panel** — The original had a `/admin` route to view captured leads. Rebuild with real auth (Clerk, NextAuth) when the backend is in place.
- [ ] **i18n framework** — For scale, migrate from the hand-rolled `I18N` dictionary to `next-intl`.
- [ ] **SEO** — Add Open Graph tags, sitemap, robots.txt, meta descriptions per section.

## Copy voice

Direct, warm, no corporate speak. "Tú" (not "usted") in Spanish. Trucking jargon stays in English inside Spanish copy: *Rate Confirmation, dead head, RPM, broker, MC number, lane, TMS, quote*. Never translate these.

## License

Proprietary — © 2026 Trucky. All rights reserved.
