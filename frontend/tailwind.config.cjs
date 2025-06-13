/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': 'var(--background, #121212)',
        'surface-1': 'var(--surface-1, #1e1e1e)',
        'surface-2': 'var(--surface-2, #2a2a2a)',
        'primary': 'var(--primary, #6a5af9)',
        'primary-light': 'var(--primary-light, #8b7ffc)',
        'text-primary': 'var(--text-primary, #ffffff)',
        'text-secondary': 'var(--text-secondary, #a0a0a0)',
        'border-color': 'var(--border-color, #3a3a3a)',
        'green': 'var(--green, #28a745)',
        'sent-bg': 'var(--sent-bg, #6a5af9)',
        'received-bg': 'var(--received-bg, #2a2a2a)',
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
        'custom': '0 8px 32px 0 var(--shadow-color, rgba(0, 0, 0, 0.2))',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '5px',
        'DEFAULT': 'var(--blur, 10px)',
        'md': '15px',
      },
      animation: {
        'typing': 'typing 1.2s infinite ease-in-out',
      },
      keyframes: {
        typing: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [
    require('@headlessui/tailwindcss'),
  ],
}
