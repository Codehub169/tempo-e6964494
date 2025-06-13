/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
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
        'sent-bg': '#6a5af9',
        'received-bg': '#2a2a2a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem'
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
