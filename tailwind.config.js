/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Royal Citadel Theme: Deep Purple, Vibrant Gold, High-Contrast Black
        royal: {
          purple: {
            50: "#f5f3ff",
            100: "#ede9fe",
            200: "#ddd6fe",
            300: "#c4b5fd",
            400: "#a78bfa",
            500: "#8b5cf6", // Primary Accent
            600: "#7c3aed", // Hover/Deep Accent
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
            400: "#fbbf24", // Secondary Accent
            500: "#f59e0b",
            600: "#d97706",
            700: "#b45309",
            800: "#92400e",
            900: "#78350f",
            950: "#451a03",
          },
          dark: {
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
            950: "#050510", // Primary BG
          },
        },
        brand: {
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#2e1065",
          950: "#050510",
        },
        accent: {
          purple: "#7c3aed",
          gold: "#fbbf24",
          red: "#ef4444",
          green: "#10b981",
        },
        // Keep school colors for backwards compatibility
        school: {
          red: "#FF6B6B",
          blue: "#663399",
          yellow: "#D4AF37",
          green: "#95E1D3",
          purple: "#663399",
          pink: "#FF9FF3",
          orange: "#FFA502",
          sky: "#87CEEB",
        },
        gold: {
          50: "#fffef0",
          100: "#fffde1",
          200: "#fffcc2",
          300: "#fffaa3",
          400: "#fff985",
          500: "#D4AF37",
          600: "#c4992e",
          700: "#b48326",
          800: "#a46d1e",
          900: "#945716",
        },
      },
      backgroundImage: {
        "gradient-school": "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
        "gradient-school-dark":
          "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      },
      backgroundSize: {
        "size-200": "200% 200%",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI",
          "-apple-system",
          "BlinkMacSystemFont",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "pulse-bright": "pulse 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s infinite ease-in-out",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fadeInUp": "fadeInUp 0.6s ease-out",
        "fadeInDown": "fadeInDown 0.6s ease-out",
        "fadeInLeft": "fadeInLeft 0.6s ease-out",
        "fadeInRight": "fadeInRight 0.6s ease-out",
        "slideInUp": "slideInUp 0.7s ease-out",
        "scaleIn": "scaleIn 0.5s ease-out",
        "shimmer": "shimmer 2s infinite",
        "pulse-gold": "pulse-gold 2s infinite",
        "gradient": "gradient 3s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 0.8, transform: "scale(1)", boxShadow: "0 0 15px rgba(212, 175, 55, 0.2)" },
          "50%": { opacity: 1, transform: "scale(1.05)", boxShadow: "0 0 25px rgba(212, 175, 55, 0.6)" },
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: 0, transform: "translateY(-20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: 0, transform: "translateX(-20px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: 0, transform: "translateX(20px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        slideInUp: {
          "0%": { opacity: 0, transform: "translateY(40px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.7)" },
          "50%": { boxShadow: "0 0 0 10px rgba(212, 175, 55, 0)" },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-md":
          "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        "card-lg":
          "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)",
      },
    },
  },
  plugins: [],
};
