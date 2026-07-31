/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }],      /* 12px (+2px) */
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],   /* 14px (+2px) */
        'sm': ['1rem', { lineHeight: '1.5rem' }],        /* 16px (+2px) */
        'base': ['1.125rem', { lineHeight: '1.75rem' }], /* 18px (+2px) */
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],    /* 20px (+2px) */
        'xl': ['1.375rem', { lineHeight: '1.75rem' }],   /* 22px (+2px) */
        '2xl': ['1.625rem', { lineHeight: '2rem' }],     /* 26px (+2px) */
        '3xl': ['2rem', { lineHeight: '2.25rem' }],      /* 32px (+2px) */
      },
      colors: {
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          900: '#78350F'
        },
        silver: {
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563'
        },
        basic: {
          500: '#A855F7',
          600: '#9333EA'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
