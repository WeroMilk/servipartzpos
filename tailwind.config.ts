import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        accent: {
          red: "#dc2626",
          "red-light": "#ef4444",
          "red-dark": "#b91c1c",
        },
        apple: {
          bg: "#fafafa",
          surface: "#ffffff",
          surface2: "#f8fafc",
          text: "#1e293b",
          text2: "#64748b",
          accent: "#2563eb",
          accent2: "#1d4ed8",
          border: "#e2e8f0",
          success: "#22c55e",
          warning: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
