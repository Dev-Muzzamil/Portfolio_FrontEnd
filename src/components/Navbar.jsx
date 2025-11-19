import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)
  const { darkMode, toggleTheme } = useTheme()
  const [siteSettings, setSiteSettings] = useState(window.__SITE_SETTINGS__ || {})

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Certifications', href: '#certifications' },
    { name: 'Contact', href: '#contact' },
  ]

  // Handle scroll effects and active section detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 50)

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
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const onUpdate = (e) => setSiteSettings(window.__SITE_SETTINGS__ || e?.detail || {})
    window.addEventListener('site-settings-updated', onUpdate)
    return () => window.removeEventListener('site-settings-updated', onUpdate)
  }, [])

  // Smooth scroll to section
  const scrollToSection = (href) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsOpen(false)
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50'
        : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700'
    }`}>
      <div className="container-max">
        <div className="flex justify-between items-center h-12 sm:h-14 md:h-16 lg:h-20 tv:h-24">
          {/* Logo with animation */}
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            {siteSettings?.site?.logoUrl ? (
              <img src={siteSettings.site.logoUrl} alt={siteSettings.site.title || 'Logo'} className="w-12 h-12 md:w-16 md:h-16 object-contain mr-3" />
            ) : (
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl tv:text-5xl font-bold text-primary-600 dark:text-primary-400 transition-all duration-300 hover:scale-105 hover:text-primary-500 dark:hover:text-primary-300 relative group">
                Portfolio
              </span>
            )}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 dark:bg-primary-400 group-hover:w-full transition-all duration-300"></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.substring(1)
              return (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 group ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {link.name}
                  {/* Active indicator */}
                  <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary-500 dark:bg-primary-400 transition-all duration-300 ${
                    isActive ? 'w-3/4' : 'group-hover:w-1/2'
                  }`}></span>
                  {/* Hover glow effect */}
                  <span className="absolute inset-0 rounded-lg bg-primary-500/10 dark:bg-primary-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
              )
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle with enhanced animation */}
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 group overflow-hidden"
              aria-label="Toggle theme"
            >
              {/* Ripple effect background */}
              <span className="absolute inset-0 bg-primary-500/20 dark:bg-primary-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </div>
            </button>

            {/* Admin/Auth button with enhanced styling */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="relative btn-secondary text-sm overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10">Logout</span>
                <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>
            ) : (
              <Link
                to="/admin"
                className="relative btn-primary text-sm overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10">Admin</span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            )}

            {/* Mobile menu button with animation */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden relative p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 group overflow-hidden"
              aria-label="Toggle menu"
            >
              {/* Ripple effect */}
              <span className="absolute inset-0 bg-primary-500/20 dark:bg-primary-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <div className="relative z-10 transition-all duration-300 group-hover:rotate-90">
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation with slide animation */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link, index) => {
                const isActive = activeSection === link.href.substring(1)
                return (
                  <button
                    key={link.name}
                    onClick={() => scrollToSection(link.href)}
                    className={`text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:translate-x-2 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    style={{
                      animationDelay: isOpen ? `${index * 100}ms` : '0ms',
                      animation: isOpen ? 'slideInLeft 0.3s ease-out forwards' : 'none'
                    }}
                  >
                    {link.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar