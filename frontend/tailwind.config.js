/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#60A5FA', // azul 400
          DEFAULT: '#2563EB', // azul principal 600
          dark: '#1D4EDB', // azul 700
        },
        surface: {
          light: '#334155', // neutro 700
          DEFAULT: '#1E293B', // neutro 800
          dark: '#0F172A', // neutro 900
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        condensed: ['Oswald', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
