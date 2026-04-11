/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#f59e0b",
        background: "#0f172a",
        surface: "rgba(30, 41, 59, 0.7)",
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
