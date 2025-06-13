/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#121212',
        'surface-1': '#1e1e1e',
        'surface-2': '#2a2a2a',
        'primary': '#6a5af9',
        'primary-light': '#8b7ffc',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0a0',
        'border-color': '#3a3a3a',
        'green': '#28a745',
        'sent-bg': 'var(--primary)', // Using CSS var for consistency if needed elsewhere
        'received-bg': 'var(--surface-2)', // Using CSS var for consistency
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'], // For headings or accents
      },
      borderRadius: {
        'xl': '1rem', // default is 0.75rem, preview uses 20px, 1rem=16px
        '2xl': '1.5rem' // default is 1rem, preview uses more
      },
      boxShadow: {
        'custom': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '5px',
        'DEFAULT': '10px',
        'md': '15px',
      }
    },
  },
  plugins: [
    require('@headlessui/tailwindcss'),
  ],
}
