import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [activeSection, setActiveSection] = useState('home')
    const [isVisible, setIsVisible] = useState(true)
    const lastScrollY = useRef(0)
    const { darkMode, toggleTheme } = useTheme()
    const [siteSettings, setSiteSettings] = useState(window.__SITE_SETTINGS__ || {})

    const navLinks = [
        { name: 'Home', href: '#home' },
        { name: 'About', href: '#about' },
        { name: 'Experience', href: '#experience-education' },
        { name: 'Projects', href: '#projects' },
        { name: 'Skills', href: '#skills' },
        { name: 'Certifications', href: '#certifications' },
        { name: 'Contact', href: '#contact' },
    ]

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Show/Hide logic based on scroll direction and threshold
            if (currentScrollY > 120) {
                if (currentScrollY > lastScrollY.current) {
                    setIsVisible(false) // Scrolling down
                } else {
                    setIsVisible(true) // Scrolling up
                }
            } else {
                setIsVisible(true) // At top
            }
            lastScrollY.current = currentScrollY

            // Detect active section
            const sections = navLinks.map(link => link.href.substring(1))
            const currentSection = sections.find(section => {
                const element = document.getElementById(section)
                if (element) {
                    const rect = element.getBoundingClientRect()
                    return rect.top <= 100 && rect.bottom >= 100
                }
                return false
            })

            if (currentSection) {
                setActiveSection(currentSection)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const onUpdate = (e) => setSiteSettings(window.__SITE_SETTINGS__ || e?.detail || {})
        window.addEventListener('site-settings-updated', onUpdate)
        return () => window.removeEventListener('site-settings-updated', onUpdate)
    }, [])

    const scrollToSection = (href) => {
        const element = document.querySelector(href)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
        setIsOpen(false)
    }

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{
                    y: isVisible ? 0 : -100,
                    opacity: isVisible ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                     className={
                     `fixed z-40 left-1/2 transform -translate-x-1/2
                         top-4 sm:top-6 md:top-8
                         w-fit max-w-[95vw] sm:max-w-[90vw] px-3 sm:px-4 md:px-6 py-2 sm:py-3
                         bg-paper/95 dark:bg-paper-dark/95 sm:bg-paper/80 sm:dark:bg-paper-dark/90 backdrop-blur-md
                         border border-ink/20 dark:border-white/10 sm:border-ink/10 sm:dark:border-white/10
                         rounded-full shadow-lg dark:shadow-strong-dark
                         focus:outline-none focus:ring-2 focus:ring-accent/20
                         flex items-center justify-between gap-3 sm:gap-4 md:gap-8`
                     }
            >
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
                    {siteSettings?.site?.logoUrl ? (
                        <img
                            src={siteSettings.site.logoUrl}
                            alt={siteSettings.site.title || 'Logo'}
                            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-500 dark:invert"
                        />
                    ) : (
                        <span className="font-serif font-bold text-base sm:text-lg text-ink dark:text-ink-dark tracking-tight">
                            {siteSettings?.site?.title || 'SMA'}
                        </span>
                    )}
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
                    {navLinks.map((link) => {
                        const isActive = activeSection === link.href.substring(1)
                        return (
                            <button
                                key={link.name}
                                onClick={() => scrollToSection(link.href)}
                                className={`px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isActive
                                    ? 'text-accent dark:text-accent-dark bg-ink/5 dark:bg-white/10'
                                    : 'text-gray dark:text-gray-dark hover:text-ink dark:hover:text-ink-dark hover:bg-ink/5 dark:hover:bg-white/10'
                                    }`}
                            >
                                {link.name}
                            </button>
                        )
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                    <button
                        onClick={toggleTheme}
                        className="text-gray dark:text-gray-dark hover:text-accent dark:hover:text-accent-dark transition-colors p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/20"
                        aria-label="Toggle theme"
                    >
                        {darkMode ? <Sun size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />}
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-ink dark:text-ink-dark p-2 rounded-md hover:bg-ink/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={18} className="sm:w-5 sm:h-5" /> : <Menu size={18} className="sm:w-5 sm:h-5" />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Navigation Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed inset-0 bg-paper/95 dark:bg-paper-dark/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center md:hidden"
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 text-ink dark:text-ink-dark p-2"
                        >
                            <X size={28} className="sm:w-8 sm:h-8" />
                        </button>

                        <div className="flex flex-col space-y-5 sm:space-y-6 md:space-y-8 text-center">
                            {navLinks.map((link, index) => (
                                <motion.button
                                    key={link.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => scrollToSection(link.href)}
                                    className="font-serif text-2xl sm:text-3xl md:text-4xl text-ink dark:text-ink-dark hover:text-accent dark:hover:text-accent-dark transition-colors"
                                >
                                    {link.name}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Navbar