import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, RefreshCw, Mail, Phone, MapPin, Linkedin, Github, Twitter, Instagram, Youtube, Facebook, Globe, MessageCircle, Camera, Send, MessageSquare, Twitch, Hash, Code2, Palette, Figma, Plus, X, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'

const SocialContactManagement = () => {
  const [loading, setLoading] = useState(false)
  const [socialData, setSocialData] = useState({
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    github: '',
    twitter: '',
    instagram: '',
    youtube: '',
    facebook: '',
    tiktok: '',
    snapchat: '',
    pinterest: '',
    reddit: '',
    discord: '',
    twitch: '',
    medium: '',
    stackoverflow: '',
    dribbble: '',
    behance: '',
    whatsapp: '',
    telegram: '',
    website: ''
  })
  const [customLinks, setCustomLinks] = useState([])

  useEffect(() => {
    fetchSocialContact()
  }, [])

  const fetchSocialContact = async () => {
    try {
      const res = await api.get('/about')
      if (res.data && res.data.about) {
        const about = res.data.about
        setSocialData({
          email: about.email || '',
          phone: about.phone || '',
          address: about.address || '',
          linkedin: about.social?.linkedin || '',
          github: about.social?.github || '',
          twitter: about.social?.twitter || '',
          instagram: about.social?.instagram || '',
          youtube: about.social?.youtube || '',
          facebook: about.social?.facebook || '',
          tiktok: about.social?.tiktok || '',
          snapchat: about.social?.snapchat || '',
          pinterest: about.social?.pinterest || '',
          reddit: about.social?.reddit || '',
          discord: about.social?.discord || '',
          twitch: about.social?.twitch || '',
          medium: about.social?.medium || '',
          stackoverflow: about.social?.stackoverflow || '',
          dribbble: about.social?.dribbble || '',
          behance: about.social?.behance || '',
          whatsapp: about.social?.whatsapp || '',
          telegram: about.social?.telegram || '',
          website: about.social?.website || ''
        })
        setCustomLinks(about.social?.customLinks || [])
      }
    } catch (error) {
      console.error('Fetch social contact error:', error)
      toast.error('Failed to load social and contact information')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload = {
        email: socialData.email,
        phone: socialData.phone,
        address: socialData.address,
        social: {
          linkedin: socialData.linkedin,
          github: socialData.github,
          twitter: socialData.twitter,
          instagram: socialData.instagram,
          youtube: socialData.youtube,
          facebook: socialData.facebook,
          tiktok: socialData.tiktok,
          snapchat: socialData.snapchat,
          pinterest: socialData.pinterest,
          reddit: socialData.reddit,
          discord: socialData.discord,
          twitch: socialData.twitch,
          medium: socialData.medium,
          stackoverflow: socialData.stackoverflow,
          dribbble: socialData.dribbble,
          behance: socialData.behance,
          whatsapp: socialData.whatsapp,
          telegram: socialData.telegram,
          website: socialData.website,
          customLinks: customLinks.filter(link => link.label && link.url)
        }
      }
      
      await api.put('/about', payload)
      toast.success('Social and contact information updated successfully')
      fetchSocialContact()
    } catch (error) {
      console.error('Update social contact error:', error)
      toast.error('Failed to update social and contact information')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setSocialData(prev => ({
      ...prev,
      [field]: value
    }))
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
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="card">
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
                  value={socialData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
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
                  value={socialData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
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
                  value={socialData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Social Media Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LinkedIn
              </label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GitHub
              </label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.github}
                  onChange={(e) => handleInputChange('github', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Twitter / X
              </label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instagram
              </label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                YouTube
              </label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.youtube}
                  onChange={(e) => handleInputChange('youtube', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://youtube.com/@username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Facebook
              </label>
              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://facebook.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                TikTok
              </label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.tiktok}
                  onChange={(e) => handleInputChange('tiktok', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://tiktok.com/@username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Snapchat
              </label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.snapchat}
                  onChange={(e) => handleInputChange('snapchat', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://snapchat.com/add/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pinterest
              </label>
              <div className="relative">
                <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.pinterest}
                  onChange={(e) => handleInputChange('pinterest', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://pinterest.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reddit
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.reddit}
                  onChange={(e) => handleInputChange('reddit', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://reddit.com/u/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discord
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.discord}
                  onChange={(e) => handleInputChange('discord', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://discord.gg/invite"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Twitch
              </label>
              <div className="relative">
                <Twitch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.twitch}
                  onChange={(e) => handleInputChange('twitch', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://twitch.tv/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Medium
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.medium}
                  onChange={(e) => handleInputChange('medium', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://medium.com/@username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stack Overflow
              </label>
              <div className="relative">
                <Code2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.stackoverflow}
                  onChange={(e) => handleInputChange('stackoverflow', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://stackoverflow.com/users/id"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dribbble
              </label>
              <div className="relative">
                <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.dribbble}
                  onChange={(e) => handleInputChange('dribbble', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://dribbble.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Behance
              </label>
              <div className="relative">
                <Figma className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.behance}
                  onChange={(e) => handleInputChange('behance', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://behance.net/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={socialData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="input-field pl-10"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telegram
              </label>
              <div className="relative">
                <Send className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.telegram}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://t.me/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={socialData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="input-field pl-10"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
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
            <p className="text-sm">Click "Add Link" to add custom social or professional links</p>
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
    </div>
  )
}

export default SocialContactManagement
