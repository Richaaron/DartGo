/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
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
          950: "#0a1128",
        },
        accent: {
          gold: "#f59e0b",
          red: "#ef4444",
          green: "#10b981",
        },
        // Keep school colors for backwards compatibility
        school: {
          red: "#FF6B6B",
          blue: "#4ECDC4",
          yellow: "#FFE66D",
          green: "#95E1D3",
          purple: "#C7A2FF",
          pink: "#FF9FF3",
          orange: "#FFA502",
          sky: "#87CEEB",
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
        },
      },
      backgroundImage: {
        "gradient-school": "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
        "gradient-school-dark":
          "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s infinite ease-in-out",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
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
          "0%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-15px) rotate(2deg)" },
          "100%": { transform: "translateY(0px) rotate(0deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 0.8, transform: "scale(1)", boxShadow: "0 0 15px rgba(245, 158, 11, 0.2)" },
          "50%": { opacity: 1, transform: "scale(1.05)", boxShadow: "0 0 25px rgba(245, 158, 11, 0.6)" },
        },
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
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
