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
                // Dark mode
                'paper-dark': '#1C1917',
                'ink-dark': '#F5F5F4',
                'accent-dark': '#E7A765',
                'gray-dark': '#A1A1A1',
                'glass-dark': 'rgba(28, 25, 23, 0.9)',
                'warm-orb-dark': '#3D3530',
                'cool-orb-dark': '#2A2825',
                // Surfaces for dark mode
                'surface-dark': '#252220',
                'surface-dark-elevated': '#2D2926',
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
