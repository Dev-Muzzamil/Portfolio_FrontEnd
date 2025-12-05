import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Search, RefreshCw, Upload, Download, Eye, FileText, Calendar, User, Star, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import StickyActionBar from './StickyActionBar'

const ResumeManagement = () => {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingResume, setEditingResume] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    type: 'resume',
    description: '',
    version: '',
    isActive: true,
    isDefault: false,
    tags: []
  })

  const resumeTypes = [
    'all',
    'resume',
    'cv',
    'cover-letter',
    'portfolio',
    'other'
  ]

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/resumes')
      setResumes(response.data.resumes)
    } catch (error) {
      console.error('Fetch resumes error:', error)
      toast.error('Failed to fetch resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/png'
        ]

        if (!allowedTypes.includes(file.type)) {
          toast.error(`File ${file.name} has an unsupported format`)
          continue
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 10MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
        formData.append('type', 'resume')
        formData.append('description', `Uploaded on ${new Date().toLocaleDateString()}`)

        const response = await api.post('/upload/resume', formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          }
        })

        toast.success(`Resume "${response.data.title}" uploaded successfully`)
      }

      fetchResumes()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload resume(s)')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const resumeData = {
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== '')
      }

      if (editingResume) {
        await api.put(`/resumes/${editingResume._id}`, resumeData)
        toast.success('Resume updated successfully')
      } else {
        toast.error('Please upload a file to create a resume')
        return
      }

      setIsCreating(false)
      setEditingResume(null)
      resetForm()
      fetchResumes()
    } catch (error) {
      console.error('Save resume error:', error)
      toast.error(error.response?.data?.message || 'Failed to save resume')
    }
  }

  const handleEdit = (resume) => {
    setEditingResume(resume)
    setFormData({
      title: resume.title,
      type: resume.type,
      description: resume.description || '',
      version: resume.version || '',
      isActive: resume.isActive !== false,
      isDefault: resume.isDefault || false,
      tags: resume.tags || []
    })
    setIsCreating(true)
  }

  const handleDelete = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return
    }

    try {
      await api.delete(`/resumes/${resumeId}`)
      toast.success('Resume deleted successfully')
      fetchResumes()
    } catch (error) {
      console.error('Delete resume error:', error)
      toast.error('Failed to delete resume')
    }
  }

  const handleSetDefault = async (resumeId) => {
    try {
      await api.put(`/resumes/${resumeId}/set-default`)
      toast.success('Default resume updated')
      fetchResumes()
    } catch (error) {
      console.error('Set default error:', error)
      toast.error('Failed to set default resume')
    }
  }

  const handleDownload = async (resume) => {
    try {
      const response = await api.get(`/resumes/${resume._id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${resume.title}.${resume.fileExtension}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download resume')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'resume',
      description: '',
      version: '',
      isActive: true,
      isDefault: false,
      tags: []
    })
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingResume(null)
    resetForm()
  }

  const addArrayItem = (field, value = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value]
    }))
  }

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = !searchTerm ||
      resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = selectedType === 'all' || resume.type === selectedType

    return matchesSearch && matchesType
  })

  const getTypeColor = (type) => {
    switch (type) {
      case 'resume': return 'bg-blue-100 text-blue-800'
      case 'cv': return 'bg-green-100 text-green-800'
      case 'cover-letter': return 'bg-purple-100 text-purple-800'
      case 'portfolio': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType?.includes('word')) return '📝'
    if (mimeType?.includes('image')) return '🖼️'
    return '📄'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resume & CV Management</h2>
        <div className="flex gap-4">
          <button
            onClick={fetchResumes}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center"
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Uploading resume...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setUploading(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search resumes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="input-field w-48"
        >
          <option value="all">All Types</option>
          {resumeTypes.filter(type => type !== 'all').map(type => (
            <option key={type} value={type}>
              {type === 'cover-letter' ? 'Cover Letter' : type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingResume ? 'Edit Resume Details' : 'Resume Details'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                  required
                >
                  {resumeTypes.filter(type => type !== 'all').map(type => (
                    <option key={type} value={type}>
                      {type === 'cover-letter' ? 'Cover Letter' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="input-field"
                  placeholder="e.g., v2.1, 2024"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Default</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Brief description of this resume..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Tag name"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Tag
                </button>
              </div>
            </div>

            {/* Inline actions removed; use sticky action bar to save/cancel */}
          </form>
        </motion.div>
      )}

      {/* Resumes List */}
      <div className="card">
        <div className="space-y-4">
          {filteredResumes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No resumes found
            </div>
          ) : (
            filteredResumes.map((resume) => (
              <div key={resume._id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="text-2xl">{getFileIcon(resume.mimeType)}</div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {resume.title}
                          {resume.isDefault && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 text-xs rounded-md ${getTypeColor(resume.type)}`}>
                            {resume.type === 'cover-letter' ? 'Cover Letter' : resume.type.charAt(0).toUpperCase() + resume.type.slice(1)}
                          </span>
                          <span>{formatFileSize(resume.size)}</span>
                          <span>{resume.fileExtension?.toUpperCase() || 'FILE'}</span>
                          {resume.version && <span>v{resume.version}</span>}
                        </div>
                      </div>
                    </div>

                    {resume.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {resume.description}
                      </p>
                    )}

                    {resume.tags && resume.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {resume.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Uploaded: {new Date(resume.createdAt).toLocaleDateString()}</span>
                      </div>
                      {resume.updatedAt && resume.updatedAt !== resume.createdAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Updated: {new Date(resume.updatedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDownload(resume)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Download resume"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(resume.url, '_blank')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="View resume"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!resume.isDefault && (
                      <button
                        onClick={() => handleSetDefault(resume._id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(resume)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Edit resume"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {isCreating && (
        <StickyActionBar
          show={isCreating}
          onCancel={cancelEdit}
          onSave={() => document.querySelector('form')?.requestSubmit?.()}
        />
      )}
    </div>
  )
}

export default ResumeManagement
