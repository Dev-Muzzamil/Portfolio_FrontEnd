import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Edit, X, Plus, Trash2, Upload, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import ImageEditor from './ImageEditor'
import StickyActionBar from './StickyActionBar'

const AboutManagement = () => {
  const [aboutData, setAboutData] = useState({
    summary: '',
    professionalBackground: '',
    photo: '',
    keyAchievements: [],
    // socialLinks, email, phone, location removed from About admin UI
    // Legacy numeric stats (kept for backward compatibility)
    yearsExperience: 0,
    projectsCount: 0,
    technologiesCount: 0,
    certificatesCount: 0,
    // New flexible statistics bar
    showStatistics: true,
    statistics: [], // [{ label: string, value: number, isActive?: boolean }]
    bio: [],
    experience: [],
    education: [],
    resumes: []
  })
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)

  const fetchAboutData = useCallback(async () => {
    try {
      const response = await api.get('/about')
      if (response.data.about) {
        // Merge server data with our local defaults so missing fields remain defined
        const srv = response.data.about
        const withDefaults = { ...aboutData, ...srv }
        // Ensure bio is always an array for editor usability
        if (typeof withDefaults.bio === 'string') {
          // Split by blank lines or single newlines into paragraphs
          const parts = withDefaults.bio
            .split(/\n{2,}|\r?\n/)
            .map(s => s.trim())
            .filter(Boolean)
          withDefaults.bio = parts
        } else if (!Array.isArray(withDefaults.bio)) {
          withDefaults.bio = []
        }
        // Prime flexible statistics from legacy numbers if not present
        if (!Array.isArray(srv.statistics)) {
          const stats = []
          if (srv.yearsExperience > 0) stats.push({ label: 'Years Experience', value: srv.yearsExperience, isActive: true })
          if (srv.projectsCount > 0) stats.push({ label: 'Projects', value: srv.projectsCount, isActive: true })
          if (srv.technologiesCount > 0) stats.push({ label: 'Technologies', value: srv.technologiesCount, isActive: true })
          if (srv.certificatesCount > 0) stats.push({ label: 'Certificates', value: srv.certificatesCount, isActive: true })
          withDefaults.statistics = stats
          withDefaults.showStatistics = stats.length > 0
        }
        // Normalize achievements date fields for new precision controls
        if (Array.isArray(withDefaults.keyAchievements)) {
          withDefaults.keyAchievements = withDefaults.keyAchievements.map(a => {
            const out = { title: '', description: '', precision: 'year', year: '', month: '' }
            Object.assign(out, a)
            // Derive precision/year/month from legacy 'date' if present
            if (!out.year && typeof out.date === 'string' && out.date) {
              const d = out.date.trim()
              const m = d.match(/^(\d{4})-(\d{2})/) || d.match(/^(\d{4})\/(\d{2})/)
              const y = d.match(/^(\d{4})$/)
              if (m) {
                out.year = m[1]
                out.month = m[2]
                out.precision = 'month-year'
              } else if (y) {
                out.year = y[1]
                out.precision = 'year'
              }
            }
            return out
          })
        }
        // Remove contact/social fields from the editable about record
        delete withDefaults.email
        delete withDefaults.phone
        delete withDefaults.location
        delete withDefaults.socialLinks
        setAboutData(prev => ({ ...prev, ...withDefaults }))
        setPreviewImage(response.data.about.photo)
      }
    } catch (error) {
      console.error('Error fetching about data:', error)
      toast.error('Failed to load about data')
    }
  }, [aboutData])

  useEffect(() => {
    fetchAboutData()
  }, [fetchAboutData])

  const handleInputChange = (field, value) => {
    setAboutData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field, index, subField, value) => {
    setAboutData(prev => {
      const arr = Array.isArray(prev[field]) ? prev[field] : []
      return {
        ...prev,
        [field]: arr.map((item, i) => (i === index ? { ...item, [subField]: value } : item))
      }
    })
  }

  // For arrays of primitive strings (e.g., bio paragraphs)
  const handleStringArrayChange = (field, index, value) => {
    setAboutData(prev => {
      const arr = Array.isArray(prev[field]) ? [...prev[field]] : []
      arr[index] = value
      return { ...prev, [field]: arr }
    })
  }

  const addArrayItem = (field, defaultItem) => {
    setAboutData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) ? [...prev[field], defaultItem] : [defaultItem]
    }))
  }

  const removeArrayItem = (field, index) => {
    setAboutData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) ? prev[field].filter((_, i) => i !== index) : []
    }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target.result)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (blob, dataUrl) => {
    setPreviewImage(dataUrl)
    setAboutData(prev => ({
      ...prev,
      photo: dataUrl
    }))
    setShowCropper(false)
    setSelectedImage(null)
    toast.success('Image cropped successfully!')
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      let imageUrl = aboutData.photo

      if (aboutData.photo && aboutData.photo.startsWith('data:')) {
        const response = await fetch(aboutData.photo)
        const blob = await response.blob()

        const formData = new FormData()
        formData.append('image', blob, 'about-photo.jpg')

        const uploadResponse = await api.post('/upload/image', formData)
        imageUrl = uploadResponse.data.url
      }

      // Map flexible statistics back to legacy numeric fields for compatibility
      const mapStat = (needle) => {
        const item = (aboutData.statistics || []).find(s => new RegExp(needle, 'i').test(s.label || ''))
        return item ? parseInt(item.value, 10) || 0 : 0
      }
      const yearsExperience = mapStat('year') || aboutData.yearsExperience || 0
      const projectsCount = mapStat('project') || aboutData.projectsCount || 0
      const technologiesCount = mapStat('technolog') || aboutData.technologiesCount || 0
      const certificatesCount = mapStat('certificat') || aboutData.certificatesCount || 0

      // Prepare achievements date fields for compatibility and display
      const preparedAchievements = (Array.isArray(aboutData.keyAchievements) ? aboutData.keyAchievements : []).map(a => {
        const copy = { ...a }
        const y = (copy.year || '').toString().padStart(4, '0')
        const m = (copy.month || '').toString().padStart(2, '0')
        if (copy.precision === 'month-year' && y && m) {
          copy.date = `${y}-${m}-01` // ISO-like for compatibility
          copy.dateLabel = `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(m, 10) - 1]} ${y}`
        } else if (y) {
          copy.date = `${y}-01-01`
          copy.dateLabel = y
        } else {
          copy.date = ''
          copy.dateLabel = ''
        }
        return copy
      })

      const dataToSave = {
        ...aboutData,
        photo: imageUrl,
        yearsExperience,
        projectsCount,
        technologiesCount,
        certificatesCount,
        keyAchievements: preparedAchievements,
      }

      await api.put('/about', dataToSave)
      setAboutData(prev => ({ ...prev, photo: imageUrl }))
      setEditing(false)
      toast.success('About section updated successfully!')
    } catch (error) {
      console.error('Error saving about data:', error)
      toast.error('Failed to save about section')
    } finally {
      setLoading(false)
    }
  }

  const removeImage = () => {
    setAboutData(prev => ({ ...prev, photo: '' }))
    setPreviewImage(null)
  }

  if (showCropper) {
    // Use the full image editor for a better cropping/editing experience (same as Hero)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <ImageEditor
          imageSrc={selectedImage}
          onEditComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setSelectedImage(null)
          }}
          className="max-w-4xl w-full max-h-[90vh] overflow-auto"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About Section</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your about section content</p>
        </div>
        <div className="flex gap-3">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit About
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Summary *
                </label>
                <textarea
                  value={aboutData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  disabled={!editing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed resize-none"
                  placeholder="Brief summary about yourself"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Professional Background *
                </label>
                <textarea
                  value={aboutData.professionalBackground}
                  onChange={(e) => handleInputChange('professionalBackground', e.target.value)}
                  disabled={!editing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed resize-none"
                  placeholder="Your professional background and experience"
                />
              </div>
            </div>
          </div>

          {/* Contact Information REMOVED: Centralized in Social & Contact tab */}

          {/* Statistics (Flexible) */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Statistics</h3>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={aboutData.showStatistics}
                  onChange={(e) => handleInputChange('showStatistics', e.target.checked)}
                  disabled={!editing}
                />
                Show statistics bar
              </label>
            </div>

            <div className="space-y-3">
              {(Array.isArray(aboutData.statistics) ? aboutData.statistics : []).map((stat, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        setAboutData(prev => ({
                          ...prev,
                          statistics: prev.statistics.map((s, i) => i === index ? { ...s, label: e.target.value } : s)
                        }))
                      }}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      placeholder="e.g., Years Experience"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Value
                    </label>
                    <input
                      type="number"
                      value={stat.value}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0
                        setAboutData(prev => ({
                          ...prev,
                          statistics: prev.statistics.map((s, i) => i === index ? { ...s, value: v } : s)
                        }))
                      }}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Active
                    </label>
                    <div className="h-[42px] flex items-center">
                      <input
                        type="checkbox"
                        checked={stat.isActive !== false}
                        onChange={(e) => {
                          setAboutData(prev => ({
                            ...prev,
                            statistics: prev.statistics.map((s, i) => i === index ? { ...s, isActive: e.target.checked } : s)
                          }))
                        }}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pb-1">
                    {editing && (
                      <button
                        type="button"
                        onClick={() => setAboutData(prev => ({
                          ...prev,
                          statistics: prev.statistics.filter((_, i) => i !== index)
                        }))}
                        className="p-2 text-red-600 hover:text-red-700"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {editing && (
                <button
                  type="button"
                  onClick={() => setAboutData(prev => ({
                    ...prev,
                    statistics: [...(prev.statistics || []), { label: '', value: 0, isActive: true }]
                  }))}
                  className="btn-secondary text-sm"
                >
                  + Add Stat
                </button>
              )}
            </div>
          </div>

          {/* Bio Paragraphs */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bio Paragraphs</h3>
              {editing && (
                <button
                  onClick={() => addArrayItem('bio', '')}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Paragraph
                </button>
              )}
            </div>
            <div className="space-y-4">
              {(Array.isArray(aboutData.bio) ? aboutData.bio : []).map((paragraph, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={paragraph}
                    onChange={(e) => handleStringArrayChange('bio', index, e.target.value)}
                    disabled={!editing}
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed resize-none"
                    placeholder="Bio paragraph..."
                  />
                  {editing && (
                    <button
                      onClick={() => removeArrayItem('bio', index)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Achievements */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Achievements</h3>
              {editing && (
                <button
                  onClick={() => addArrayItem('keyAchievements', { title: '', description: '', precision: 'year', year: '', month: '' })}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Achievement
                </button>
              )}
            </div>
            <div className="space-y-4">
              {(Array.isArray(aboutData.keyAchievements) ? aboutData.keyAchievements : []).map((achievement, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={achievement.title}
                        onChange={(e) => handleArrayChange('keyAchievements', index, 'title', e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date (optional)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={achievement.precision || 'year'}
                          onChange={(e) => handleArrayChange('keyAchievements', index, 'precision', e.target.value)}
                          disabled={!editing}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        >
                          <option value="year">Year</option>
                          <option value="month-year">Month + Year</option>
                        </select>
                        <select
                          value={achievement.month || ''}
                          onChange={(e) => handleArrayChange('keyAchievements', index, 'month', e.target.value)}
                          disabled={!editing || (achievement.precision !== 'month-year')}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        >
                          <option value="">Month</option>
                          <option value="01">Jan</option>
                          <option value="02">Feb</option>
                          <option value="03">Mar</option>
                          <option value="04">Apr</option>
                          <option value="05">May</option>
                          <option value="06">Jun</option>
                          <option value="07">Jul</option>
                          <option value="08">Aug</option>
                          <option value="09">Sep</option>
                          <option value="10">Oct</option>
                          <option value="11">Nov</option>
                          <option value="12">Dec</option>
                        </select>
                        <input
                          type="number"
                          value={achievement.year || ''}
                          onChange={(e) => handleArrayChange('keyAchievements', index, 'year', e.target.value.replace(/\D/g, '').slice(0, 4))}
                          disabled={!editing}
                          placeholder="Year"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Leave blank if you don&apos;t want to show a date.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={achievement.description}
                      onChange={(e) => handleArrayChange('keyAchievements', index, 'description', e.target.value)}
                      disabled={!editing}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed resize-none"
                    />
                  </div>
                  {editing && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => removeArrayItem('keyAchievements', index)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Social Links REMOVED: Centralized in Social & Contact tab */}
        </motion.div>

        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-6"
        >
          {/* Profile Photo (same UX as Hero) */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Photo</h3>

            {/* Image Preview */}
            <div className="mb-4">
              {previewImage ? (
                <div className="relative">
                  <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {editing && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-colors"
                        title="Change image"
                      >
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={removeImage}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No image selected</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            {editing && (
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {previewImage ? 'Change Image' : 'Upload Image'}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Max file size: 5MB. Recommended: Square images (1:1 aspect ratio)
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Live Preview</h3>
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6">
              <div className="text-center">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  About Me
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {aboutData.summary || 'Your summary will appear here...'}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {/* contact info removed from preview */}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <StickyActionBar
        show={editing}
        onCancel={() => setEditing(false)}
        onSave={handleSave}
        isSaving={loading}
      />
    </div>
  )
}

export default AboutManagement
