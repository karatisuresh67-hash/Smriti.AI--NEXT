import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F4F6FB',
          100: '#E6EBF7',
          200: '#CCD6F0',
          300: '#99AFDE',
          400: '#5C7EBF',
          500: '#345598',
          600: '#243F78',
          700: '#1C2E59',
          800: '#152345',
          900: '#0B132B',
          950: '#070C1E',
        },
        violet: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        accent: {
          blue: '#38BDF8',
          teal: '#14B8A6',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(11, 19, 43, 0.08)',
        'soft-lg': '0 10px 30px -3px rgba(11, 19, 43, 0.12)',
        'glow': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
      }
    },
  },
  plugins: [],
} satisfies Config;
