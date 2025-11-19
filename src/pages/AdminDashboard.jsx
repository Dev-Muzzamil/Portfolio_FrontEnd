import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { Moon, Sun } from 'lucide-react'
import SkillsManagement from '../components/SkillsManagement'
import InstitutesManagement from '../components/InstitutesManagement'
import HeroManagement from '../components/HeroManagement'
import AboutManagement from '../components/AboutManagement'
import ProjectsManagement from '../components/ProjectsManagement'
import ContactsManagement from '../components/ContactsManagement'
import EducationManagement from '../components/EducationManagement'
import ExperienceManagement from '../components/ExperienceManagement'
import ResumeManagement from '../components/ResumeManagement'
import SettingsManagement from '../components/SettingsManagement'
import SocialContactManagement from '../components/SocialContactManagement'
import CertificationsManagement from '../components/CertificationsManagement'
import ErrorBoundary from '../components/ErrorBoundary'

const AdminDashboard = ({ setIsAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('dashboard')
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
        api.get('/contact')
        , api.get('/certifications')
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
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'social-contact', name: 'Social & Contact', icon: Mail }
  ]

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Welcome to your portfolio admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
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
          title="Unread Messages"
          value={stats.unreadMessages}
          icon={Mail}
          color="bg-red-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Messages</h3>
        <div className="space-y-4">
          {data.contacts.slice(0, 5).map((contact) => (
            <div key={contact._id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{contact.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </p>
                {!contact.isRead && (
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderHero = () => <HeroManagement />

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard()
      case 'hero':
        return renderHero()
      case 'about':
        return <AboutManagement />
      case 'education':
        return <EducationManagement />
      case 'experience':
        return <ExperienceManagement />
      case 'projects':
        return <ProjectsManagement />
      case 'skills':
        return <SkillsManagement />
      case 'certifications':
        return (
          <ErrorBoundary>
            <CertificationsManagement />
          </ErrorBoundary>
        )
      case 'institutes':
        return <InstitutesManagement />
      case 'resumes':
        return <ResumeManagement />
      case 'contacts':
        return <ContactsManagement />
      case 'settings':
        return <SettingsManagement />
      case 'social-contact':
        return <SocialContactManagement />
      default:
        return renderDashboard()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Minimal top-right controls: Theme toggle + Logout */}
      <div className="container-max">
        <div className="flex justify-end items-center h-14">
          <button
            onClick={toggleTheme}
            className="mr-2 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      <div className="container-max py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard