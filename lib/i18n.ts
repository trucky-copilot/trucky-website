export type Lang = "es" | "en";

export const CONTACT = {
  whatsapp: "+573115533824",
  whatsapp_display: "+57 311 553 3824",
  whatsapp_msg_es:
    "Hola! Quiero agendar una demo del Verificador de Documentos de Trucky.",
  whatsapp_msg_en:
    "Hi! I'd like to book a demo of Trucky's Document Verifier.",
  instagram: "https://www.instagram.com/trucky.ai",
  facebook: "https://www.facebook.com/share/1FWNZG9TeT/",
  tiktok: "https://www.tiktok.com/@trucky.ia",
  email: "trucky.road.copilot@gmail.com",
  calendly: "https://calendly.com/trucky-road-copilot/30min",
};

export const I18N = {
  es: {
    nav: {
      product: "Producto",
      how: "Cómo funciona",
      demo: "Demo",
      pricing: "Precios",
      faq: "Preguntas",
      cta: "Agendar Demo",
    },
    hero: {
      tag: "Verificador de Documentos · Early Access",
      title_1: "Deja de leer ",
      title_2: "Rate Confirmations",
      title_3: " línea por línea. ",
      title_4: "Revisa solo lo que importa",
      title_5: ".",
      subtitle:
        "Sube el RC. En 30 segundos Trucky te dice si la tarifa cuadra, si el dead head está bien pagado, y si el broker es de fiar. Tú firmas.",
      cta_primary: "Probar con un RC de ejemplo",
      cta_secondary: "Ver cómo funciona",
      badge: "IA revisando en vivo",
      microtrust_title: "En beta con truckers reales",
      microtrust_sub: "Owner-ops y flotas pequeñas · US + Colombia",
      stats: [
        { num: "~30s", label: "Por RC procesado" },
        { num: "15+", label: "Campos verificados" },
        { num: "24/7", label: "Sin turno ni descanso" },
        { num: "ES · EN", label: "Documentos bilingües" },
      ],
      stats_footnote:
        "Métricas medidas en pruebas internas con clientes early access. Tus resultados pueden variar según flota y broker.",
    },
    problem: {
      tag: "El problema",
      title_1: "Hoy los revisas ",
      title_2: "a mano",
      title_3:
        ", muchas veces manejando, atendiendo otra llamada, o corriendo entre cargas.",
      subtitle:
        "Un Rate Confirmation con un error no avisa. Simplemente te cuesta dinero un mes después, cuando ya es tarde para reclamarlo.",
      list: [
        "Tarifas que no coinciden con lo pactado en el quote",
        "Detention y accessorials calculados mal (o no incluidos)",
        "Fechas de pickup / delivery cambiadas sin avisar",
        "Broker o MC number con historial que no conoces",
        "Términos de pago Net 45+ escondidos en letra pequeña",
        "Cláusulas de detention que solo activan después de 4 horas",
      ],
    },
    who: {
      tag: "Para quién es",
      title_1: "Sirve igual si estás ",
      title_2: "solo en la ruta",
      title_3: " o manejando 40 trucks.",
      cards: [
        {
          role: "Owner-Operator",
          desc: "Sube RCs desde el celular en el descanso. Recibe veredicto en 30s antes de firmar.",
          bullets: [
            "App móvil + WhatsApp",
            "Sin instalación",
            "Pago por RC procesado",
          ],
        },
        {
          role: "Dispatcher",
          desc: "Procesa 20-50 RCs por día sin abrir cada PDF. Solo revisas los amarillos y rojos.",
          bullets: [
            "Dashboard con cola",
            "Reglas por driver",
            "Integración con TMS",
          ],
        },
        {
          role: "Fleet Manager",
          desc: "Monitorea toda la flota en un panel. Ve qué brokers pagan poco y qué lanes rinden más.",
          bullets: [
            "Reportes por lane",
            "Alertas por driver",
            "API + Webhooks",
          ],
        },
      ],
    },
    solution: {
      tag: "La solución",
      title_1: "Tres cosas ",
      title_2: "simples",
      title_3: ". Pero cambian por completo lo que ganas por carga.",
      subtitle:
        "La IA nunca decide el veredicto. Solo resuelve lo ambiguo y te lo muestra. La última palabra siempre es tuya.",
      features: [
        {
          title: "Dead Head inteligente",
          desc: "Detecta millas vacías y las compara contra lo que el broker está pagando.",
          icon: "map",
          example:
            "Detecta 186 mi de dead head no pagadas en un RC de Freightop.",
        },
        {
          title: "RPM real",
          desc: "Calcula tu rate por milla real (loaded + dead head) contra tu costo por milla.",
          icon: "gauge",
          example:
            "RC de $2,850 en 1,028 millas totales = $2.77/mi (bajo tu meta de $3.00).",
        },
        {
          title: "Broker verificado",
          desc: "Cruza el MC number contra FMCSA + historial público de pagos.",
          icon: "shield",
          example:
            '"Broker con 12 complaints en SAFER en los últimos 6 meses."',
        },
      ],
    },
    how: {
      tag: "En 3 pasos",
      title_1: "Sencillo como ",
      title_2: "reenviar un WhatsApp",
      title_3: ".",
      steps: [
        {
          title: "Sube el Rate Confirmation",
          desc: "PDF, foto o screenshot. Reenvía el RC desde donde te llegue.",
          detail: "Formatos: PDF, JPG, PNG, HEIC, e incluso screenshots.",
        },
        {
          title: "La IA revisa cada campo",
          desc: "Extrae 15+ campos, los compara contra tu quote original y contra las condiciones típicas del broker.",
          detail:
            "OCR + reglas de negocio + LLM contextual. Encriptado end-to-end.",
        },
        {
          title: "Recibes el veredicto",
          desc: "Semáforo claro: verde firma tranquilo, amarillo revisa esto, rojo no firmes todavía.",
          detail:
            'Ejemplo: "🟡 Rate confirmado dice $2,850 pero tu quote fue $3,100. Diferencia: $250."',
        },
      ],
    },
    pricing: {
      tag: "Precios",
      title_1: "Simple. Sin sorpresas. ",
      title_2: "Como debe ser",
      title_3: ".",
      subtitle:
        "Estamos en Early Access. Los planes de abajo son la referencia; cerramos el precio final contigo en la demo.",
      plans: [
        {
          name: "Owner-Op",
          price: "US$29",
          period: "/mes",
          desc: "Para un solo conductor",
          bullets: [
            "Hasta 50 RCs / mes",
            "App + WhatsApp",
            "Alertas por email",
            "Soporte por chat",
          ],
          cta: "Empezar",
          highlight: false,
        },
        {
          name: "Flota",
          price: "US$99",
          period: "/mes",
          desc: "Hasta 10 conductores",
          bullets: [
            "RCs ilimitados",
            "Dashboard multiusuario",
            "Integración con TMS básica",
            "Reportes semanales",
            "Soporte prioritario",
          ],
          cta: "Empezar",
          highlight: true,
          badge: "Más popular",
        },
        {
          name: "Enterprise",
          price: "A medida",
          period: "",
          desc: "Flotas de 10+ trucks",
          bullets: [
            "Todo lo del plan Flota",
            "API + Webhooks",
            "SLA 99.9%",
            "Onboarding dedicado",
            "Contrato personalizado",
          ],
          cta: "Contactar",
          highlight: false,
        },
      ],
      free_trial: "30 días gratis · Tarjeta requerida al contratar · Cancelas cuando quieras",
    },
    faq: {
      tag: "Preguntas frecuentes",
      title: "¿Aún tienes dudas?",
      subtitle:
        "Si no está aquí, escríbenos por WhatsApp o pregúntale al copiloto.",
      items: [
        {
          q: "¿Qué documentos puedo procesar?",
          a: "Rate Confirmations es lo principal. También leemos BOLs, PODs, detention receipts y accessorial invoices. PDF, JPG, PNG, HEIC, incluso screenshots de WhatsApp.",
        },
        {
          q: "¿Se integra con mi TMS?",
          a: "Sí. Integraciones directas con McLeod, TruckMate y Ascend TMS. Para otros usamos API + Webhooks.",
        },
        {
          q: "¿Es seguro? ¿Qué pasa con mis datos?",
          a: "Todos los documentos van encriptados en tránsito (TLS 1.3) y en reposo (AES-256). No usamos tus datos para entrenar modelos externos.",
        },
        {
          q: "¿Cuánto tarda en procesar un RC?",
          a: "Promedio 30 segundos. RCs simples: 15-20s. Documentos con múltiples páginas: hasta 60s.",
        },
        {
          q: "¿Puedo cancelar cuando quiera?",
          a: "Sí, mes a mes. Sin permanencia.",
        },
        {
          q: "¿Cómo agendo una demo?",
          a: 'Click "Agendar Demo" arriba, o escríbenos por WhatsApp al +57 311 553 3824. La demo dura 20 minutos.',
        },
      ],
    },
    cta: {
      title_1: "Prueba el Verificador con ",
      title_2: "tu propio RC",
      title_3: ".",
      subtitle:
        "Escríbenos y agendamos una demo de 20 minutos. Sin compromiso.",
      primary: "Agendar Demo",
      secondary: "Chatear por WhatsApp",
    },
    footer: {
      tagline: "Tu copiloto en la carretera. Menos papeleo, más millas rodando.",
      product: "Producto",
      product_links: [
        { label: "Verificador", href: "#solution" },
        { label: "Cómo funciona", href: "#how" },
        { label: "Precios", href: "#pricing" },
      ],
      company: "Compañía",
      company_links: [
        { label: "Preguntas frecuentes", href: "#faq" },
        { label: "Contacto", href: "#contact" },
      ],
      legal: "Legal",
      legal_links: [
        { label: "Privacidad", href: "#" },
        { label: "Términos", href: "#" },
      ],
      copyright: "© 2026 Trucky. Todos los derechos reservados.",
    },
    modal: {
      title: "Agenda tu demo",
      sub: "Elige la forma que prefieras.",
      tab_form: "Formulario",
      tab_wa: "WhatsApp",
      tab_cal: "Calendario",
      field_name: "Nombre",
      field_email: "Email",
      field_phone: "Teléfono / WhatsApp",
      field_company: "Empresa (opcional)",
      field_msg: "¿Qué quieres ver en la demo?",
      submit: "Enviar solicitud",
      wa_submit: "Abrir WhatsApp",
      cal_desc: "Reserva un slot de 30 minutos en nuestro calendario.",
      close: "Cerrar",
    },
  },
  en: {
    nav: {
      product: "Product",
      how: "How it works",
      demo: "Demo",
      pricing: "Pricing",
      faq: "FAQ",
      cta: "Book a demo",
    },
    hero: {
      tag: "Document Verifier · Early Access",
      title_1: "Stop reading ",
      title_2: "Rate Confirmations",
      title_3: " line by line. ",
      title_4: "Only review what matters",
      title_5: ".",
      subtitle:
        "Upload the RC. In 30 seconds Trucky tells you if the rate adds up, if the dead head is paid, and if the broker is legit. You sign.",
      cta_primary: "Try with a sample RC",
      cta_secondary: "See how it works",
      badge: "AI reviewing live",
      microtrust_title: "In beta with real truckers",
      microtrust_sub: "Owner-ops and small fleets · US + Colombia",
      stats: [
        { num: "~30s", label: "Per RC processed" },
        { num: "15+", label: "Fields verified" },
        { num: "24/7", label: "No shifts, no breaks" },
        { num: "EN · ES", label: "Bilingual documents" },
      ],
      stats_footnote:
        "Metrics from internal early-access testing. Your results may vary based on fleet and broker.",
    },
    problem: {
      tag: "The problem",
      title_1: "You review them ",
      title_2: "by hand",
      title_3: ", often driving, on another call, or juggling loads.",
      subtitle:
        "A Rate Confirmation with an error won't warn you. It just costs you money a month later.",
      list: [
        "Rates that don't match the quote you agreed on",
        "Detention and accessorials miscalculated (or missing)",
        "Pickup / delivery dates changed without notice",
        "Broker or MC number with a history you don't know",
        "Net 45+ payment terms hidden in fine print",
        "Detention clauses that only trigger after 4 hours",
      ],
    },
    who: {
      tag: "Who it's for",
      title_1: "Works whether you drive ",
      title_2: "solo",
      title_3: " or manage 40 trucks.",
      cards: [
        {
          role: "Owner-Operator",
          desc: "Upload RCs from your phone on break. Get a verdict in 30s before signing.",
          bullets: [
            "Mobile app + WhatsApp",
            "No install",
            "Pay per RC processed",
          ],
        },
        {
          role: "Dispatcher",
          desc: "Process 20-50 RCs a day without opening every PDF. You only review the yellows and reds.",
          bullets: [
            "Queue dashboard",
            "Rules per driver",
            "TMS integration",
          ],
        },
        {
          role: "Fleet Manager",
          desc: "Monitor the whole fleet in one panel. See which brokers underpay and which lanes yield more.",
          bullets: [
            "Per-lane reports",
            "Per-driver alerts",
            "API + Webhooks",
          ],
        },
      ],
    },
    solution: {
      tag: "The solution",
      title_1: "Three ",
      title_2: "simple things",
      title_3: ". That completely change what you make per load.",
      subtitle:
        "The AI never decides the verdict. It only handles ambiguity and shows it to you.",
      features: [
        {
          title: "Smart Dead Head",
          desc: "Detects empty miles and compares them to what the broker is paying.",
          icon: "map",
          example: "Detects 186 unpaid dead head miles on a Freightop RC.",
        },
        {
          title: "Real RPM",
          desc: "Calculates your true rate per mile (loaded + dead head) against your cost per mile.",
          icon: "gauge",
          example:
            "RC $2,850 over 1,028 total miles = $2.77/mi (below your $3.00 target).",
        },
        {
          title: "Verified broker",
          desc: "Cross-checks the MC number against FMCSA + public payment history.",
          icon: "shield",
          example:
            '"Broker with 12 SAFER complaints in the last 6 months."',
        },
      ],
    },
    how: {
      tag: "In 3 steps",
      title_1: "As simple as ",
      title_2: "forwarding a WhatsApp",
      title_3: ".",
      steps: [
        {
          title: "Upload the Rate Confirmation",
          desc: "PDF, photo or screenshot. Forward the RC from any source.",
          detail: "Formats: PDF, JPG, PNG, HEIC, even blurry screenshots.",
        },
        {
          title: "The AI reviews every field",
          desc: "Extracts 15+ fields, compares them against your original quote and typical broker conditions.",
          detail: "OCR + business rules + contextual LLM. End-to-end encrypted.",
        },
        {
          title: "You get the verdict",
          desc: "Clear traffic light: green sign it, yellow check this, red hold before signing.",
          detail:
            'Example: "🟡 Confirmed rate says $2,850 but your quote was $3,100. Diff: $250."',
        },
      ],
    },
    pricing: {
      tag: "Pricing",
      title_1: "Simple. No surprises. ",
      title_2: "The way it should be",
      title_3: ".",
      subtitle:
        "We're in Early Access. Plans below are the reference; final price is set with you on the demo.",
      plans: [
        {
          name: "Owner-Op",
          price: "US$29",
          period: "/mo",
          desc: "For a single driver",
          bullets: [
            "Up to 50 RCs / month",
            "App + WhatsApp",
            "Email alerts",
            "Chat support",
          ],
          cta: "Start",
          highlight: false,
        },
        {
          name: "Fleet",
          price: "US$99",
          period: "/mo",
          desc: "Up to 10 drivers",
          bullets: [
            "Unlimited RCs",
            "Multi-user dashboard",
            "Basic TMS integration",
            "Weekly reports",
            "Priority support",
          ],
          cta: "Start",
          highlight: true,
          badge: "Most popular",
        },
        {
          name: "Enterprise",
          price: "Custom",
          period: "",
          desc: "10+ trucks fleets",
          bullets: [
            "Everything in Fleet",
            "API + Webhooks",
            "SLA 99.9%",
            "Dedicated onboarding",
            "Custom contract",
          ],
          cta: "Contact",
          highlight: false,
        },
      ],
      free_trial: "30-day free trial · Card required at checkout · Cancel anytime",
    },
    faq: {
      tag: "FAQ",
      title: "Still have questions?",
      subtitle:
        "If it's not here, message us on WhatsApp or ask the co-pilot.",
      items: [
        {
          q: "What documents can I process?",
          a: "Rate Confirmations are the main focus. We also read BOLs, PODs, detention receipts and accessorial invoices. Any format.",
        },
        {
          q: "Does it integrate with my TMS?",
          a: "Yes. Direct integrations with McLeod, TruckMate and Ascend TMS. For others we use API + Webhooks.",
        },
        {
          q: "Is it secure?",
          a: "All documents are encrypted in transit (TLS 1.3) and at rest (AES-256). We do NOT use your data to train external models.",
        },
        {
          q: "How long does it take to process an RC?",
          a: "Average 30 seconds. Simple RCs: 15-20s. Multi-page or low-quality documents: up to 60s.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes, month-to-month. No lock-in.",
        },
        {
          q: "How do I book a demo?",
          a: 'Click "Book a demo" up top, or WhatsApp us at +57 311 553 3824.',
        },
      ],
    },
    cta: {
      title_1: "Try the Verifier with ",
      title_2: "your own RC",
      title_3: ".",
      subtitle: "Reach out and we'll book a 20-minute demo. No commitment.",
      primary: "Book a demo",
      secondary: "Chat on WhatsApp",
    },
    footer: {
      tagline: "Your road co-pilot. Less paperwork, more miles rolling.",
      product: "Product",
      product_links: [
        { label: "Verifier", href: "#solution" },
        { label: "How it works", href: "#how" },
        { label: "Pricing", href: "#pricing" },
      ],
      company: "Company",
      company_links: [
        { label: "FAQ", href: "#faq" },
        { label: "Contact", href: "#contact" },
      ],
      legal: "Legal",
      legal_links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
      ],
      copyright: "© 2026 Trucky. All rights reserved.",
    },
    modal: {
      title: "Book your demo",
      sub: "Choose the way you prefer.",
      tab_form: "Form",
      tab_wa: "WhatsApp",
      tab_cal: "Calendar",
      field_name: "Name",
      field_email: "Email",
      field_phone: "Phone / WhatsApp",
      field_company: "Company (optional)",
      field_msg: "What do you want to see in the demo?",
      submit: "Send request",
      wa_submit: "Open WhatsApp",
      cal_desc: "Book a 30-minute slot on our calendar.",
      close: "Close",
    },
  },
} as const;
