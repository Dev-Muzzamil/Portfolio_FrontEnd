/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Light mode
                paper: '#F2F0E9',
                ink: '#1a1a1a',
                accent: '#D4A373',
                gray: '#8E8E8E',
                glass: 'rgba(242, 240, 233, 0.8)',
                'warm-orb': '#E6C2A3',
                'cool-orb': '#C5D1D6',
                // Dark mode specific (Modern Slate/Zinc UI)
                'paper-dark': '#09090b', // Zinc 950 - Much cleaner dark background
                'ink-dark': '#fafafa',   // Zinc 50 - High contrast text
                'accent-dark': '#D4A373', // Keep the gold accent
                'gray-dark': '#a1a1aa',   // Zinc 400
                'glass-dark': 'rgba(9, 9, 11, 0.8)',
                'warm-orb-dark': '#453a2d', // Deep warm tone
                'cool-orb-dark': '#1e293b', // Slate 800
                // Surface colors (for dark mode cards/backgrounds)
                surface: {
                    DEFAULT: '#FFFFFF',
                    dark: '#18181b',    // Zinc 900
                    elevated: '#27272a', // Zinc 800
                },
            },
            fontFamily: {
                serif: ['Cormorant Garamond', 'serif'],
                sans: ['Manrope', 'Inter', 'sans-serif'],
            },
            letterSpacing: {
                tighter: '-0.04em',
                tight: '-0.02em',
                normal: '-0.01em',
                wide: '0.02em',
                widest: '0.15em',
            },
            borderRadius: {
                'arch': '12rem 12rem 2rem 2rem',
                'soft': '2.5rem',
                'pill': '9999px',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(26, 26, 26, 0.05)',
                'medium': '0 10px 40px -10px rgba(26, 26, 26, 0.1)',
                'strong': '0 25px 50px -12px rgba(26, 26, 26, 0.25)',
                'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
                'medium-dark': '0 10px 40px -10px rgba(0, 0, 0, 0.4)',
                'strong-dark': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                'glow': '0 0 20px rgba(231, 167, 101, 0.15)',
            },
            animation: {
                'reveal': 'slideUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'marquee': 'scroll 30s linear infinite',
                'fade-in': 'fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scroll: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
