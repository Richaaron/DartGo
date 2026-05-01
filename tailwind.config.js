/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Royal theme: Gold, Purple, Black
        royal: {
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
          purple: {
            50: "#f7f4ff",
            100: "#eee9ff",
            200: "#ddd2ff",
            300: "#cccbff",
            400: "#9d7dd0",
            500: "#663399",
            600: "#5a2d8a",
            700: "#4d267b",
            800: "#40206c",
            900: "#33195d",
          },
          black: {
            50: "#f7f7f7",
            100: "#efefef",
            200: "#dfdfdf",
            300: "#cfcfcf",
            400: "#bfbfbf",
            500: "#1a1a1a",
            600: "#161616",
            700: "#121212",
            800: "#0e0e0e",
            900: "#0a0a0a",
          },
        },
        brand: {
          50: "#f7f4ff",
          100: "#eee9ff",
          200: "#ddd2ff",
          300: "#663399",
          400: "#5a2d8a",
          500: "#663399",
          600: "#5a2d8a",
          700: "#4d267b",
          800: "#40206c",
          900: "#1a1a1a",
          950: "#0a0a0a",
        },
        accent: {
          gold: "#D4AF37",
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
