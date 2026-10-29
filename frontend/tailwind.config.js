/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff', 100: '#e0ebff', 200: '#c2d6ff', 300: '#94b8ff',
          400: '#5f90ff', 500: '#3366ff', 600: '#2347db', 700: '#1c37ad',
          800: '#1a2f8a', 900: '#1a2b6e',
        },
        accent: {
          400: '#ff9f5f', 500: '#ff8a3d', 600: '#e56f22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(20, 30, 70, 0.08)',
      },
    },
  },
  plugins: [],
};
