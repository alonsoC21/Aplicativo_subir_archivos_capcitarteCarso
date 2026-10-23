import type { Config } from "tailwindcss";

// Paleta extraída de capacitatecarso.com (teal corporativo, fondo gris-azulado, header oscuro).
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        carso: {
          // Teal principal (header superior, acentos, botones).
          teal: "#00A6B4",
          tealDark: "#008A96",
          tealLight: "#4FC3CE",
          // Header de navegación oscuro.
          dark: "#1C1C1C",
          darkSoft: "#2A2A2A",
          // Fondo general gris-azulado muy claro.
          bg: "#EAF0F1",
          bgSoft: "#F4F8F9",
          // Texto.
          text: "#2B3A3F",
          textSoft: "#5A6B70",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "Arial", "sans-serif"],
      },
      borderRadius: {
        carso: "0.5rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
