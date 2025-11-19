/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Swap primary to GitHub-tones so existing `primary-*` usage follows GitHub theme
        primary: {
          50: '#f6f8fa',
          100: '#eaeef2',
          200: '#d6dee4',
          300: '#bfcdd6',
          400: '#9fb0bf',
          500: '#768b95',
          600: '#57636b',
          700: '#343a3e',
          800: '#2b3135',
          900: '#24292e',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        // Make Inter Tight the default body font via font-sans
        sans: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        // Alternative modern sans you can opt into for body text
        sansAlt: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        // Primary display for headings
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        // Alternative displays for headings
        display2: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        display3: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display4: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}