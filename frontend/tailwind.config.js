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
          light: '#F1F5F9', // slate 100
          DEFAULT: '#FFFFFF', // white
          dark: '#FFFFFF', // white
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
