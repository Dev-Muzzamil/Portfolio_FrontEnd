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
          <h2 className="font-serif text-3xl text-ink">Hero Section</h2>
          <p className="font-sans text-sm text-ink/60">Manage your portfolio hero section</p>
        </div>
        <div className="flex gap-3">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center px-4 py-2 bg-ink text-paper rounded-full font-sans text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors"
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
          <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-soft p-6 shadow-sm">
            <h3 className="font-serif text-xl text-ink mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-widest text-gray mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={heroData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!editing}
                  className="w-full px-4 py-3 bg-paper/50 border border-ink/10 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent text-ink placeholder-ink/30 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-widest text-gray mb-2">
                  Role/Title *
                </label>
                <input
                  type="text"
                  value={heroData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={!editing}
                  className="w-full px-4 py-3 bg-paper/50 border border-ink/10 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent text-ink placeholder-ink/30 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-widest text-gray mb-2">
                  Tagline *
                </label>
                <textarea
                  value={heroData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  disabled={!editing}
                  rows={3}
                  className="w-full px-4 py-3 bg-paper/50 border border-ink/10 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent text-ink placeholder-ink/30 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  placeholder="A brief description of yourself"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-soft p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ink">Call-to-Action Buttons</h3>
              {editing && (
                <button
                  onClick={() => setHeroData(prev => ({
                    ...prev,
                    ctaButtons: [...(prev.ctaButtons || []), { text: '', url: '', type: 'primary' }]
                  }))}
                  className="px-3 py-1 bg-ink/10 text-ink rounded-full text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors"
                >
                  Add CTA
                </button>
              )}
            </div>
            {Array.isArray(heroData.ctaButtons) && heroData.ctaButtons.length > 0 ? (
              <div className="space-y-4">
                {heroData.ctaButtons.map((button, index) => (
                  <div key={index} className="p-4 border border-ink/10 rounded-lg bg-paper/30">
                    {editing && (
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={() => removeCTA(index)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                          title="Remove this CTA"
                        >
                          <X className="w-3 h-3 mr-1" /> Remove
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-sans text-[10px] font-bold uppercase tracking-widest text-gray mb-2">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={button.text}
                          onChange={(e) => handleCTAChange(index, 'text', e.target.value)}
                          disabled={!editing}
                          className="w-full px-3 py-2 bg-paper border border-ink/10 rounded-md focus:border-accent outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-sans text-[10px] font-bold uppercase tracking-widest text-gray mb-2">
                          URL
                        </label>
                        <input
                          type="url"
                          value={button.url}
                          onChange={(e) => handleCTAChange(index, 'url', e.target.value)}
                          disabled={!editing}
                          className="w-full px-3 py-2 bg-paper border border-ink/10 rounded-md focus:border-accent outline-none text-sm"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/40 italic">No CTAs added.</p>
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
          <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-soft p-6 shadow-sm">
            <h3 className="font-serif text-xl text-ink mb-4">Profile Image</h3>

            {/* Image Preview */}
            <div className="mb-4">
              {previewImage ? (
                <div className="relative">
                  <div className="w-48 h-48 mx-auto rounded-arch overflow-hidden border-4 border-paper shadow-lg">
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
                        className="p-2 bg-ink text-paper rounded-full shadow-lg hover:bg-accent transition-colors"
                        title="Change image"
                      >
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={removeImage}
                        className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto rounded-arch border-4 border-dashed border-ink/10 flex items-center justify-center bg-paper/50">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-ink/20 mx-auto mb-2" />
                    <p className="text-xs text-ink/40 uppercase tracking-widest">No image</p>
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
                  className="inline-flex items-center px-4 py-2 bg-paper border border-ink/10 hover:border-accent text-ink rounded-full transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {previewImage ? 'Change Image' : 'Upload Image'}
                </button>
                <p className="text-[10px] text-ink/40 mt-2 uppercase tracking-wide">
                  Max 5MB • Square Recommended
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-soft p-6 shadow-sm">
            <h3 className="font-serif text-xl text-ink mb-4">Live Preview</h3>
            <div className="bg-paper border border-ink/5 rounded-lg p-8 text-center">
              <h4 className="font-serif text-4xl text-ink mb-2 leading-none">
                Hi, I&apos;m <span className="italic text-accent">{heroData.name || 'Your Name'}</span>
              </h4>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-gray mb-4">
                {heroData.role || 'Your Role'}
              </p>
              <p className="font-serif text-lg text-ink/80 leading-relaxed">
                {heroData.tagline || 'Your tagline will appear here'}
              </p>
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
