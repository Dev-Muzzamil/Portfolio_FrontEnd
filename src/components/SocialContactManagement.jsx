import { useState, useEffect } from 'react'
import { Save, RefreshCw, Mail, Phone, MapPin, Linkedin, Github, Instagram, Youtube, Facebook, Globe, MessageCircle, Camera, Send, MessageSquare, Twitch, Hash, Code2, Palette, Figma, Plus, X, Link as LinkIcon, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, authApi } from '../services/api'

// Custom X (formerly Twitter) icon component
const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'github', label: 'GitHub', icon: Github },
  { key: 'x', label: 'X (Twitter)', icon: XIcon },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'tiktok', label: 'TikTok', icon: Camera },
  { key: 'snapchat', label: 'Snapchat', icon: Camera },
  { key: 'pinterest', label: 'Pinterest', icon: Palette },
  { key: 'reddit', label: 'Reddit', icon: MessageSquare },
  { key: 'discord', label: 'Discord', icon: MessageCircle },
  { key: 'twitch', label: 'Twitch', icon: Twitch },
  { key: 'medium', label: 'Medium', icon: Hash },
  { key: 'stackoverflow', label: 'Stack Overflow', icon: Code2 },
  { key: 'dribbble', label: 'Dribbble', icon: Palette },
  { key: 'behance', label: 'Behance', icon: Figma },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'telegram', label: 'Telegram', icon: Send },
  { key: 'website', label: 'Website', icon: Globe }
]

const SocialContactManagement = () => {
  const [loading, setLoading] = useState(false)
  const [contactData, setContactData] = useState({
    email: '',
    phone: '',
    address: ''
  })
  const [socialLinks, setSocialLinks] = useState({})
  const [customLinks, setCustomLinks] = useState([])
  const [editingPlatform, setEditingPlatform] = useState(null)
  const [editForm, setEditForm] = useState({ url: '', isActive: true })

  useEffect(() => {
    fetchSocialContact()
  }, [])

  const fetchSocialContact = async () => {
    try {
      const response = await api.get('/about')
      if (response.data?.about) {
        const about = response.data.about
        setContactData({
          email: about.email || '',
          phone: about.phone || '',
          address: about.address || ''
        })

        const newSocialLinks = {}
        PLATFORMS.forEach(p => {
          newSocialLinks[p.key] = { url: '', isActive: true }
        })

        if (Array.isArray(about.socialLinks)) {
          about.socialLinks.forEach(link => {
            if (newSocialLinks[link.platform]) {
              newSocialLinks[link.platform] = {
                url: link.url,
                isActive: link.isActive !== false
              }
            }
          })
        } else if (about.social) {
          Object.entries(about.social).forEach(([key, value]) => {
            if (key !== 'customLinks' && newSocialLinks[key]) {
              newSocialLinks[key] = { url: value, isActive: true }
            }
          })
        }

        setSocialLinks(newSocialLinks)
        setCustomLinks(about.social?.customLinks || [])
      }
    } catch (error) {
      console.error('Fetch social contact error:', error)
      toast.error('Failed to load social and contact information')
    }
  }

  const handleSave = async (updatedSocialLinks = null) => {
    setLoading(true)
    try {
      const linksToSave = updatedSocialLinks && !updatedSocialLinks.nativeEvent ? updatedSocialLinks : socialLinks

      const formattedSocialLinks = Object.entries(linksToSave)
        .filter(([, data]) => data.url.trim() !== '')
        .map(([platform, data]) => ({
          platform,
          url: data.url.trim(),
          isActive: data.isActive
        }))

      const payload = {
        email: contactData.email,
        phone: contactData.phone,
        address: contactData.address,
        socialLinks: formattedSocialLinks,
        social: {
          customLinks: customLinks.filter(link => link.label && link.url)
        }
      }

      await authApi.put('/about', payload)
      toast.success('Social and contact information updated successfully')
      fetchSocialContact()
    } catch (error) {
      console.error('Update social contact error:', error)
      toast.error('Failed to update social and contact information')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (platformKey) => {
    const data = socialLinks[platformKey] || { url: '', isActive: true }
    setEditingPlatform(platformKey)
    setEditForm({ ...data })
  }

  const closeEditModal = () => {
    setEditingPlatform(null)
    setEditForm({ url: '', isActive: true })
  }

  const saveEditModal = async () => {
    const newSocialLinks = {
      ...socialLinks,
      [editingPlatform]: editForm
    }
    setSocialLinks(newSocialLinks)
    await handleSave(newSocialLinks)
    closeEditModal()
  }

  const handleContactChange = (field, value) => {
    setContactData(prev => ({ ...prev, [field]: value }))
  }



  const addCustomLink = () => {
    setCustomLinks(prev => [...prev, { label: '', url: '' }])
  }

  const removeCustomLink = (index) => {
    setCustomLinks(prev => prev.filter((_, i) => i !== index))
  }

  const updateCustomLink = (index, field, value) => {
    setCustomLinks(prev => prev.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    ))
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social & Contact Information</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your contact details and social media links</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchSocialContact}
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
              <div className="w-4 h-4 mr-2 border-2 border-paper border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="card h-fit">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="input-field pl-10"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={contactData.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="input-field pl-10"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  value={contactData.address}
                  onChange={(e) => handleContactChange('address', e.target.value)}
                  className="input-field pl-10"
                  rows="3"
                  placeholder="Your location or address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Social Media Links
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Toggle visibility to show/hide links on your public portfolio
              </p>
            </div>
            {/* Bulk Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newLinks = {};
                  Object.keys(socialLinks).forEach(key => {
                    newLinks[key] = { ...socialLinks[key], isActive: true };
                  });
                  setSocialLinks(newLinks);
                }}
                className="btn-secondary text-sm flex items-center"
              >
                <Eye className="w-4 h-4 mr-1" />
                Show All
              </button>
              <button
                onClick={() => {
                  const newLinks = {};
                  Object.keys(socialLinks).forEach(key => {
                    newLinks[key] = { ...socialLinks[key], isActive: false };
                  });
                  setSocialLinks(newLinks);
                }}
                className="btn-secondary text-sm flex items-center"
              >
                <EyeOff className="w-4 h-4 mr-1" />
                Hide All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon
              const data = socialLinks[platform.key] || { url: '', isActive: true }
              const isConfigured = data.url && data.url.trim() !== ''

              return (
                <div
                  key={platform.key}
                  className={`p-4 rounded-lg border transition-all duration-200 ${isConfigured
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 opacity-70 hover:opacity-100'
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isConfigured ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{platform.label}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isConfigured ? (data.isActive ? 'Visible' : 'Hidden') : 'Not configured'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isConfigured && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded">
                        {data.url}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => openEditModal(platform.key)}
                    className="w-full py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {isConfigured ? 'Edit Link' : 'Add Link'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Custom Links Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <LinkIcon className="w-5 h-5 mr-2" />
              Custom Links
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add any other social or professional links not listed above
            </p>
          </div>
          <button
            onClick={addCustomLink}
            className="btn-secondary flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </button>
        </div>

        {customLinks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No custom links added yet</p>
            <p className="text-sm">Click &quot;Add Link&quot; to add custom social or professional links</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customLinks.map((link, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Label / Platform Name
                  </label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateCustomLink(index, 'label', e.target.value)}
                    className="input-field"
                    placeholder="e.g., Portfolio, Blog, Linktree"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                      className="input-field flex-1"
                      placeholder="https://example.com"
                    />
                    <button
                      onClick={() => removeCustomLink(index)}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Remove link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {editingPlatform && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {(() => {
                  const p = PLATFORMS.find(p => p.key === editingPlatform)
                  const Icon = p?.icon || LinkIcon
                  return (
                    <>
                      <Icon className="w-5 h-5 text-primary-600" />
                      Edit {p?.label}
                    </>
                  )
                })()}
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile URL
                </label>
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                  className="input-field"
                  placeholder={`https://${editingPlatform}.com/...`}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">Visibility</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {editForm.isActive ? 'Visible on your portfolio' : 'Hidden from your portfolio'}
                  </span>
                </div>
                <button
                  onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${editForm.isActive ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${editForm.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-sm font-medium text-ink hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditModal}
                className="px-4 py-2 text-sm font-medium bg-ink text-paper hover:bg-ink/90 rounded-lg shadow-sm hover:shadow transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SocialContactManagement
