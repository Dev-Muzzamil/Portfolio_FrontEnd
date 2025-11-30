import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, RefreshCw, Monitor, Palette } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import StickyActionBar from './StickyActionBar'

const SettingsManagement = () => {
  const [settings, setSettings] = useState({
    site: {
      title: 'Portfolio',
      description: 'Personal Portfolio Website',
      keywords: 'portfolio, developer, software engineer',
      author: 'Your Name',
      language: 'en',
      timezone: 'UTC'
    },
    appearance: {
      theme: 'auto',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      fontFamily: 'Inter',
      fontSize: '16px'
    }
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('site')

  const tabs = [
    { id: 'site', name: 'Site Settings', icon: Monitor },
    { id: 'appearance', name: 'Appearance', icon: Palette }
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings')
      if (res.data && res.data.settings) {
        // Merge with default settings to ensure all fields exist
        setSettings(prev => ({
          ...prev,
          ...res.data.settings,
          // Ensure nested objects are merged correctly if partial data comes back
          site: { ...prev.site, ...res.data.settings.site },
          appearance: { ...prev.appearance, ...res.data.settings.appearance }
        }))
      }
    } catch (error) {
      console.error('Fetch settings error:', error)
      toast.error('Failed to load settings')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await api.post('/admin/settings', settings)
      if (res.data && res.data.settings) {
        // Update global site settings and apply title/favicon immediately
        window.__SITE_SETTINGS__ = res.data.settings
        if (res.data.settings.site?.title) document.title = res.data.settings.site.title
        if (res.data.settings.site?.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
          link.type = 'image/png'
          link.rel = 'icon'
          link.href = res.data.settings.site.faviconUrl
          document.getElementsByTagName('head')[0].appendChild(link)
        }
        try { window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: res.data.settings })) } catch (e) { /* ignore */ }
      }
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const renderSiteSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Site Title
          </label>
          <input
            type="text"
            value={settings.site.title}
            onChange={(e) => handleInputChange('site', 'title', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Author
          </label>
          <input
            type="text"
            value={settings.site.author}
            onChange={(e) => handleInputChange('site', 'author', e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo</label>
          <div className="flex items-center gap-2">
            <img src={settings.site.logoUrl || '/favicon.ico'} alt="Logo preview" className="w-28 h-28 md:w-36 md:h-36 object-contain rounded" />
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0]
                  if (!file) return
                  const form = new FormData()
                  form.append('image', file)
                  try {
                    const res = await api.post('/admin/upload/branding/image', form, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    })
                    const url = res.data && res.data.url
                    if (url) handleInputChange('site', 'logoUrl', url)
                    toast.success('Logo uploaded')
                  } catch (err) {
                    console.error('Logo upload failed', err)
                    toast.error('Logo upload failed')
                  }
                }}
                className="input-field"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Favicon / Site Icon</label>
          <div className="flex items-center gap-2">
            <img src={settings.site.faviconUrl || '/favicon.ico'} alt="Favicon preview" className="w-10 h-10 object-contain rounded" />
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0]
                  if (!file) return
                  const form = new FormData()
                  form.append('image', file)
                  try {
                    const res = await api.post('/admin/upload/branding/image', form, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    })
                    const url = res.data && res.data.url
                    if (url) handleInputChange('site', 'faviconUrl', url)
                    toast.success('Favicon uploaded')
                  } catch (err) {
                    console.error('Favicon upload failed', err)
                    toast.error('Favicon upload failed')
                  }
                }}
                className="input-field"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Site Description
        </label>
        <textarea
          value={settings.site.description}
          onChange={(e) => handleInputChange('site', 'description', e.target.value)}
          className="input-field"
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Keywords
        </label>
        <input
          type="text"
          value={settings.site.keywords}
          onChange={(e) => handleInputChange('site', 'keywords', e.target.value)}
          className="input-field"
          placeholder="portfolio, developer, software engineer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Language
          </label>
          <select
            value={settings.site.language}
            onChange={(e) => handleInputChange('site', 'language', e.target.value)}
            className="input-field"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Timezone
          </label>
          <select
            value={settings.site.timezone}
            onChange={(e) => handleInputChange('site', 'timezone', e.target.value)}
            className="input-field"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Theme
          </label>
          <select
            value={settings.appearance.theme}
            onChange={(e) => handleInputChange('appearance', 'theme', e.target.value)}
            className="input-field"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Font Family
          </label>
          <select
            value={settings.appearance.fontFamily}
            onChange={(e) => handleInputChange('appearance', 'fontFamily', e.target.value)}
            className="input-field"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Poppins">Poppins</option>
            <option value="Montserrat">Montserrat</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Primary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.appearance.primaryColor}
              onChange={(e) => handleInputChange('appearance', 'primaryColor', e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
            />
            <input
              type="text"
              value={settings.appearance.primaryColor}
              onChange={(e) => handleInputChange('appearance', 'primaryColor', e.target.value)}
              className="input-field flex-1"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Secondary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.appearance.secondaryColor}
              onChange={(e) => handleInputChange('appearance', 'secondaryColor', e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
            />
            <input
              type="text"
              value={settings.appearance.secondaryColor}
              onChange={(e) => handleInputChange('appearance', 'secondaryColor', e.target.value)}
              className="input-field flex-1"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Font Size
        </label>
        <select
          value={settings.appearance.fontSize}
          onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
          className="input-field"
        >
          <option value="14px">Small (14px)</option>
          <option value="16px">Medium (16px)</option>
          <option value="18px">Large (18px)</option>
          <option value="20px">Extra Large (20px)</option>
        </select>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'site': return renderSiteSettings()
      case 'appearance': return renderAppearanceSettings()
      default: return renderSiteSettings()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your portfolio settings and preferences</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchSettings}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${activeTab === tab.id
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
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h3>
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
      <StickyActionBar
        show={true}
        onCancel={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onSave={handleSave}
        isSaving={loading}
        saveLabel="Save Settings"
        cancelLabel="Cancel"
      />
    </div>
  )
}

export default SettingsManagement
