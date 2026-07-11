import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "rank-1-row",
    "rank-2-row",
    "rank-3-row",
  ],
  theme: {
    extend: {
      colors: {
        // Warm amber brand (kept as primary so existing primary-* classes cascade)
        primary: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Espresso secondary for warm community contrast
        accent: {
          50: "#faf6f3",
          100: "#f0e6dc",
          200: "#e0cbb8",
          300: "#c9a88a",
          400: "#a67c52",
          500: "#8b5e3c",
          600: "#6f4a2f",
          700: "#5a3c28",
          800: "#3f2a1c",
          900: "#2a1c13",
        },
        surface: {
          DEFAULT: "#f6f3ee",
          muted: "#efeae3",
          raised: "#fffcf8",
          ink: "#1c1917",
        },
        success: "#059669",
        warning: "#d97706",
        error: "#dc2626",
        gold: "#eab308",
        silver: "#a8a29e",
        bronze: "#c2410c",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 16px -4px rgba(28, 25, 23, 0.08), 0 8px 24px -8px rgba(28, 25, 23, 0.06)",
        glow: "0 0 24px rgba(217, 119, 6, 0.22)",
        lift: "0 12px 40px -16px rgba(28, 25, 23, 0.18)",
      },
      ringOffsetWidth: {
        DEFAULT: "2px",
      },
      fontSize: {
        display: [
          "clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem)",
          { lineHeight: "1.1", fontWeight: "650", letterSpacing: "-0.02em" },
        ],
        h1: [
          "clamp(1.875rem, 1.5rem + 1.6vw, 2.75rem)",
          { lineHeight: "1.15", fontWeight: "650", letterSpacing: "-0.02em" },
        ],
        h2: [
          "clamp(1.5rem, 1.3rem + 0.9vw, 2.125rem)",
          { lineHeight: "1.25", fontWeight: "600", letterSpacing: "-0.015em" },
        ],
        h3: [
          "clamp(1.25rem, 1.15rem + 0.45vw, 1.5rem)",
          { lineHeight: "1.35", fontWeight: "600" },
        ],
        h4: ["1.125rem", { lineHeight: "1.45", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.65" }],
        body: ["1.0625rem", { lineHeight: "1.65" }],
        "body-sm": ["0.9375rem", { lineHeight: "1.55" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
      },
      backgroundImage: {
        "warm-glow":
          "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(251, 191, 36, 0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 10%, rgba(139, 94, 60, 0.1), transparent 50%)",
        "hero-warm":
          "radial-gradient(ellipse 90% 70% at 15% 20%, rgba(245, 158, 11, 0.22), transparent 50%), radial-gradient(ellipse 60% 50% at 85% 0%, rgba(255, 255, 255, 0.06), transparent 45%)",
      },
      animation: {
        "fade-in": "fadeIn 0.45s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(14px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
