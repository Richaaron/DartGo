/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Folusho Academic Theme: Sage, Coral, Cream, and Slate Coffee
        folusho: {
          sage: {
            50: "#f4f7f3",
            100: "#e9f0e7",
            200: "#d3e1cf",
            300: "#b8cdb1",
            400: "#a8c69f", // Primary
            500: "#8fb185",
            600: "#708d66",
            700: "#586f51",
            800: "#465841",
            900: "#3a4936",
          },
          coral: {
            50: "#fff5f4",
            100: "#ffebe8",
            200: "#ffd6d1",
            300: "#ffb4aa",
            400: "#ff8a7a", // Accent
            500: "#ff6350",
            600: "#f03e29",
            700: "#ca2d1a",
            800: "#a72718",
            900: "#8b2418",
          },
          cream: {
            50: "#ffffff",
            100: "#faf9f6", // BG
            200: "#f3f1eb",
            300: "#e6e2d6",
            400: "#d1c9b6",
            500: "#bdae93",
          },
          yellow: {
            50: "#fffef0",
            100: "#fffcd9",
            200: "#fff4d1", // Surface
            300: "#ffea9e",
            400: "#ffda5c",
            500: "#ffc42b",
          },
          slate: {
            50: "#f7f6f5",
            100: "#efeeeb",
            200: "#dcd9d4",
            300: "#bdb8af",
            400: "#9d968a",
            500: "#81796d",
            600: "#665f56",
            700: "#4d4740",
            800: "#36322d",
            900: "#2d2a26", // Text
            950: "#1a1816",
          }
        },
        // Nebula Premium Theme: Deep Midnight, Stellar Indigo, Aurora Teal, Cosmic Pink
        nebula: {
          indigo: {
            50: "#eef2ff",
            100: "#e0e7ff",
            200: "#c7d2fe",
            300: "#a5b4fc",
            400: "#818cf8",
            500: "#6366f1", // Primary Accent
            600: "#4f46e5",
            700: "#4338ca",
            800: "#3730a3",
            900: "#312e81",
            950: "#1e1b4b",
          },
          teal: {
            50: "#f0fdfa",
            100: "#ccfbf1",
            200: "#99f6e4",
            300: "#5eead4",
            400: "#2dd4bf",
            500: "#14b8a6", // Secondary Accent
            600: "#0d9488",
            700: "#0f766e",
            800: "#115e59",
            900: "#134e4a",
            950: "#042f2e",
          },
          pink: {
            50: "#fdf2f8",
            100: "#fce7f3",
            200: "#fbcfe8",
            300: "#f9a8d4",
            400: "#f472b6",
            500: "#ec4899",
            600: "#db2777", // High Contrast Accent
            700: "#be185d",
            800: "#9d174d",
            900: "#831843",
            950: "#500724",
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
            950: "#020617", // Primary BG
          },
        },
        brand: {
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#020617",
        },
        // Legacy Royal Theme compatibility
        royal: {
          purple: {
            50: "#f5f3ff",
            100: "#ede9fe",
            200: "#ddd6fe",
            300: "#c4b5fd",
            400: "#a78bfa",
            500: "#8b5cf6",
            600: "#7c3aed",
            700: "#6d28d9",
            800: "#5b21b6",
            900: "#4c1d95",
            950: "#2e1065",
          },
          gold: {
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
            950: "#451a03",
          },
          black: {
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
        }
      },
      backgroundImage: {
        "mesh-nebula": "radial-gradient(at 0% 0%, hsla(263,88%,20%,0.15) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(263,88%,20%,0.1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(263,88%,20%,0.15) 0, transparent 50%)",
        "gradient-nebula": "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
      },
      keyframes: {
        "nebula-float": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-20px) scale(1.05)" },
        },
        "nebula-pulse": {
          "0%, 100%": { opacity: 0.5, filter: "blur(40px)" },
          "50%": { opacity: 0.8, filter: "blur(60px)" },
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundSize: {
        "size-200": "200% 200%",
      },
      animation: {
        "nebula-float": "nebula-float 6s ease-in-out infinite",
        "nebula-pulse": "nebula-pulse 4s ease-in-out infinite",
        "fadeInUp": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer": "shimmer 2.5s infinite linear",
        "gradient": "gradient 15s ease infinite",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "3rem",
        "6xl": "4rem",
      },
      boxShadow: {
        nebula: "0 0 50px -12px rgba(99, 102, 241, 0.25)",
        "nebula-lg": "0 0 80px -15px rgba(99, 102, 241, 0.4)",
        folusho: "0 20px 40px -15px rgba(45, 42, 38, 0.05)",
        "folusho-lg": "0 30px 60px -20px rgba(45, 42, 38, 0.1)",
      },
    },
  },
  plugins: [],
};
