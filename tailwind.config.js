/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: '#3b82f6',
        'primary-dark': '#1e40af',
        
        // Essential secondary colors
        success: '#16a34a',
        danger: '#dc2626',
        
        // Core neutral colors
        'gray-700': '#4b5563',
        'gray-300': '#9ca3af',
      },
      fontFamily: {
        // Inter font family configured as primary font
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      fontSize: {
        // Essential sizes: 14px (base), 16px (lg), 18px (xl), 24px (2xl)
        'base': '14px',
        'lg': '16px', 
        'xl': '18px',
        '2xl': '24px',
      },
      fontWeight: {
        // Core weights: regular(400), semibold(600)
        'regular': '400',
        'semibold': '600',
      },
      spacing: {
        // Core spacing tokens: 4px, 8px, 16px, 24px, 32px
        '1': '4px',
        '2': '8px',  
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
    },
  },
  plugins: [],
}