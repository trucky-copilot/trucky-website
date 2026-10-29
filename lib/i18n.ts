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
      academies: "Para academias",
      pricing: "Precios",
      faq: "Preguntas",
      cta: "Agendar demo"
    },
    hero: {
      title_1: "Toma más camiones ",
      title_2: "sin trabajar más horas.",
      title_3: "",
      subtitle: "Trucky es la plataforma para dispatchers: revisa cada rate confirmation, te dice si una carga le paga a cada camión y lleva lo que genera cada empresa. En español y en inglés.",
      cta_primary: "Agendar demo de 15 min",
      cta_secondary: "Ver cómo funciona",
      microtrust: "Hecho para dispatchers que manejan de 1 a 10 camiones."
    },
    problem: {
      tag: "El problema",
      title_1: "El broker espera la firma mientras el dispatcher ",
      title_2: "revisa a mano los contratos de varias empresas.",
      title_3: "",
      list: [
        "Un rate que no coincide con lo que cotizaste.",
        "Detention y accessorials que faltan o están mal calculados.",
        "Fechas de pickup o delivery que cambiaron.",
        "Términos de pago escondidos, como Net 45 o más.",
        "No existe un registro claro de lo que genera cada camión para cada cliente."
      ],
      closing: "En nuestras entrevistas, un conductor reportó una multa de USD 2.000 por una cláusula no detectada."
    },
    who: {
      tag: "Para quién es",
      title_1: "Para el dispatcher ",
      title_2: "que maneja varias empresas.",
      title_3: "",
      cards: [
        {
          role: "Dispatcher que empieza (1 a 4 camiones)",
          desc: "Un sistema de trabajo completo desde el primer cliente, sin hojas de cálculo.",
          link: ""
        },
        {
          role: "Dispatcher con experiencia (5 a 10 camiones)",
          desc: "Más camiones por persona, sin cotizar nunca por debajo del costo de cada uno.",
          link: ""
        },
        {
          role: "Academias de dispatch",
          desc: "Tus alumnos practican con cargas y contratos reales.",
          link: "Conoce Trucky Academy"
        }
      ]
    },
    solution: {
      tag: "La solución",
      title_1: "Tres funciones que mejoran ",
      title_2: "la rentabilidad de cada carga.",
      title_3: "",
      subtitle: "La IA no toma decisiones: la decisión final es siempre del dispatcher.",
      features: [
        {
          title: "Revisa cada contrato",
          desc: "Lee la rate confirmation y te marca cobros escondidos, accessorials que faltan y fechas mal puestas antes de firmar.",
          icon: "map"
        },
        {
          title: "Precio por camión",
          desc: "Calcula el RPM real (millas cargadas más dead head) contra el costo por milla de ese camión. Ejemplo: USD 2.850 por 1.028 millas son USD 2,77 por milla, debajo de una meta de USD 3,00.",
          icon: "gauge"
        },
        {
          title: "Cada empresa en su lugar",
          desc: "Cada empresa que manejas con su propio copiloto, sus camiones, conductores y brokers, y el registro de lo que generó cada camión.",
          icon: "shield"
        }
      ]
    },
    how: {
      tag: "En 3 pasos",
      title_1: "Cómo funciona, ",
      title_2: "en tres pasos.",
      title_3: "",
      steps: [
        {
          title: "Configura cada camión una vez",
          desc: "Pon su costo por milla y tu meta."
        },
        {
          title: "Sube la rate confirmation o consulta una carga",
          desc: "PDF, foto o captura de pantalla, o con tus palabras: ‘¿me conviene esta carga?’"
        },
        {
          title: "Recibe el veredicto",
          desc: "Verde, amarillo o rojo, con los números de ese camión, antes de reservar."
        }
      ]
    },
    academies: {
      tag: "Trucky Academy",
      title: "¿Tienes una academia de dispatch?",
      text: "Enseña con Trucky en tus clases, sin costo para la academia. Tus alumnos practican con cargas y contratos reales y empiezan con 1 mes gratis.",
      cta: "Quiero Trucky para mi academia"
    },
    pricing: {
      tag: "Precios",
      title_1: "Un plan por dispatcher, ",
      title_2: "según cuántos camiones manejas.",
      title_3: "",
      subtitle: "Precio de lanzamiento.",
      plans: [
        {
          name: "Inicial",
          price: "US$29",
          period: "/mes",
          desc: "De 1 a 4 camiones",
          bullets: [
            "Copiloto de IA por cada empresa",
            "Verificador de rate confirmations",
            "Calculadora de costo por milla",
            "Registro de cargas por camión y por empresa",
            "En español y en inglés"
          ],
          cta: "Empezar",
          highlight: false,
          badge: ""
        },
        {
          name: "Crecimiento",
          price: "US$99",
          period: "/mes",
          desc: "De 5 a 10 camiones",
          bullets: [
            "Copiloto de IA por cada empresa",
            "Verificador de rate confirmations",
            "Calculadora de costo por milla",
            "Registro de cargas por camión y por empresa",
            "En español y en inglés"
          ],
          cta: "Empezar",
          highlight: true,
          badge: "Más popular"
        }
      ],
      free_trial: "1 mes gratis. Cancela cuando quieras."
    },
    faq: {
      tag: "Preguntas frecuentes",
      title: "¿Aún tienes dudas?",
      subtitle: "Si no está aquí, escríbenos por WhatsApp.",
      items: [
        {
          q: "¿Qué documentos puedo revisar?",
          a: "Rate confirmations en PDF, foto o captura de pantalla."
        },
        {
          q: "¿Sirve si estoy empezando como dispatcher?",
          a: "Sí. Trucky ofrece un sistema de trabajo completo desde el primer cliente, sin hojas de cálculo."
        },
        {
          q: "¿Se conecta con mi TMS?",
          a: "Hoy Trucky funciona por sí solo. Las integraciones las vamos sumando según lo que nos pidan los dispatchers."
        },
        {
          q: "¿Funciona en español?",
          a: "Sí. Toda la plataforma funciona en español y en inglés."
        },
        {
          q: "¿Qué pasa con mis datos?",
          a: "Tus datos son tuyos. En la demo te explicamos cómo los protegemos."
        },
        {
          q: "¿Puedo cancelar cuando quiera?",
          a: "Sí, sin contratos."
        },
        {
          q: "¿Cómo agendo una demo?",
          a: "Con el botón ‘Agendar demo’ o por WhatsApp. La demostración dura 15 minutos y se realiza con una carga real."
        }
      ]
    },
    cta: {
      title_1: "Agenda una demostración ",
      title_2: "de 15 minutos.",
      title_3: "",
      subtitle: "Te mostramos la plataforma con una carga real y resolvemos tus preguntas.",
      primary: "Agendar demo"
    },
    footer: {
      tagline: "Tu copiloto en la carretera. Menos papeleo, más millas rodando.",
      product: "Producto",
      product_links: [
        { label: "Producto", href: "#solution" },
        { label: "Cómo funciona", href: "#how" },
        { label: "Precios", href: "#pricing" },
      ],
      company: "Compañía",
      company_links: [
        { label: "Preguntas frecuentes", href: "#faq" },
        { label: "Contacto", href: `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}` },
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
      academies: "For academies",
      pricing: "Pricing",
      faq: "FAQ",
      cta: "Book a demo"
    },
    hero: {
      title_1: "Take on more trucks ",
      title_2: "without working more hours.",
      title_3: "",
      subtitle: "Trucky is the platform for truck dispatchers: it checks every rate confirmation, tells you if a load pays for each truck, and tracks what every company earns. In English and Spanish.",
      cta_primary: "Book a 15-min demo",
      cta_secondary: "See how it works",
      microtrust: "Built for dispatchers who run 1 to 10 trucks."
    },
    problem: {
      tag: "The problem",
      title_1: "The broker is waiting for a signature while the dispatcher ",
      title_2: "checks contracts for several companies by hand.",
      title_3: "",
      list: [
        "A rate that doesn’t match what you quoted.",
        "Detention and accessorials that are missing or miscalculated.",
        "Pickup or delivery dates that changed.",
        "Hidden payment terms, like Net 45 or longer.",
        "There is no clear record of what each truck earns for each client."
      ],
      closing: "In our interviews, a driver reported a $2,000 fine for a clause that went unnoticed."
    },
    who: {
      tag: "Who it’s for",
      title_1: "For dispatchers ",
      title_2: "who run several companies.",
      title_3: "",
      cards: [
        {
          role: "New dispatchers (1 to 4 trucks)",
          desc: "A complete working system from the first client, with no spreadsheets.",
          link: ""
        },
        {
          role: "Experienced dispatchers (5 to 10 trucks)",
          desc: "More trucks per person, and never a quote below what each truck costs to run.",
          link: ""
        },
        {
          role: "Dispatcher academies",
          desc: "Your students practice with real loads and contracts.",
          link: "Meet Trucky Academy"
        }
      ]
    },
    solution: {
      tag: "The solution",
      title_1: "Three features that improve ",
      title_2: "the profitability of every load.",
      title_3: "",
      subtitle: "The AI never makes the decision: the final call always belongs to the dispatcher.",
      features: [
        {
          title: "Checks every contract",
          desc: "Reads the rate confirmation and flags hidden fees, missing accessorials and wrong dates before you sign.",
          icon: "map"
        },
        {
          title: "Prices by truck",
          desc: "Calculates the real RPM (loaded miles plus dead head) against that truck’s cost per mile. Example: $2,850 over 1,028 miles is $2.77 a mile, below a $3.00 target.",
          icon: "gauge"
        },
        {
          title: "Every company in one place",
          desc: "Each company you run gets its own co-pilot, trucks, drivers and brokers, plus a record of what every truck earned.",
          icon: "shield"
        }
      ]
    },
    how: {
      tag: "In 3 steps",
      title_1: "How it works, ",
      title_2: "in three steps.",
      title_3: "",
      steps: [
        {
          title: "Set up each truck once",
          desc: "Add its cost per mile and your target."
        },
        {
          title: "Upload the rate confirmation or ask about a load",
          desc: "PDF, photo or screenshot, or in your own words: ‘Is this load worth it?’"
        },
        {
          title: "Get the verdict",
          desc: "Green, yellow or red, based on that truck’s numbers, before you book."
        }
      ]
    },
    academies: {
      tag: "Trucky Academy",
      title: "Run a dispatcher academy?",
      text: "Teach with Trucky in your classes, at no cost to your academy. Your students practice with real loads and contracts, and start with 1 month free.",
      cta: "Bring Trucky to my academy"
    },
    pricing: {
      tag: "Pricing",
      title_1: "One plan per dispatcher, ",
      title_2: "based on how many trucks you run.",
      title_3: "",
      subtitle: "Launch pricing.",
      plans: [
        {
          name: "Starter",
          price: "$29",
          period: "/ month",
          desc: "1 to 4 trucks",
          bullets: [
            "An AI co-pilot for every company",
            "Rate confirmation checker",
            "Cost-per-mile calculator",
            "Load records by truck and by company",
            "English and Spanish"
          ],
          cta: "Get started",
          highlight: false,
          badge: ""
        },
        {
          name: "Growth",
          price: "$99",
          period: "/ month",
          desc: "5 to 10 trucks",
          bullets: [
            "An AI co-pilot for every company",
            "Rate confirmation checker",
            "Cost-per-mile calculator",
            "Load records by truck and by company",
            "English and Spanish"
          ],
          cta: "Get started",
          highlight: true,
          badge: "Most popular"
        }
      ],
      free_trial: "1 month free. Cancel anytime."
    },
    faq: {
      tag: "FAQ",
      title: "Still have questions?",
      subtitle: "If it’s not here, message us on WhatsApp.",
      items: [
        {
          q: "What documents can I check?",
          a: "Rate confirmations as a PDF, photo or screenshot."
        },
        {
          q: "Does it work if I’m a new dispatcher?",
          a: "Yes. Trucky provides a complete working system from the first client, with no spreadsheets."
        },
        {
          q: "Does it connect to my TMS?",
          a: "Today Trucky works on its own. We add integrations based on what dispatchers ask for."
        },
        {
          q: "Is it available in Spanish?",
          a: "Yes. The whole platform works in English and Spanish."
        },
        {
          q: "What happens to my data?",
          a: "Your data is yours. We’ll walk you through how we protect it in the demo."
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes, no contracts."
        },
        {
          q: "How do I book a demo?",
          a: "Use the ‘Book a demo’ button or WhatsApp. The demo takes 15 minutes and uses a real load."
        }
      ]
    },
    cta: {
      title_1: "Book a ",
      title_2: "15-minute demo.",
      title_3: "",
      subtitle: "We’ll walk you through the platform with a real load and answer your questions.",
      primary: "Book a demo"
    },
    footer: {
      tagline: "Your road co-pilot. Less paperwork, more miles rolling.",
      product: "Product",
      product_links: [
        { label: "Product", href: "#solution" },
        { label: "How it works", href: "#how" },
        { label: "Pricing", href: "#pricing" },
      ],
      company: "Company",
      company_links: [
        { label: "FAQ", href: "#faq" },
        { label: "Contact", href: `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}` },
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

export function demoWhatsAppHref(lang: Lang) {
  const message = lang === "es" ? CONTACT.whatsapp_msg_es : CONTACT.whatsapp_msg_en;
  return `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
