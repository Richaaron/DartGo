/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Simplified Accessible Theme
        folusho: {
          sage: {
            50: "#f8fafc",
            100: "#f1f5f9",
            200: "#e2e8f0",
            300: "#cbd5e1",
            400: "#6366f1", // Primary (Indigo)
            500: "#4f46e5",
            600: "#4338ca",
            700: "#3730a3",
            800: "#312e81",
            900: "#1e1b4b",
          },
          coral: {
            50: "#fff1f2",
            100: "#ffe4e6",
            200: "#fecdd3",
            300: "#fda4af",
            400: "#f43f5e", // Accent (Rose)
            500: "#e11d48",
            600: "#be123c",
            700: "#9f1239",
            800: "#881337",
            900: "#4c0519",
          },
          cream: {
            50: "#ffffff",
            100: "#f8fafc", // BG
            200: "#f1f5f9",
            300: "#e2e8f0",
            400: "#cbd5e1",
            500: "#94a3b8",
          },
          slate: {
            50: "#f8fafc",
            100: "#f1f5f9",
            200: "#e2e8f0",
            300: "#cbd5e1",
            400: "#94a3b8",
            500: "#64748b",
            600: "#475569",
            700: "#334155",
            800: "#1e293b",
            900: "#0f172a",
            950: "#020617",
          }
        },
        // Legacy aliases for compatibility
        nebula: {
          indigo: { 400: "#6366f1", 500: "#4f46e5", 950: "#020617" },
          slate: { 900: "#0f172a", 950: "#020617" },
        }
      },
      borderRadius: {
        "4xl": "1rem",
        "5xl": "1.25rem",
        "6xl": "1.5rem",
      },
      boxShadow: {
        folusho: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "folusho-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

