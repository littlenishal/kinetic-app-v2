/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Google colors from design spec
          'primary': '#4285F4',  // Google Blue
          'secondary': '#34A853', // Google Green
          'accent-yellow': '#FBBC05', // Google Yellow
          'accent-red': '#EA4335',  // Google Red
          // Neutral palette for UI elements
          'neutral-50': '#F9FAFB',
          'neutral-100': '#F3F4F6',
          'neutral-200': '#E5E7EB',
          'neutral-300': '#D1D5DB',
          'neutral-400': '#9CA3AF',
          'neutral-500': '#6B7280',
          'neutral-600': '#4B5563',
          'neutral-700': '#374151',
          'neutral-800': '#1F2937',
          'neutral-900': '#111827',
        },
        fontFamily: {
          'inter': ['Inter', 'sans-serif'],
        },
        fontSize: {
          'xs': '12px',
          'sm': '14px',
          'base': '16px',
          'lg': '18px',
          'xl': '20px',
          '2xl': '24px',
        },
        spacing: {
          '0.5': '0.125rem',
          '1': '0.25rem',
          '1.5': '0.375rem',
          '2': '0.5rem',
          '2.5': '0.625rem',
          '3': '0.75rem',
          '4': '1rem',
          '5': '1.25rem',
          '6': '1.5rem',
          '8': '2rem',
          '10': '2.5rem',
          '12': '3rem',
          '16': '4rem',
          '20': '5rem',
          '24': '6rem',
          '32': '8rem',
          '40': '10rem',
          '48': '12rem',
          '64': '16rem',
        },
        borderRadius: {
          'sm': '0.125rem',
          'DEFAULT': '0.25rem',
          'md': '0.375rem',
          'lg': '0.5rem',
          'xl': '1rem',
          'full': '9999px',
        },
        boxShadow: {
          'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    plugins: [],
  }