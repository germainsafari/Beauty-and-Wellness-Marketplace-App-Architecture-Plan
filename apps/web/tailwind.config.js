/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hafi: {
          purple: "#6C3FC5",
          dark: "#1A0533",
          mid: "#2D0A5C",
          light: "#9B6FE8",
          bg: "#F8F5FF",
          gold: "#F5A623",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
