import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, RefreshCw, ExternalLink, Download, Upload, AlertCircle, Eye, EyeOff, FileText, Link, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import StickyActionBar from './StickyActionBar'

const CertificationsManagement = () => {
  const [certifications, setCertifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [extractedData, setExtractedData] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    issuingAuthority: '',
    issueDate: '',
    credentialId: '',
    credentialUrl: '',
    verificationUrl: '',
    description: '',
    skills: [],
    featuredSkills: [],
    isActive: true,
    status: 'published',
    visibility: 'public'
  })

  const [missingFields, setMissingFields] = useState([])
  const formRef = useRef(null)
  const fileInputRef = useRef(null)
  const reportFileInputRef = useRef(null)
  const [showAddReport, setShowAddReport] = useState(false)
  const [uploadingReport, setUploadingReport] = useState(false)
  const [newReport, setNewReport] = useState({ title: '', description: '', type: 'file', link: { url: '', platform: '', title: '' } })

  useEffect(() => {
    fetchCertifications()
  }, [])

  const fetchCertifications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/certifications')
      setCertifications(res.data.certifications || [])
    } catch (err) {
      console.error('Failed to fetch certifications', err)
      toast.error('Failed to fetch certifications')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      issuer: '',
      issuingAuthority: '',
      issueDate: '',
      credentialId: '',
      credentialUrl: '',
      verificationUrl: '',
      description: '',
      skills: [],
      featuredSkills: [],
      isActive: true,
      status: 'published',
      visibility: 'public'
    })
    setMissingFields([])
    setExtractedData(null)
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditing(null)
    setShowAddReport(false)
    setNewReport({ title: '', description: '', type: 'file', link: { url: '', platform: '', title: '' } })
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        issuer: formData.issuer || formData.issuingAuthority,
        issuingAuthority: formData.issuingAuthority || formData.issuer,
        // Convert skill objects to strings if needed
        skills: Array.isArray(formData.skills)
          ? formData.skills.map(s => typeof s === 'string' ? s : s.name || '')
          : []
      };

      // Include preview/certificateFile URL if available (from the autofill extraction)
      if (extractedData?.certificateFile) {
        submitData.certificateFile = {
          originalUrl: extractedData?.certificateFile?.originalUrl || extractedData?.certificateFile?.url || null,
          originalPublicId: extractedData?.certificateFile?.originalPublicId || extractedData?.certificateFile?.publicId || null,
          originalBytes: extractedData?.certificateFile?.originalBytes || extractedData?.certificateFile?.size || null,
          previewUrl: extractedData?.certificateFile?.previewUrl || extractedData?.certificateFile?.url || null,
          previewPublicId: extractedData?.certificateFile?.previewPublicId || extractedData?.certificateFile?.publicId || null,
          previewBytes: extractedData?.certificateFile?.previewBytes || null,
          fileType: extractedData?.certificateFile?.fileType || extractedData?.certificateFile?.type || 'preview'
        };
      }

      if (editing) {
        await api.put(`/admin/certifications/${editing._id}`, submitData)
        toast.success('Certification updated successfully')
      } else {
        await api.post('/admin/certifications', submitData)
        toast.success('Certification created successfully')
      }

      setIsCreating(false)
      setEditing(null)
      resetForm()
      fetchCertifications()
    } catch (err) {
      console.error('Save certification error', err)
      toast.error(err?.response?.data?.message || 'Failed to save certification')
    }
  }

  const handleEdit = (cert) => {
    setEditing(cert)
    setShowAddReport(false)
    setNewReport({ title: '', description: '', type: 'file', link: { url: '', platform: '', title: '' } })
    setFormData({
      title: cert.title || '',
      issuer: cert.issuer || cert.issuingAuthority || '',
      issuingAuthority: cert.issuingAuthority || cert.issuer || '',
      issueDate: cert.issueDate ? String(cert.issueDate).slice(0, 10) : '',
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
      verificationUrl: cert.verificationUrl || '',
      description: cert.description || '',
      skills: Array.isArray(cert.skills) ? cert.skills : [],
      featuredSkills: Array.isArray(cert.featuredSkills) ? cert.featuredSkills : [],
      isActive: cert.isActive !== false,
      status: cert.status || 'published',
      visibility: cert.visibility || 'public'
    })
    setIsCreating(true)
    setExtractedData(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) return
    try {
      await api.delete(`/admin/certifications/${id}`)
      toast.success('Certification deleted successfully')
      fetchCertifications()
    } catch (err) {
      console.error('Delete certification error', err)
      toast.error('Failed to delete certification')
    }
  }

  const handleToggleActive = async (cert) => {
    try {
      const res = await api.put(`/admin/certifications/${cert._id}/toggle-active`)
      toast.success(res.data.message)
      // Update local state
      setCertifications(prev => prev.map(c =>
        c._id === cert._id ? { ...c, isActive: !c.isActive } : c
      ))
    } catch (error) {
      console.error('Toggle active error:', error)
      toast.error('Failed to toggle active status')
    }
  }

  const extractDetails = async (file) => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setIsExtracting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/admin/certifications/extract-details', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total))
        }
      })

      if (res.data?.extractedData) {
        const ed = res.data.extractedData
        setExtractedData(ed)

        // Convert skill objects to strings for form display
        const skillsArray = Array.isArray(ed.skills)
          ? ed.skills.map(s => typeof s === 'string' ? s : s.name || '')
          : []

        setFormData(prev => ({
          ...prev,
          title: prev.title || ed.title,
          issuer: prev.issuer || ed.issuer,
          issuingAuthority: prev.issuingAuthority || ed.issuer,
          issueDate: prev.issueDate || ed.issueDate,
          credentialId: prev.credentialId || ed.credentialId,
          credentialUrl: prev.credentialUrl || ed.credentialUrl,
          verificationUrl: prev.verificationUrl || ed.verificationUrl,
          description: prev.description || ed.description,
          skills: prev.skills?.length ? prev.skills : skillsArray
        }))

        setMissingFields(res.data?.missingFields || [])
        toast.success('Certificate details extracted successfully!')
      } else {
        toast('No extractable data found in the file')
      }
    } catch (err) {
      console.error('Extract details error', err)
      toast.error(err?.response?.data?.message || 'Failed to extract certificate details')
    } finally {
      setIsExtracting(false)
      setUploadProgress(0)
    }
  }

  const uploadAndAutofill = async (file) => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setIsExtracting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/admin/certifications/with-autofill', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total))
        }
      })

      toast.success('Certification created with file upload!')
      resetForm()
      setIsCreating(false)
      fetchCertifications()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Autofill create error', err)

      const extracted = err?.response?.data?.extractedData
      const missing = err?.response?.data?.missingFields || []

      if (extracted) {
        setExtractedData(extracted)

        // Convert skill objects to strings for form display
        const skillsArray = Array.isArray(extracted.skills)
          ? extracted.skills.map(s => typeof s === 'string' ? s : s.name || '')
          : []

        setFormData(prev => ({
          ...prev,
          title: extracted.title || '',
          issuer: extracted.issuer || '',
          issuingAuthority: extracted.issuer || '',
          issueDate: extracted.issueDate || '',
          credentialId: extracted.credentialId || '',
          credentialUrl: extracted.credentialUrl || '',
          verificationUrl: extracted.verificationUrl || '',
          description: extracted.description || '',
          skills: skillsArray
        }))
        setMissingFields(missing)
        setIsCreating(true)

        if (missing.length > 0) {
          toast(`⚠️ Missing required fields: ${missing.join(', ')}. Please fill them manually.`, {
            duration: 5000
          })
        }

        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        return
      }

      toast.error(err?.response?.data?.message || 'Failed to create certification with autofill')
    } finally {
      setIsExtracting(false)
      setUploadProgress(0)
    }
  }

  const generateCertificateImage = async (id) => {
    try {
      toast.loading('Converting certificate to 1080p image...')
      await api.post(`/admin/certifications/${id}/generate-image`)
      toast.dismiss()
      toast.success('Certificate converted to 1080p image successfully!')
      fetchCertifications()
    } catch (err) {
      toast.dismiss()
      console.error('Generate certificate image error', err)
      toast.error(err?.response?.data?.message || 'Failed to generate certificate image')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const filtered = certifications.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (c.title || '').toLowerCase().includes(s) ||
      (c.issuer || '').toLowerCase().includes(s) ||
      (c.issuingAuthority || '').toLowerCase().includes(s) ||
      (c.credentialId || '').toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Certificates Management
        </h2>
        <div className="flex gap-3">
          <button
            onClick={fetchCertifications}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm()
              setIsCreating(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Certificate
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, issuer, or credential ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                {editing ? 'Edit Certificate' : 'Add New Certificate'}
              </h3>

              {/* Extracted Data Summary */}
              {extractedData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 space-y-4"
                >
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Certificate data extracted from file
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                          {missingFields.length > 0
                            ? `Missing: ${missingFields.join(', ')}`
                            : 'All required fields found'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Image */}
                  {(extractedData?.certificateFile?.previewUrl || extractedData?.certificateFile?.url) && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Certificate Preview
                      </p>
                      <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 max-h-96">
                        <img
                          src={extractedData?.certificateFile?.previewUrl || extractedData?.certificateFile?.originalUrl || extractedData?.certificateFile?.url}
                          alt="Certificate Preview"
                          className="w-full h-auto object-contain bg-white"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Main Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${missingFields.includes('title')
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                        } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition`}
                      placeholder="e.g., Machine Learning Specialization"
                    />
                    {missingFields.includes('title') && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">Autofill couldn&apos;t find title</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Issuing Authority *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.issuingAuthority}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        issuingAuthority: e.target.value,
                        issuer: e.target.value
                      }))}
                      className={`w-full px-3 py-2 rounded-lg border ${missingFields.includes('issuingAuthority')
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                        } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition`}
                      placeholder="e.g., Coursera, Google, Microsoft"
                    />
                    {missingFields.includes('issuingAuthority') && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">Autofill couldn&apos;t find issuer</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${missingFields.includes('issueDate')
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                        } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition`}
                    />
                    {missingFields.includes('issueDate') && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">Autofill couldn&apos;t parse date</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Credential ID
                    </label>
                    <input
                      type="text"
                      value={formData.credentialId}
                      onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                      placeholder="e.g., ML-2024-12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Credential URL
                    </label>
                    <input
                      type="url"
                      value={formData.credentialUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, credentialUrl: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                      placeholder="https://coursera.org/verify/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Verification URL
                    </label>
                    <input
                      type="url"
                      value={formData.verificationUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, verificationUrl: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                      placeholder="https://verify.example.com"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={
                      Array.isArray(formData.skills)
                        ? formData.skills.map(s => typeof s === 'string' ? s : s.name || '').join(', ')
                        : ''
                    }
                    onChange={(e) => {
                      const skills = e.target.value
                        .split(/[,;]+/)
                        .map(s => s.trim())
                        .filter(Boolean)
                      setFormData(prev => ({ ...prev, skills }))
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                    placeholder="React, Node.js, AWS, Docker"
                  />
                </div>

                {/* Featured Skills - Select which to show on card */}
                {(() => {
                  const skillsList = Array.isArray(formData.skills)
                    ? formData.skills.map(s => typeof s === 'string' ? s : s.name || '').filter(Boolean)
                    : []
                  return skillsList.length > 0 && (
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Featured Skills (shown on card preview)
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Click skills to add/remove from card preview. First 3 featured will be shown. If none selected, first 3 from all skills will be shown.
                      </p>
                      <div className="space-y-3">
                        {/* Featured (Selected) */}
                        <div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">On Card ({(formData.featuredSkills || []).length}/3)</span>
                          <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg bg-green-50/50 dark:bg-green-900/20">
                            {(formData.featuredSkills || []).length === 0 ? (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">Click skills below to add them</span>
                            ) : (
                              (formData.featuredSkills || []).map((skill, i) => (
                                <button
                                  key={`featured-${i}`}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      featuredSkills: (prev.featuredSkills || []).filter(s => s !== skill)
                                    }))
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 border border-green-300 dark:border-green-600 hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-800 dark:hover:text-red-100 hover:border-red-300 dark:hover:border-red-600 transition-colors cursor-pointer"
                                  title="Click to remove from featured"
                                >
                                  {skill} ✕
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                        {/* Available (Not Selected) */}
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Available</span>
                          <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
                            {skillsList.filter(skill => !(formData.featuredSkills || []).includes(skill)).length === 0 ? (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">All skills are featured</span>
                            ) : (
                              skillsList.filter(skill => !(formData.featuredSkills || []).includes(skill)).map((skill, i) => (
                                <button
                                  key={`available-${i}`}
                                  type="button"
                                  onClick={() => {
                                    if ((formData.featuredSkills || []).length >= 3) {
                                      toast('Maximum 3 featured skills allowed', { icon: '⚠️' })
                                      return
                                    }
                                    setFormData(prev => ({
                                      ...prev,
                                      featuredSkills: [...(prev.featuredSkills || []), skill]
                                    }))
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-green-100 dark:hover:bg-green-800 hover:text-green-800 dark:hover:text-green-100 hover:border-green-300 dark:hover:border-green-600 transition-colors cursor-pointer"
                                  title="Click to add to featured"
                                >
                                  {skill} +
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition resize-none"
                    placeholder="Describe what this certificate represents..."
                  />
                </div>

                {/* Status Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <label className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* File Upload Section */}
                {!editing && (
                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">File Upload & Auto-Extraction</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isExtracting}
                        onClick={() => {
                          const el = document.createElement('input')
                          el.type = 'file'
                          el.accept = 'application/pdf,image/*'
                          el.onchange = (ev) => extractDetails(ev.target.files?.[0])
                          el.click()
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Extract Details Only
                      </button>
                      <button
                        type="button"
                        disabled={isExtracting}
                        onClick={() => {
                          const el = document.createElement('input')
                          el.type = 'file'
                          el.accept = 'application/pdf,image/*'
                          el.onchange = (ev) => uploadAndAutofill(ev.target.files?.[0])
                          el.click()
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload & Auto-fill
                      </button>
                    </div>
                    {isExtracting && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {uploadProgress}% - Processing file...
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reports Section - Only show when editing an existing certificate */}
                {editing && (
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <FileText className="w-5 h-5" />
                        Related Documents
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddReport(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Document
                      </button>
                    </div>

                    {/* Existing Reports */}
                    {editing.reports && editing.reports.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {editing.reports.map((report) => (
                          <div key={report._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                              {report.type === 'file' ? (
                                <FileText className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Link className="w-5 h-5 text-green-600" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{report.title}</p>
                                {report.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{report.description}</p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {report.type === 'file' && report.file?.originalName ? report.file.originalName : ''}
                                  {report.type === 'link' && report.link?.url ? report.link.url : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {report.type === 'file' && report.file?.url && (
                                <a
                                  href={report.file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:text-blue-700"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                              {report.type === 'link' && report.link?.url && (
                                <a
                                  href={report.link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-green-600 hover:text-green-700"
                                  title="Open link"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm('Delete this document?')) return
                                  try {
                                    await api.delete(`/admin/certifications/${editing._id}/reports/${report._id}`)
                                    toast.success('Document deleted')
                                    // Refresh the certification data
                                    const res = await api.get(`/admin/certifications/${editing._id}`)
                                    setEditing(res.data.certification)
                                  } catch (err) {
                                    console.error('Delete report error:', err)
                                    toast.error(err?.response?.data?.message || 'Failed to delete document')
                                  }
                                }}
                                className="p-2 text-red-600 hover:text-red-700"
                                title="Delete document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No related documents added yet.</p>
                    )}

                    {/* Add Report Form */}
                    {showAddReport && (
                      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Document Title *</label>
                            <input
                              type="text"
                              value={newReport.title}
                              onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="e.g., Course Transcript, Badge"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                            <select
                              value={newReport.type}
                              onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="file">Upload File</option>
                              <option value="link">External Link</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                          <input
                            type="text"
                            value={newReport.description}
                            onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="Brief description of the document"
                          />
                        </div>

                        {newReport.type === 'link' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Link URL *</label>
                              <input
                                type="url"
                                value={newReport.link.url}
                                onChange={(e) => setNewReport(prev => ({ ...prev, link: { ...prev.link, url: e.target.value } }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="https://credly.com/..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Platform</label>
                              <input
                                type="text"
                                value={newReport.link.platform}
                                onChange={(e) => setNewReport(prev => ({ ...prev, link: { ...prev.link, platform: e.target.value } }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="Credly, LinkedIn..."
                              />
                            </div>
                          </div>
                        )}

                        {newReport.type === 'file' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Upload File</label>
                            <input
                              ref={reportFileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.zip,.rar,.7z,image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                if (!newReport.title.trim()) {
                                  toast.error('Please enter a document title first')
                                  return
                                }
                                setUploadingReport(true)
                                try {
                                  const fd = new FormData()
                                  fd.append('file', file)
                                  const res = await api.post('/upload/certifications/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                  
                                  // Add the report with the uploaded file
                                  await api.post(`/admin/certifications/${editing._id}/reports`, {
                                    title: newReport.title,
                                    description: newReport.description,
                                    type: 'file',
                                    file: {
                                      url: res.data.url,
                                      publicId: res.data.publicId,
                                      originalName: res.data.originalName,
                                      mimeType: res.data.mimeType,
                                      size: res.data.size
                                    },
                                    visible: true
                                  })

                                  toast.success('Document added successfully')
                                  setNewReport({ title: '', description: '', type: 'file', link: { url: '', platform: '', title: '' } })
                                  setShowAddReport(false)
                                  
                                  // Refresh the certification data
                                  const certRes = await api.get(`/admin/certifications/${editing._id}`)
                                  setEditing(certRes.data.certification)
                                } catch (err) {
                                  console.error('Upload report error:', err)
                                  toast.error(err?.response?.data?.message || 'Failed to upload document')
                                } finally {
                                  setUploadingReport(false)
                                  if (reportFileInputRef.current) reportFileInputRef.current.value = ''
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => reportFileInputRef.current?.click()}
                              disabled={uploadingReport}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                            >
                              {uploadingReport ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Choose File
                                </>
                              )}
                            </button>
                            <p className="text-xs text-gray-500 mt-1">Supported: PDF, Word, Excel, PowerPoint, images, archives (max 25MB)</p>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddReport(false)
                              setNewReport({ title: '', description: '', type: 'file', link: { url: '', platform: '', title: '' } })
                            }}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                          {newReport.type === 'link' && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newReport.title.trim()) {
                                  toast.error('Document title is required')
                                  return
                                }
                                if (!newReport.link.url.trim()) {
                                  toast.error('Link URL is required')
                                  return
                                }
                                try {
                                  await api.post(`/admin/certifications/${editing._id}/reports`, {
                                    title: newReport.title,
                                    description: newReport.description,
                                    type: 'link',
                                    link: {
                                      url: newReport.link.url,
                                      platform: newReport.link.platform,
                                      title: newReport.link.title || newReport.title
                                    },
                                    visible: true
                                  })
                                  toast.success('Link added')
                                  setNewReport({ title: '', description: '', type: 'file', link: { url: '', platform: '', title: '' } })
                                  setShowAddReport(false)
                                  
                                  // Refresh the certification data
                                  const certRes = await api.get(`/admin/certifications/${editing._id}`)
                                  setEditing(certRes.data.certification)
                                } catch (err) {
                                  console.error('Add report link error:', err)
                                  toast.error(err?.response?.data?.message || 'Failed to add link')
                                }
                              }}
                              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                            >
                              Add Link
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Actions: actions moved to universal sticky action bar */}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificates List */}
      <div className="grid gap-6">
        {filtered.length === 0 && !isCreating ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No certificates found</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Create your first certificate
            </button>
          </div>
        ) : (
          filtered.filter(Boolean).map((cert, idx) => (
            <motion.div
              key={cert?._id || idx}
              layout
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Certificate Image */}
                  {cert.certificateFile?.previewUrl || cert.certificateFile?.originalUrl || cert.certificateUrl || cert.certificateFile?.url ? (
                    <div className="lg:col-span-1">
                      <a
                        href={cert.certificateFile?.originalUrl || cert.certificateUrl || cert.certificateFile?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block group"
                      >
                        <img
                          src={cert.certificateFile?.previewUrl || cert.certificateFile?.originalUrl || cert.certificateFile?.url || cert.certificateUrl}
                          alt={cert.title}
                          className="w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm group-hover:shadow-md transition-all"
                        />
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                        Click to view full size
                      </p>
                    </div>
                  ) : null}

                  {/* Certificate Details */}
                  <div className={cert.certificateFile?.previewUrl || cert.certificateFile?.originalUrl || cert.certificateUrl || cert.certificateFile?.url ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {cert.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {cert.issuingAuthority || cert.issuer}
                          {cert.issueDate && ` • ${new Date(cert.issueDate).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(cert)}
                          className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                          title={cert.isActive ? 'Hide certification' : 'Show certification'}
                        >
                          {cert.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleEdit(cert)}
                          className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cert._id)}
                          className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {cert.description && typeof cert.description === 'string' && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                        {cert.description}
                      </p>
                    )}

                    {/* Skills */}
                    {cert.skills && cert.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {cert.skills.map((skill, i) => {
                          const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
                          return skillName ? (
                            <span
                              key={i}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
                            >
                              {skillName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={cert.isActive !== false}
                          onChange={async () => {
                            try {
                              await api.put(`/admin/certifications/${cert._id}`, {
                                isActive: cert.isActive === false
                              })
                              toast.success('Status updated')
                              fetchCertifications()
                            } catch (err) {
                              toast.error('Failed to update status')
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-gray-600 dark:text-gray-400">
                          {cert.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </label>

                      {cert.verificationUrl && (
                        <a
                          href={cert.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Verify
                        </a>
                      )}

                      {cert.credentialId && (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          ID: {cert.credentialId}
                        </span>
                      )}

                      {cert.certificateFile && !(cert.certificateUrl || cert.certificateFile?.previewUrl || cert.certificateFile?.url) && (
                        <button
                          onClick={() => generateCertificateImage(cert._id)}
                          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Generate 1080p Image
                        </button>
                      )}
                    </div>
                    {extractedData?.certificateFile?.originalUrl && (
                      <div className="mt-2 text-right">
                        <a
                          href={extractedData?.certificateFile?.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                        >
                          <Download className="w-4 h-4" />
                          Download Original
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isCreating && (
        <StickyActionBar
          show={isCreating}
          onCancel={cancelEdit}
          onSave={() => formRef.current?.requestSubmit()}
        />
      )}
    </div>
  )
}

export default CertificationsManagement
