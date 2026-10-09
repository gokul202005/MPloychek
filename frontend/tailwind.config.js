/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d8eeff',
          200: '#b9e2ff',
          300: '#89d1ff',
          400: '#52b7ff',
          500: '#2a98fc',
          600: '#157cf0',
          700: '#0f64dc',
          800: '#1351b2',
          900: '#15458c',
          950: '#0c2a5b',
        },
        slate: {
          850: '#172033',
          950: '#0b1120',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        amber: {
          500: '#f59e0b',
          600: '#d97706',
        },
        rose: {
          500: '#f43f5e',
          600: '#e11d48',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
