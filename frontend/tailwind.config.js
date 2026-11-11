/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: {
          DEFAULT: '#F1F5F9',
          card: '#FFFFFF',
          hover: '#F8FAFC',
          border: '#E2E8F0',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          400: '#3B82F6',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        intent: {
          match: '#059669',
          drift: '#D97706',
          conflict: '#DC2626',
        },
        paypal: {
          blue: '#0070BA',
          darkblue: '#003087',
          gold: '#FFC439',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
      }
    },
  },
  plugins: [],
}
