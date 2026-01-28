/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00693E',
          light: '#008A50',
          dark: '#004D2C',
        },
        secondary: {
          DEFAULT: '#4A4A4A',
          light: '#6B6B6B',
          dark: '#2E2E2E',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          dark: '#B91C1C',
        },
      },
    },
  },
  plugins: [],
}