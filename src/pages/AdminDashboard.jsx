import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Code,
  Award,
  FileText,
  Mail,
  Settings,
  LogOut,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import SkillsManagement from '../components/SkillsManagement'
import InstitutesManagement from '../components/InstitutesManagement'
import HeroManagement from '../components/HeroManagement'
import AboutManagement from '../components/AboutManagement'
import ProjectsManagement from '../components/ProjectsManagement'
import MessagesApp from '../components/MessagesApp'
import EducationManagement from '../components/EducationManagement'
import ExperienceManagement from '../components/ExperienceManagement'
import ResumeManagement from '../components/ResumeManagement'
import SettingsManagement from '../components/SettingsManagement'
import SocialContactManagement from '../components/SocialContactManagement'
import CertificationsManagement from '../components/CertificationsManagement'
import ErrorBoundary from '../components/ErrorBoundary'

const AdminDashboard = ({ setIsAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalSkills: 0,
    totalCertifications: 0,
    unreadMessages: 0
  })
  const [data, setData] = useState({
    hero: null,
    about: null,
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    contacts: []
  })
  const [loading, setLoading] = useState(true)
  const { darkMode, toggleTheme } = useTheme()

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      return
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [heroRes, aboutRes, educationRes, projectsRes, skillsRes, contactsRes, certificationsRes] = await Promise.all([
        api.get('/hero'),
        api.get('/about'),
        api.get('/education'),
        api.get('/projects'),
        api.get('/skills'),
        api.get('/contact'),
        api.get('/certifications')
      ])

      setData({
        hero: heroRes.data.hero,
        about: aboutRes.data.about,
        education: educationRes.data.education,
        projects: projectsRes.data.projects,
        skills: skillsRes.data.skills,
        certifications: certificationsRes?.data?.certifications || [],
        contacts: contactsRes.data.contacts
      })

      // Calculate stats
      const unreadMessages = contactsRes.data.contacts.filter(contact => !contact.isRead).length
      setStats({
        totalProjects: projectsRes.data.projects.length,
        totalSkills: skillsRes.data.skills.length,
        totalCertifications: certificationsRes?.data?.certifications?.length || 0,
        unreadMessages
      })
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      if (error.response?.status === 401) {
        handleLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  if (!localStorage.getItem('token')) {
    return <Navigate to="/admin" replace />
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'hero', name: 'Hero', icon: User },
    { id: 'about', name: 'About', icon: User },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'experience', name: 'Experience', icon: GraduationCap },
    { id: 'projects', name: 'Projects', icon: Code },
    { id: 'skills', name: 'Skills', icon: Award },
    { id: 'certifications', name: 'Certifications', icon: Award },
    { id: 'institutes', name: 'Institutes', icon: GraduationCap },
    { id: 'resumes', name: 'Resumes & CVs', icon: FileText },
    { id: 'contacts', name: 'Messages', icon: Mail },
    { id: 'social-contact', name: 'Social & Contact', icon: Mail },
    { id: 'settings', name: 'Settings', icon: Settings },
  ]

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-xl dark:shadow-strong-dark hover:shadow-2xl dark:hover:shadow-2xl transition-all duration-300 hover:border-accent/30 dark:hover:border-accent-dark/30">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-1 sm:mb-2 truncate">{title}</p>
          <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink dark:text-ink-dark">{value}</p>
        </div>
        <div className={`p-2 sm:p-3 lg:p-4 rounded-full ${color} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink dark:text-ink-dark mb-1 sm:mb-2">Overview</h2>
        <p className="font-sans text-sm sm:text-base text-ink/60 dark:text-ink-dark/60">Welcome back to your portfolio control center.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Projects"
          value={stats.totalProjects}
          icon={Code}
          color="bg-blue-500"
        />
        <StatCard
          title="Skills"
          value={stats.totalSkills}
          icon={Award}
          color="bg-green-500"
        />
        <StatCard
          title="Certifications"
          value={stats.totalCertifications}
          icon={FileText}
          color="bg-purple-500"
        />
        <StatCard
          title="Unread"
          value={stats.unreadMessages}
          icon={Mail}
          color="bg-red-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl dark:shadow-strong-dark">
        <h3 className="font-serif text-xl sm:text-2xl text-ink dark:text-ink-dark mb-4 sm:mb-6">Recent Messages</h3>
        <div className="space-y-2 sm:space-y-4">
          {data.contacts.length > 0 ? (
            data.contacts.slice(0, 5).map((contact) => (
              <div key={contact._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3 sm:py-4 border-b border-ink/5 dark:border-ink-dark/5 last:border-b-0 hover:bg-white/40 dark:hover:bg-white/5 transition-colors rounded-lg px-3 sm:px-4 -mx-3 sm:-mx-4">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-base sm:text-lg text-ink dark:text-ink-dark truncate">{contact.name}</p>
                  <p className="font-sans text-xs sm:text-sm text-ink/60 dark:text-ink-dark/60 truncate">{contact.subject}</p>
                </div>
                <div className="flex items-center gap-2 sm:text-right">
                  <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </p>
                  {!contact.isRead && (
                    <span className="inline-block px-2 py-0.5 sm:py-1 bg-accent dark:bg-accent-dark text-paper dark:text-paper-dark text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-full">New</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-ink/40 dark:text-ink-dark/40 italic text-sm">No messages yet.</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard()
      case 'hero': return <HeroManagement />
      case 'about': return <AboutManagement />
      case 'education': return <EducationManagement />
      case 'experience': return <ExperienceManagement />
      case 'projects': return <ProjectsManagement />
      case 'skills': return <SkillsManagement />
      case 'certifications': return <ErrorBoundary><CertificationsManagement /></ErrorBoundary>
      case 'institutes': return <InstitutesManagement />
      case 'resumes': return <ResumeManagement />
      case 'contacts': return <MessagesApp />
      case 'settings': return <SettingsManagement />
      case 'social-contact': return <SocialContactManagement />
      default: return renderDashboard()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-paper-dark">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ink dark:border-ink-dark"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-paper-dark flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 sm:p-4 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-ink/5 dark:border-ink-dark/10 z-50 sticky top-0">
        <span className="font-serif text-lg sm:text-xl text-ink dark:text-ink-dark">Admin Panel</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-ink dark:text-ink-dark">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <motion.aside
        className={`fixed md:relative z-40 w-64 h-[calc(100%-56px)] md:h-full bg-white/50 dark:bg-surface-dark/50 backdrop-blur-md border-r border-white/40 dark:border-white/10 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } top-14 md:top-0`}
      >
        <div className="p-4 sm:p-6 lg:p-8 border-b border-ink/5 dark:border-ink-dark/10">
          <h1 className="font-serif text-xl sm:text-2xl text-ink dark:text-ink-dark">Admin Panel</h1>
          <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mt-1">Portfolio Manager</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-0.5 sm:space-y-1 custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-left rounded-lg transition-all duration-200 group ${isActive
                    ? 'bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark shadow-lg dark:shadow-medium-dark'
                    : 'text-ink/70 dark:text-ink-dark/70 hover:bg-white/60 dark:hover:bg-white/10 hover:text-ink dark:hover:text-ink-dark'
                  }`}
              >
                <Icon className={`w-4 h-4 mr-2 sm:mr-3 flex-shrink-0 ${isActive ? 'text-accent dark:text-accent-dark' : 'text-gray dark:text-gray-dark group-hover:text-accent dark:group-hover:text-accent-dark'}`} />
                <span className={`font-sans text-xs sm:text-sm font-medium truncate ${isActive ? 'tracking-wide' : ''}`}>{tab.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-2 sm:p-4 border-t border-ink/5 dark:border-ink-dark/10 space-y-1 sm:space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-left rounded-lg text-ink/70 dark:text-ink-dark/70 hover:bg-white/60 dark:hover:bg-white/10 hover:text-ink dark:hover:text-ink-dark transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 mr-2 sm:mr-3" /> : <Moon className="w-4 h-4 mr-2 sm:mr-3" />}
            <span className="font-sans text-xs sm:text-sm font-medium">Toggle Theme</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-left rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="font-sans text-xs sm:text-sm font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile overlay backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-56px)] md:h-screen p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 relative">
        {/* Background Noise */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard