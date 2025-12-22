/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cf-red': '#D21034',
        'cf-red-hover': '#B00E2A',
        'cf-dark': '#1A1A1A',
        'cf-gray': '#666666',
        'cf-light-gray': '#F5F5F5',
      },
      fontFamily: {
        'heading': ['Oswald', 'Arial Black', 'Arial', 'sans-serif'],
        'body': ['Open Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      spacing: {
        'xs': '0.5rem',
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        '2xl': '4rem',
        '3xl': '6rem',
      },
    },
  },
  plugins: [],
}

