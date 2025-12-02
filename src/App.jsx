import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'
import { ThemeProvider } from './context/ThemeContext'
import SEO from './components/SEO'
import CursorSystem from './components/CursorSystem'
import HeroOrbs from './components/HeroOrbs'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <ThemeProvider>
      <SEO />
      <div className="min-h-screen bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark relative transition-colors duration-300">
        <CursorSystem />
        <HeroOrbs />
        {!isAdminRoute && (
          <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        )}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/admin"
              element={
                isAuthenticated ? (
                  <AdminDashboard setIsAuthenticated={setIsAuthenticated} />
                ) : (
                  <AdminLogin setIsAuthenticated={setIsAuthenticated} />
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isAdminRoute && <Footer />}
      </div>
    </ThemeProvider>
  )
}

export default App