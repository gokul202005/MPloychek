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
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a4bcfd',
          400: '#7c9afb',
          500: '#5372f6',
          600: '#3b54ec',
          700: '#2d3fd6',
          800: '#2835ad',
          900: '#253088',
          950: '#171c54',
        },
        slate: {
          850: '#131b2e',
          900: '#0c1322',
          950: '#070b14',
        },
        cyber: {
          cyan: '#06b6d4',
          teal: '#0d9488',
          emerald: '#10b981',
          indigo: '#6366f1',
          violet: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
