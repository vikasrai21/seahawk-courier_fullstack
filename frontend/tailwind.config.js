/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#1a2b5e',
          600: '#0f1c3f',
          700: '#0a1428',
          800: '#080f1e',
          900: '#050a12',
        },
      },
    },
  },
  plugins: [],
};
