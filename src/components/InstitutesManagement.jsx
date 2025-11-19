import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Search, RefreshCw, Globe, MapPin, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi as api } from '../services/api'
import StickyActionBar from './StickyActionBar'

const InstitutesManagement = () => {
  const [institutes, setInstitutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingInstitute, setEditingInstitute] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    type: 'University',
    location: {
      city: '',
      state: '',
      country: ''
    },
    website: '',
    contactEmail: '',
    contactPhone: '',
    accreditation: '',
    description: '',
    logoUrl: ''
  })
  const formRef = useRef(null)

  const instituteTypes = [
    'University',
    'College',
    'Institute',
    'School',
    'Organization',
    'Company',
    'Platform',
    'Other'
  ]

  useEffect(() => {
    fetchInstitutes()
  }, [])

  const fetchInstitutes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/institutes')
      setInstitutes(response.data)
    } catch (error) {
      console.error('Fetch institutes error:', error)
      toast.error('Failed to fetch institutes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingInstitute) {
        await api.put(`/institutes/${editingInstitute._id}`, formData)
        toast.success('Institute updated successfully')
      } else {
        await api.post('/institutes', formData)
        toast.success('Institute created successfully')
      }

      setIsCreating(false)
      setEditingInstitute(null)
      resetForm()
      fetchInstitutes()
    } catch (error) {
      console.error('Save institute error:', error)
      toast.error(error.response?.data?.message || 'Failed to save institute')
    }
  }

  const handleEdit = (institute) => {
    setEditingInstitute(institute)
    setFormData({
      name: institute.name,
      type: institute.type,
      location: institute.location || { city: '', state: '', country: '' },
      website: institute.website || '',
      contactEmail: institute.contactEmail || '',
      contactPhone: institute.contactPhone || '',
      accreditation: institute.accreditation || '',
      description: institute.description || '',
      logoUrl: institute.logoUrl || ''
    })
    setIsCreating(true)
  }

  const handleDelete = async (instituteId) => {
    if (!window.confirm('Are you sure you want to delete this institute?')) {
      return
    }

    try {
      await api.delete(`/institutes/${instituteId}`)
      toast.success('Institute deleted successfully')
      fetchInstitutes()
    } catch (error) {
      console.error('Delete institute error:', error)
      toast.error('Failed to delete institute')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'University',
      location: {
        city: '',
        state: '',
        country: ''
      },
      website: '',
      contactEmail: '',
      contactPhone: '',
      accreditation: '',
      description: '',
      logoUrl: ''
    })
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingInstitute(null)
    resetForm()
  }

  const filteredInstitutes = institutes.filter(institute => {
    const matchesSearch = !searchTerm ||
      institute.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institute.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institute.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institute.location?.country?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === 'all' || institute.type === selectedType

    return matchesSearch && matchesType && institute.isActive
  })

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Institutes Management</h2>
        <div className="flex gap-4">
          <button
            onClick={fetchInstitutes}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Institute
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search institutes..."
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
          {instituteTypes.map(type => (
            <option key={type} value={type}>{type}</option>
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
            {editingInstitute ? 'Edit Institute' : 'Create New Institute'}
          </h3>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  {instituteTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="State/Province"
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value }
                  })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={formData.location.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, country: e.target.value }
                  })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="input-field"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="input-field"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Accreditation
                </label>
                <input
                  type="text"
                  value={formData.accreditation}
                  onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                  className="input-field"
                  placeholder="ABET, AACSB, etc."
                />
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
                placeholder="Brief description of the institute..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="input-field"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Inline actions removed; use sticky action bar to save/cancel */}
          </form>
        </motion.div>
      )}

      {/* Institutes List */}
      <div className="card">
        <div className="space-y-4">
          {filteredInstitutes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No institutes found
            </div>
          ) : (
            filteredInstitutes.map((institute) => (
              <div key={institute._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{institute.name}</h4>
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
                        {institute.type}
                      </span>
                    </div>

                    {institute.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {institute.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {institute.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {[
                            institute.location.city,
                            institute.location.state,
                            institute.location.country
                          ].filter(Boolean).join(', ')}
                        </div>
                      )}

                      {institute.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          <a
                            href={institute.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      )}

                      {institute.contactEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {institute.contactEmail}
                        </div>
                      )}

                      {institute.contactPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {institute.contactPhone}
                        </div>
                      )}

                      {institute.accreditation && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Accreditation:</span>
                          {institute.accreditation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(institute)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(institute._id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
          onSave={() => formRef.current?.requestSubmit()}
        />
      )}
    </div>
  )
}

export default InstitutesManagement