import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Edit, Save, X, Camera, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import PhotoCropper from './PhotoCropper'
import ImageEditor from './ImageEditor'
import StickyActionBar from './StickyActionBar'

const HeroManagement = () => {
  const [heroData, setHeroData] = useState({
    name: '',
    role: '',
    tagline: '',
    backgroundImage: '',
    ctaButtons: []
  })
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)

  // Fetch hero data on component mount
  useEffect(() => {
    fetchHeroData()
  }, [])

  const fetchHeroData = async () => {
    try {
      const response = await api.get('/hero')
      if (response.data.hero) {
        setHeroData(response.data.hero)
        setPreviewImage(response.data.hero.backgroundImage)
      }
    } catch (error) {
      console.error('Error fetching hero data:', error)
      toast.error('Failed to load hero data')
    }
  }

  const handleInputChange = (field, value) => {
    setHeroData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCTAChange = (index, field, value) => {
    setHeroData(prev => ({
      ...prev,
      ctaButtons: prev.ctaButtons.map((btn, i) =>
        i === index ? { ...btn, [field]: value } : btn
      )
    }))
  }

  const removeCTA = (index) => {
    setHeroData(prev => ({
      ...prev,
      ctaButtons: (prev.ctaButtons || []).filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
    setHeroData(prev => ({
      ...prev,
      backgroundImage: dataUrl
    }))
    setShowCropper(false)
    setSelectedImage(null)
    toast.success('Image cropped successfully!')
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // If we have a data URL, we need to upload it as a file
      let imageUrl = heroData.backgroundImage

      if (heroData.backgroundImage && heroData.backgroundImage.startsWith('data:')) {
        // Convert data URL to blob and upload
        const response = await fetch(heroData.backgroundImage)
        const blob = await response.blob()

        const formData = new FormData()
        formData.append('image', blob, 'hero-image.jpg')

        let uploadResponse
        try {
          uploadResponse = await api.post('/upload/image', formData)
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr)
          toast.error(uploadErr.response?.data?.message || 'Image upload failed')
          setLoading(false)
          return
        }

        imageUrl = uploadResponse.data.url
      }

      const dataToSave = {
        ...heroData,
        backgroundImage: imageUrl,
        // Only send CTA buttons if there is at least one non-empty CTA
        ctaButtons: Array.isArray(heroData.ctaButtons)
          ? heroData.ctaButtons.filter(btn => (btn.text?.trim() || btn.url?.trim()))
          : []
      }

      await api.put('/hero', dataToSave)
      setHeroData(prev => ({ ...prev, backgroundImage: imageUrl }))
      setEditing(false)
      toast.success('Hero section updated successfully!')
    } catch (error) {
      console.error('Error saving hero data:', error)
      toast.error('Failed to save hero section')
    } finally {
      setLoading(false)
    }
  }

  const removeImage = () => {
    setHeroData(prev => ({ ...prev, backgroundImage: '' }))
    setPreviewImage(null)
  }

  if (showCropper) {
    // Use the full image editor instead of the limited cropper
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Section</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your portfolio hero section</p>
        </div>
        <div className="flex gap-3">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Hero
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
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={heroData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role/Title *
                </label>
                <input
                  type="text"
                  value={heroData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tagline *
                </label>
                <textarea
                  value={heroData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  disabled={!editing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed resize-none"
                  placeholder="A brief description of yourself"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Call-to-Action Buttons (optional)</h3>
              {editing && (
                <button
                  onClick={() => setHeroData(prev => ({
                    ...prev,
                    ctaButtons: [...(prev.ctaButtons || []), { text: '', url: '', type: 'primary' }]
                  }))}
                  className="btn-secondary"
                >
                  Add CTA
                </button>
              )}
            </div>
            {Array.isArray(heroData.ctaButtons) && heroData.ctaButtons.length > 0 ? (
              <div className="space-y-4">
                {heroData.ctaButtons.map((button, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {editing && (
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={() => removeCTA(index)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md"
                          title="Remove this CTA"
                        >
                          <X className="w-3 h-3 mr-1" /> Remove
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={button.text}
                          onChange={(e) => handleCTAChange(index, 'text', e.target.value)}
                          disabled={!editing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          URL
                        </label>
                        <input
                          type="url"
                          value={button.url}
                          onChange={(e) => handleCTAChange(index, 'url', e.target.value)}
                          disabled={!editing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No CTAs added. You can add them later or leave empty.</p>
            )}
          </div>
        </motion.div>

        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-6"
        >
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Image</h3>

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
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
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
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Hi, I'm <span className="text-primary-600 dark:text-primary-400">{heroData.name || 'Your Name'}</span>
                </h4>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {heroData.role || 'Your Role'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {heroData.tagline || 'Your tagline will appear here'}
                </p>
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

export default HeroManagement
