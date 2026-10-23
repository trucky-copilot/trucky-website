import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        purple: {
          50: "#f5f2ff",
          100: "#ebe6ff",
          200: "#d6cdff",
          300: "#b09fff",
          400: "#8968ff",
          500: "#6234ff",
          600: "#4b1fd6",
          700: "#3a1cd4",
          800: "#2a12a6",
          900: "#1a0a5c",
        },
        brand: {
          DEFAULT: "#4b1fd6",
          hover: "#3a1cd4",
          soft: "#ebe6ff",
        },
        semaphore: {
          green: "#22c55e",
          yellow: "#fbbf24",
          red: "#e63b3b",
        },
        whatsapp: "#25D366",
      },
      fontFamily: {
        display: ["'Inter Tight'", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        serif: ["'Instrument Serif'", "'Times New Roman'", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      letterSpacing: {
        tight: "-0.028em",
        tighter: "-0.04em",
        eyebrow: "0.06em",
      },
      borderRadius: {
        sm: "10px",
        md: "18px",
        lg: "28px",
        pill: "999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15,15,24,0.06)",
        md: "0 8px 24px rgba(74,31,214,0.10)",
        lg: "0 24px 60px rgba(74,31,214,0.18)",
      },
      transitionTimingFunction: {
        signature: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "hero-zoom": "heroZoom 30s ease-in-out infinite alternate",
      },
      keyframes: {
        heroZoom: {
          "0%": { transform: "translate(-50%, -50%) scale(1.05)" },
          "100%": { transform: "translate(-50%, -50%) scale(1.18)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
