/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: {
          DEFAULT: '#111827',
          card: '#161F30',
          hover: '#1E293B',
          border: '#222F43',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        intent: {
          match: '#10B981',
          drift: '#F59E0B',
          conflict: '#EF4444',
        },
        paypal: {
          blue: '#0070BA',
          darkblue: '#003087',
          gold: '#FFC439',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.25)',
        alert: '0 0 30px -5px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}
