import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Helper to convert hex to rgb space separated
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0' // Monochrome Black
}

// Helper to generate shades (simplified)
// In a real app, use a library like 'chroma-js' or 'tinycolor2'
const generatePalette = (hex) => {
  // This is a placeholder. For true dynamic palette generation without a library, 
  // we would need complex HSL conversion. 
  // For now, we will just set the main color to 500 and 600, and use opacity or fallbacks for others 
  // if we want to be simple. 
  // OR, we can try a very basic lightening/darkening if we convert to HSL.

  // Let's just use the provided hex for the main brand colors (500/600)
  // and rely on the fact that Tailwind uses opacity for some things.
  // But for a full palette, we really need a generator.
  // Given the constraints, I'll just set the main brand color variables.
  // Ideally, we should fetch the palette from the backend or use a library.

  const rgb = hexToRgb(hex)
  return {
    '--primary-50': rgb,
    '--primary-100': rgb,
    '--primary-200': rgb,
    '--primary-300': rgb,
    '--primary-400': rgb,
    '--primary-500': rgb,
    '--primary-600': rgb,
    '--primary-700': rgb,
    '--primary-800': rgb,
    '--primary-900': rgb,
    '--primary-950': rgb,
  }
}

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false)

  const applyThemeColors = (settings) => {
    if (settings?.appearance?.primaryColor) {
      const rgb = hexToRgb(settings.appearance.primaryColor)
      // Set all shades to the same base color for now, relying on opacity in UI
      // or we could implement a proper generator. 
      // For a "minimal" look, a single accent color is often enough.
      const root = document.documentElement
      root.style.setProperty('--primary-50', rgb)
      root.style.setProperty('--primary-100', rgb)
      root.style.setProperty('--primary-200', rgb)
      root.style.setProperty('--primary-300', rgb)
      root.style.setProperty('--primary-400', rgb)
      root.style.setProperty('--primary-500', rgb)
      root.style.setProperty('--primary-600', rgb)
      root.style.setProperty('--primary-700', rgb)
      root.style.setProperty('--primary-800', rgb)
      root.style.setProperty('--primary-900', rgb)
      root.style.setProperty('--primary-950', rgb)

      if (settings.appearance.fontFamily) {
        root.style.setProperty('--font-sans', settings.appearance.fontFamily)
      }
    }
  }

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setDarkMode(false)
      document.documentElement.classList.remove('dark')
    }

    // Apply initial settings if available
    if (window.__SITE_SETTINGS__) {
      applyThemeColors(window.__SITE_SETTINGS__)
    }

    // Listen for settings updates
    const handleSettingsUpdate = (e) => {
      if (e.detail) {
        applyThemeColors(e.detail)
      }
    }
    window.addEventListener('site-settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('site-settings-updated', handleSettingsUpdate)
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}